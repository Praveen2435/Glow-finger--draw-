import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CameraView from './components/CameraView';
import DrawingCanvas from './components/DrawingCanvas';
import ControlsPanel from './components/ControlsPanel';
import OnboardingScreen from './components/OnboardingScreen';
import FpsIndicator from './components/FpsIndicator';
import { useHandTracking } from './hooks/useHandTracking';
import { useSmoothDrawing } from './hooks/useSmoothDrawing';
import type { DrawMode } from './hooks/useSmoothDrawing';
import type { GestureState } from './utils/gestureDetection';

// ── Toast ─────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium text-white"
    style={{
      background: 'rgba(10,15,30,0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0,255,255,0.2)',
      boxShadow: '0 0 30px rgba(0,255,255,0.15)',
    }}
  >
    {message}
  </motion.div>
);

// ── Error Overlay ─────────────────────────────────────────────────
const ErrorOverlay: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-40 flex items-center justify-center p-6"
    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
  >
    <div
      className="max-w-md w-full rounded-3xl p-8 text-center"
      style={{
        background: 'rgba(255,20,20,0.08)',
        border: '1px solid rgba(255,45,155,0.3)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="text-5xl mb-4">📷</div>
      <h2 className="text-xl font-bold text-white mb-3">Camera Required</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-xl font-medium text-white text-sm"
        style={{
          background: 'linear-gradient(135deg, #00ffff30, #bf5fff30)',
          border: '1px solid rgba(0,255,255,0.3)',
        }}
      >
        Try Again
      </button>
    </div>
  </motion.div>
);

// ── Loading Overlay ───────────────────────────────────────────────
const LoadingOverlay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-40 flex items-center justify-center"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
  >
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: '#00ffff',
          borderRightColor: '#bf5fff',
        }}
      />
      <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase">
        Loading AI Model…
      </p>
      <p className="text-gray-500 text-xs mt-1">First load may take a few seconds</p>
    </div>
  </motion.div>
);

// ── Gesture Badge ─────────────────────────────────────────────────
const GestureBadge: React.FC<{ gesture: string; color: string }> = ({
  gesture,
  color,
}) => {
  const labels: Record<string, string> = {
    draw: '✍️ Drawing',
    pause: '⏸ Paused',
    pointer: '👆 Pointer',
    none: '✋ Ready',
  };
  return (
    <motion.div
      key={gesture}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-semibold"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color}40`,
        color,
        boxShadow: `0 0 20px ${color}30`,
      }}
    >
      {labels[gesture] ?? '✋ Ready'}
    </motion.div>
  );
};

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // UI state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [fadeTrail, setFadeTrail] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState(false);

  // Drawing settings
  const [color, setColor] = useState('#00ffff');
  const [brushSize, setBrushSize] = useState(4);
  const [glowIntensity, setGlowIntensity] = useState(25);
  const [smoothing, setSmoothing] = useState(5);
  const [mode, setMode] = useState<DrawMode>('draw');

  // Gesture state
  const [gestureState, setGestureState] = useState<GestureState | null>(null);
  const clearHoldStartRef = useRef<number | null>(null);
  const [clearHoldProgress, setClearHoldProgress] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Drawing hook ─────────────────────────────────────────────────
  const {
    processPoint,
    startOverlayLoop,
    stopOverlayLoop,
    clearCanvas,
    undo,
    save,
    saveTransparent,
    startRecording: startRec,
    stopRecording: stopRec,
  } = useSmoothDrawing({
    drawingCanvasRef,
    overlayCanvasRef,
    color,
    brushSize,
    glowIntensity,
    smoothingFactor: smoothing,
    fadeTrail,
    mode,
  });

  // ── Gesture handler (stable ref internally in hook) ───────────────
  const handleGesture = useCallback(
    (state: GestureState) => {
      setGestureState(state);

      const { gesture, indexTip } = state;

      // 2-second open-palm hold to clear
      if (state.isIndexUp && state.isMiddleUp && state.isRingUp && state.isPinkyUp) {
        if (!clearHoldStartRef.current) {
          clearHoldStartRef.current = Date.now();
        }
        const elapsed = Date.now() - clearHoldStartRef.current;
        const progress = Math.min(elapsed / 2000, 1);
        setClearHoldProgress(progress);
        if (progress >= 1) {
          clearHoldStartRef.current = null;
          setClearHoldProgress(0);
          clearCanvas();
          showToast('Canvas cleared! ✨');
        }
      } else {
        clearHoldStartRef.current = null;
        setClearHoldProgress(0);
      }

      // Send point to drawing hook
      if (indexTip) {
        const isDrawing = gesture === 'draw';
        processPoint(indexTip, isDrawing);
      } else {
        processPoint({ x: 0, y: 0, z: 0 }, false);
      }
    },
    [processPoint, clearCanvas, showToast]
  );

  // ── Hand tracking hook ────────────────────────────────────────────
  useHandTracking({
    videoRef,
    onGesture: handleGesture,
    enabled: isActive,
    onError: (msg) => {
      setError(msg);
      setIsActive(false);
      setIsLoading(false);
    },
    onLoading: (loading) => {
      setIsLoading(loading);
    },
  });

  // Start/stop overlay animation loop based on active + loaded state
  useEffect(() => {
    if (isActive && !isLoading) {
      startOverlayLoop();
    } else {
      stopOverlayLoop();
    }
  }, [isActive, isLoading, startOverlayLoop, stopOverlayLoop]);

  // ── Camera controls ───────────────────────────────────────────────
  const startCamera = useCallback(() => {
    setError(null);
    setIsActive(true);
  }, []);

  const stopCamera = useCallback(() => {
    setIsActive(false);
    setIsLoading(false);
    stopOverlayLoop();
    setGestureState(null);
  }, [stopOverlayLoop]);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      switch (key) {
        case 'c':
          clearCanvas();
          showToast('Canvas cleared ✨');
          break;
        case 's':
          save();
          showToast('Saved as PNG 🖼️');
          break;
        case 'e':
          setMode('erase');
          showToast('Eraser mode 🗑️');
          break;
        case 'd':
          setMode('draw');
          showToast('Draw mode ✍️');
          break;
        case 'u':
          undo();
          showToast('Undo ↩️');
          break;
        case 'r':
          if (recordingState) {
            stopRec();
            setRecordingState(false);
            showToast('Recording stopped, downloading… 🎬');
          } else {
            startRec();
            setRecordingState(true);
            showToast('Recording started 🔴');
          }
          break;
        case 'f':
          setDevMode((v) => !v);
          break;
        case 'p':
          setMode('pointer');
          showToast('Pointer mode 👆');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearCanvas, save, undo, startRec, stopRec, recordingState, showToast]);

  const handleStartRecording = useCallback(() => {
    startRec();
    setRecordingState(true);
    showToast('Recording started 🔴');
  }, [startRec, showToast]);

  const handleStopRecording = useCallback(() => {
    stopRec();
    setRecordingState(false);
    showToast('Saving video… 🎬');
  }, [stopRec, showToast]);

  const gestureColor: Record<string, string> = {
    draw: '#00ffff',
    pause: '#bf5fff',
    pointer: '#39ff14',
    none: '#666',
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingScreen onDismiss={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <ErrorOverlay
            message={error}
            onRetry={() => {
              setError(null);
              startCamera();
            }}
          />
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {isLoading && <LoadingOverlay />}
      </AnimatePresence>

      {/* Layer 1: Camera */}
      <CameraView
        videoRef={videoRef}
        isActive={isActive}
        showPreview={showPreview}
      />

      {/* Vignette */}
      {isActive && showPreview && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
          }}
        />
      )}

      {/* Layers 2 & 3: Drawing + overlay canvases */}
      <DrawingCanvas
        drawingCanvasRef={drawingCanvasRef}
        overlayCanvasRef={overlayCanvasRef}
        videoRef={videoRef}
      />

      {/* Gesture badge */}
      {isActive && !isLoading && gestureState && (
        <GestureBadge
          gesture={gestureState.gesture}
          color={gestureColor[gestureState.gesture] ?? '#666'}
        />
      )}

      {/* Clear-hold progress ring */}
      {clearHoldProgress > 0 && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none"
                stroke="rgba(255,45,155,0.2)" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#ff2d9b" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - clearHoldProgress)}`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #ff2d9b)' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs text-pink-400 font-bold">
              Clear
            </span>
          </div>
        </motion.div>
      )}

      {/* FPS */}
      <FpsIndicator visible={devMode} />

      {/* Controls panel */}
      {!showOnboarding && (
        <ControlsPanel
          isActive={isActive}
          showPreview={showPreview}
          showLandmarks={showLandmarks}
          fadeTrail={fadeTrail}
          devMode={devMode}
          isRecording={recordingState}
          color={color}
          brushSize={brushSize}
          glowIntensity={glowIntensity}
          smoothing={smoothing}
          mode={mode}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onClear={() => { clearCanvas(); showToast('Canvas cleared ✨'); }}
          onSave={() => { save(); showToast('Saved as PNG 🖼️'); }}
          onSaveTransparent={() => { saveTransparent(); showToast('Transparent PNG saved 🖼️'); }}
          onUndo={() => { undo(); showToast('Undo ↩️'); }}
          onTogglePreview={() => setShowPreview((v) => !v)}
          onToggleLandmarks={() => setShowLandmarks((v) => !v)}
          onToggleFadeTrail={() => setFadeTrail((v) => !v)}
          onToggleDevMode={() => setDevMode((v) => !v)}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onGlowIntensityChange={setGlowIntensity}
          onSmoothingChange={setSmoothing}
          onModeChange={setMode}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} />}
      </AnimatePresence>
    </div>
  );
}
