import { useEffect, useRef, useCallback } from 'react';
import { detectGesture } from '../utils/gestureDetection';
import type { GestureState } from '../utils/gestureDetection';

interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onGesture: (state: GestureState) => void;
  enabled: boolean;
  onError?: (msg: string) => void;
  onLoading?: (loading: boolean) => void;
}

// ── Singleton MediaPipe loader ────────────────────────────────────
// Prevents multiple script tags and ensures one global load
let mpScriptLoaded = false;
let mpScriptLoading = false;
const mpWaiters: Array<(ok: boolean) => void> = [];

function loadMediaPipeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (mpScriptLoaded) { resolve(true); return; }
    if (mpScriptLoading) { mpWaiters.push(resolve); return; }

    mpScriptLoading = true;
    const src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      mpScriptLoaded = true;
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      mpScriptLoaded = true;
      mpScriptLoading = false;
      mpWaiters.forEach((fn) => fn(true));
      mpWaiters.length = 0;
      resolve(true);
    };

    script.onerror = () => {
      mpScriptLoading = false;
      mpWaiters.forEach((fn) => fn(false));
      mpWaiters.length = 0;
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

// ── Hook ──────────────────────────────────────────────────────────
export function useHandTracking({
  videoRef,
  onGesture,
  enabled,
  onError,
  onLoading,
}: UseHandTrackingOptions) {
  // ── All callbacks stored as refs so they NEVER trigger effect re-runs ──
  const onGestureRef = useRef(onGesture);
  const onErrorRef = useRef(onError);
  const onLoadingRef = useRef(onLoading);

  // Keep refs up to date on every render without causing effect re-fires
  onGestureRef.current = onGesture;
  onErrorRef.current = onError;
  onLoadingRef.current = onLoading;

  // Shared refs for the running session
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Tears down camera + MediaPipe cleanly
  const cleanup = useCallback(() => {
    isRunningRef.current = false;
    isProcessingRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    if (handsRef.current) {
      try { handsRef.current.close(); } catch (_) {}
      handsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, [videoRef]);

  // ── Main effect — only re-runs when `enabled` changes ────────────
  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    // `cancelled` is scoped to this effect invocation
    let cancelled = false;
    // Track hands locally so cleanup can close it even during init
    let localHands: any = null;

    const run = async () => {
      const video = videoRef.current;
      if (!video) return;

      onLoadingRef.current?.(true);

      // ── 1. Get camera stream ──────────────────────────────────────
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
      } catch (err: any) {
        if (cancelled) return;
        let msg = 'Camera access is required. Please allow camera permission and try again.';
        if (err.name === 'NotFoundError')  msg = 'No webcam found. Please connect a camera.';
        if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Allow it in browser settings.';
        onErrorRef.current?.(msg);
        onLoadingRef.current?.(false);
        return;
      }

      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      video.srcObject = stream;

      // Wait for video metadata
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => resolve();
        });
      }

      try { await video.play(); } catch (_) { /* browser may autoplay */ }

      if (cancelled) return;

      // ── 2. Load MediaPipe script from CDN ─────────────────────────
      const loaded = await loadMediaPipeScript();
      if (cancelled) return;

      if (!loaded || !(window as any).Hands) {
        onErrorRef.current?.('Failed to load hand tracking library. Check your internet connection.');
        onLoadingRef.current?.(false);
        return;
      }

      // ── 3. Create Hands instance ──────────────────────────────────
      const HandsClass = (window as any).Hands;
      const hands = new HandsClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      localHands = hands;

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      // onResults fires after model is truly ready (first send triggers WASM compile)
      let firstResult = false;
      hands.onResults((results: any) => {
        isProcessingRef.current = false;
        if (!isRunningRef.current) return;

        // Dismiss loading spinner on first successful result
        if (!firstResult) {
          firstResult = true;
          onLoadingRef.current?.(false);
        }

        const landmarks = results.multiHandLandmarks?.[0] ?? null;
        const gestureState = detectGesture(landmarks ?? []);
        onGestureRef.current(gestureState);
      });

      if (cancelled) {
        try { hands.close(); } catch (_) {}
        return;
      }

      // Assign to shared ref and mark running
      handsRef.current = hands;
      isRunningRef.current = true;

      // ── 4. Frame loop — send() lazily triggers WASM download ──────
      const processFrame = () => {
        if (!isRunningRef.current) return;

        if (
          !isProcessingRef.current &&
          handsRef.current &&
          video.readyState >= 2 &&
          !video.paused &&
          !video.ended
        ) {
          isProcessingRef.current = true;
          handsRef.current.send({ image: video }).catch(() => {
            isProcessingRef.current = false;
          });
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      rafRef.current = requestAnimationFrame(processFrame);
    };

    run();

    // Cleanup: cancel the async flow and tear everything down
    return () => {
      cancelled = true;
      // Close any partially-initialised hands instance
      if (localHands && localHands !== handsRef.current) {
        try { localHands.close(); } catch (_) {}
        localHands = null;
      }
      cleanup();
    };
  // Only re-run when enabled changes — callbacks are accessed via refs
  }, [enabled, videoRef, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cleanup };
}
