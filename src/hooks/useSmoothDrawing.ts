import { useRef, useCallback } from 'react';
import type { Point, Particle, GlowStrokeOptions } from '../utils/canvasUtils';
import {
  createParticles,
  updateParticles,
  drawGlowSegment,
  drawFingerCursor,
  saveCanvasAsPng,
  saveTransparentPng,
  wmaSmooth,
  distance,
  toCanvasCoords,
} from '../utils/canvasUtils';
import type { NormalizedLandmark } from '../utils/gestureDetection';

export type DrawMode = 'draw' | 'erase' | 'pointer';

interface UseSmoothDrawingOptions {
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  color: string;
  brushSize: number;
  glowIntensity: number;
  smoothingFactor: number; // 1-10
  fadeTrail: boolean;
  mode: DrawMode;
}

export function useSmoothDrawing({
  drawingCanvasRef,
  overlayCanvasRef,
  color,
  brushSize,
  glowIntensity,
  smoothingFactor,
  fadeTrail,
  mode,
}: UseSmoothDrawingOptions) {
  // Current stroke points (raw)
  const rawPointsRef = useRef<Point[]>([]);
  // Smoothed points for current stroke
  const smoothedPointsRef = useRef<Point[]>([]);
  // Last drawn point on persistent canvas
  const lastDrawnRef = useRef<Point | null>(null);
  // Particles
  const particlesRef = useRef<Particle[]>([]);
  // Undo stack: array of ImageData
  const undoStackRef = useRef<ImageData[]>([]);
  // Current stroke started flag
  const strokeActiveRef = useRef(false);
  // Pulse phase for cursor animation
  const pulsePhaseRef = useRef(0);
  // Frame counter for fade
  const frameCountRef = useRef(0);
  // Overlay rAF
  const overlayRafRef = useRef<number>(0);
  // Current finger position (for overlay drawing)
  const currentPosRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  // MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const getDrawCtx = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, [drawingCanvasRef]);

  const getOverlayCtx = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, [overlayCanvasRef]);

  /** Save current drawing state to undo stack */
  const pushUndo = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);
    // Max 30 undo levels
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
  }, [drawingCanvasRef]);

  /** Process an incoming finger position */
  const processPoint = useCallback(
    (landmark: NormalizedLandmark, isActive: boolean) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      const canvasPoint = toCanvasCoords(
        landmark.x,
        landmark.y,
        canvas.width,
        canvas.height
      );

      currentPosRef.current = canvasPoint;
      isDrawingRef.current = isActive && mode === 'draw';

      if (!isActive || mode === 'pointer') {
        // End stroke
        if (strokeActiveRef.current) {
          strokeActiveRef.current = false;
          rawPointsRef.current = [];
          smoothedPointsRef.current = [];
          lastDrawnRef.current = null;
        }
        return;
      }

      const windowSize = Math.max(2, Math.round(smoothingFactor * 1.5));

      // Add raw point
      rawPointsRef.current.push(canvasPoint);
      if (rawPointsRef.current.length > 30) rawPointsRef.current.shift();

      // WMA smooth
      const smoothed = wmaSmooth(rawPointsRef.current, windowSize);
      smoothedPointsRef.current.push(smoothed);
      if (smoothedPointsRef.current.length > 60) smoothedPointsRef.current.shift();

      const ctx = getDrawCtx();
      if (!ctx) return;

      if (!strokeActiveRef.current) {
        // New stroke — save undo state
        pushUndo();
        strokeActiveRef.current = true;
        lastDrawnRef.current = smoothed;
        return;
      }

      const prev = lastDrawnRef.current;
      if (!prev) {
        lastDrawnRef.current = smoothed;
        return;
      }

      const dist = distance(prev, smoothed);

      // Prevent bad jumps
      if (dist > 150) {
        lastDrawnRef.current = smoothed;
        rawPointsRef.current = [];
        return;
      }

      if (dist < 1) return; // No movement

      const opts: GlowStrokeOptions = { color, brushSize, glowIntensity };

      if (mode === 'erase') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineWidth = brushSize * 4;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(smoothed.x, smoothed.y);
        ctx.stroke();
        ctx.restore();
      } else {
        drawGlowSegment(ctx, prev, smoothed, opts);

        // Spawn particles occasionally
        if (Math.random() < 0.3) {
          const newParticles = createParticles(smoothed.x, smoothed.y, color, 4);
          particlesRef.current.push(...newParticles);
          // Limit particles
          if (particlesRef.current.length > 200) {
            particlesRef.current = particlesRef.current.slice(-150);
          }
        }
      }

      lastDrawnRef.current = smoothed;
    },
    [color, brushSize, glowIntensity, smoothingFactor, mode, getDrawCtx, pushUndo]
  );

  /** Animate overlay canvas (cursor + particles) */
  const animateOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = getOverlayCtx();
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pulsePhaseRef.current += 0.08;
    frameCountRef.current++;

    // Draw particles
    particlesRef.current = updateParticles(ctx, particlesRef.current);

    // Fade trail on drawing canvas
    if (fadeTrail) {
      const drawCtx = getDrawCtx();
      if (drawCtx) {
        const drawCanvas = drawingCanvasRef.current!;
        drawCtx.save();
        drawCtx.globalAlpha = 0.015;
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.restore();
      }
    }

    // Draw cursor
    const pos = currentPosRef.current;
    if (pos) {
      drawFingerCursor(ctx, pos.x, pos.y, color, isDrawingRef.current, pulsePhaseRef.current);
    }

    overlayRafRef.current = requestAnimationFrame(animateOverlay);
  }, [color, fadeTrail, getOverlayCtx, getDrawCtx, drawingCanvasRef, overlayCanvasRef]);

  /** Start the overlay animation loop */
  const startOverlayLoop = useCallback(() => {
    if (overlayRafRef.current) cancelAnimationFrame(overlayRafRef.current);
    overlayRafRef.current = requestAnimationFrame(animateOverlay);
  }, [animateOverlay]);

  /** Stop the overlay animation loop */
  const stopOverlayLoop = useCallback(() => {
    if (overlayRafRef.current) {
      cancelAnimationFrame(overlayRafRef.current);
      overlayRafRef.current = 0;
    }
    currentPosRef.current = null;
    isDrawingRef.current = false;
  }, []);

  /** Clear the drawing canvas */
  const clearCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    pushUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current = [];
    rawPointsRef.current = [];
    smoothedPointsRef.current = [];
    lastDrawnRef.current = null;
    strokeActiveRef.current = false;
  }, [drawingCanvasRef, pushUndo]);

  /** Undo last stroke */
  const undo = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = undoStackRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  }, [drawingCanvasRef]);

  /** Save drawing as PNG */
  const save = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    saveCanvasAsPng(canvas, 'glow-finger-drawing.png');
  }, [drawingCanvasRef]);

  /** Save transparent PNG */
  const saveTransparent = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    saveTransparentPng(canvas, 'glow-finger-drawing-transparent.png');
  }, [drawingCanvasRef]);

  /** Start recording canvas + mic-free audio */
  const startRecording = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'glow-finger-session.webm';
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error('Recording failed:', err);
    }
  }, [drawingCanvasRef]);

  /** Stop recording */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const isRecording = useCallback(() => {
    return mediaRecorderRef.current?.state === 'recording';
  }, []);

  return {
    processPoint,
    startOverlayLoop,
    stopOverlayLoop,
    clearCanvas,
    undo,
    save,
    saveTransparent,
    startRecording,
    stopRecording,
    isRecording,
  };
}
