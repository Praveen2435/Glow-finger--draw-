import React from 'react';
import { motion } from 'framer-motion';
import ColorPicker from './ColorPicker';
import ModeSelector from './ModeSelector';
import type { DrawMode } from '../hooks/useSmoothDrawing';

interface ControlsPanelProps {
  isActive: boolean;
  showPreview: boolean;
  showLandmarks: boolean;
  fadeTrail: boolean;
  devMode: boolean;
  isRecording: boolean;
  color: string;
  brushSize: number;
  glowIntensity: number;
  smoothing: number;
  mode: DrawMode;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onClear: () => void;
  onSave: () => void;
  onSaveTransparent: () => void;
  onUndo: () => void;
  onTogglePreview: () => void;
  onToggleLandmarks: () => void;
  onToggleFadeTrail: () => void;
  onToggleDevMode: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onColorChange: (c: string) => void;
  onBrushSizeChange: (v: number) => void;
  onGlowIntensityChange: (v: number) => void;
  onSmoothingChange: (v: number) => void;
  onModeChange: (m: DrawMode) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  color?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, color = '#00ffff', onChange }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <span className="text-xs font-mono text-cyan-400">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${
          ((value - min) / (max - min)) * 100
        }%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
        WebkitAppearance: 'none',
      }}
    />
  </div>
);

const IconButton: React.FC<{
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, title, active, danger, children, className = '' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    title={title}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
      danger
        ? 'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60'
        : active
        ? 'border-cyan-400/60 text-cyan-400 bg-cyan-400/10'
        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300 bg-white/5'
    } ${className}`}
    style={
      active
        ? { boxShadow: '0 0 12px rgba(0,255,255,0.2)' }
        : danger
        ? { boxShadow: '0 0 8px rgba(255,45,155,0.1)' }
        : {}
    }
  >
    {children}
  </motion.button>
);

const ControlsPanel: React.FC<ControlsPanelProps> = (props) => {
  const {
    isActive, showPreview, showLandmarks, fadeTrail, devMode,
    isRecording, color, brushSize, glowIntensity, smoothing, mode,
    onStartCamera, onStopCamera, onClear, onSave, onSaveTransparent,
    onUndo, onTogglePreview, onToggleLandmarks, onToggleFadeTrail,
    onToggleDevMode, onStartRecording, onStopRecording,
    onColorChange, onBrushSizeChange, onGlowIntensityChange,
    onSmoothingChange, onModeChange,
  } = props;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed right-0 top-0 h-full w-72 z-30 flex flex-col"
      style={{
        background: 'rgba(5, 8, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00ffff20, #bf5fff20)',
              border: '1px solid rgba(0,255,255,0.3)',
            }}
          >
            <span className="text-base">✨</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Glow Finger Draw</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Draw with light</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Camera controls */}
        <div className="space-y-3">
          <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Camera
          </label>
          <div className="flex gap-2">
            {!isActive ? (
              <IconButton onClick={onStartCamera} title="Start camera" active className="flex-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Start Camera
              </IconButton>
            ) : (
              <IconButton onClick={onStopCamera} title="Stop camera" danger className="flex-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop
              </IconButton>
            )}
            <IconButton onClick={onTogglePreview} title="Toggle preview" active={showPreview}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={showPreview
                    ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'}
                />
              </svg>
            </IconButton>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.div
              animate={isActive ? { opacity: [1, 0.3, 1] } : { opacity: 0.3 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ background: isActive ? '#39ff14' : '#666' }}
            />
            <span className="text-xs text-gray-500">
              {isActive ? 'Camera active — hand tracking on' : 'Camera offline'}
            </span>
          </div>
        </div>

        {/* Mode */}
        <ModeSelector mode={mode} onChange={onModeChange} />

        {/* Colors */}
        <ColorPicker selectedColor={color} onChange={onColorChange} />

        {/* Sliders */}
        <div className="space-y-4">
          <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Brush
          </label>
          <Slider
            label="Size"
            value={brushSize}
            min={1}
            max={20}
            color={color}
            onChange={onBrushSizeChange}
          />
          <Slider
            label="Glow Intensity"
            value={glowIntensity}
            min={5}
            max={60}
            color={color}
            onChange={onGlowIntensityChange}
          />
          <Slider
            label="Smoothing"
            value={smoothing}
            min={1}
            max={10}
            color="#bf5fff"
            onChange={onSmoothingChange}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Options
          </label>
          <div className="space-y-2">
            {[
              { label: 'Fade Trail', active: fadeTrail, onClick: onToggleFadeTrail },
              { label: 'Landmarks', active: showLandmarks, onClick: onToggleLandmarks },
              { label: 'Dev Mode (FPS)', active: devMode, onClick: onToggleDevMode },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200"
                style={{
                  background: item.active ? 'rgba(0,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  borderColor: item.active ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <span className="text-xs text-gray-300">{item.label}</span>
                <div
                  className="w-9 h-5 rounded-full relative transition-colors duration-200"
                  style={{ background: item.active ? '#00ffff' : 'rgba(255,255,255,0.1)' }}
                >
                  <motion.div
                    animate={{ x: item.active ? 16 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-lg"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Actions
          </label>
          <div className="grid grid-cols-2 gap-2">
            <IconButton onClick={onUndo} title="Undo (U)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </IconButton>
            <IconButton onClick={onClear} title="Clear (C)" danger>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </IconButton>
            <IconButton onClick={onSave} title="Save PNG (S)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save
            </IconButton>
            <IconButton onClick={onSaveTransparent} title="Transparent PNG">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Transparent
            </IconButton>
          </div>

          {/* Record button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={isRecording ? onStopRecording : onStartRecording}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200"
            style={{
              background: isRecording
                ? 'rgba(255, 45, 155, 0.1)'
                : 'rgba(255,255,255,0.03)',
              borderColor: isRecording
                ? 'rgba(255,45,155,0.5)'
                : 'rgba(255,255,255,0.1)',
              color: isRecording ? '#ff2d9b' : '#9ca3af',
              boxShadow: isRecording ? '0 0 15px rgba(255,45,155,0.2)' : 'none',
            }}
          >
            {isRecording ? (
              <>
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                Stop Recording (R)
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Record Session (R)
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-[10px] text-gray-600 text-center">
          ☝️ Index up + middle down = draw &nbsp;|&nbsp; 🖐️ Open palm = pause
        </p>
      </div>
    </motion.div>
  );
};

export default ControlsPanel;
