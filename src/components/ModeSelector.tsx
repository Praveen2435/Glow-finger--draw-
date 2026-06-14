import React from 'react';
import { motion } from 'framer-motion';
import type { DrawMode } from '../hooks/useSmoothDrawing';

interface ModeSelectorProps {
  mode: DrawMode;
  onChange: (mode: DrawMode) => void;
}

const MODES: { value: DrawMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
  {
    value: 'draw',
    label: 'Draw',
    shortcut: 'D',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    value: 'erase',
    label: 'Erase',
    shortcut: 'E',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    value: 'pointer',
    label: 'Pointer',
    shortcut: 'P',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Mode
      </label>
      <div className="flex gap-2">
        {MODES.map((m) => {
          const active = mode === m.value;
          return (
            <motion.button
              key={m.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(m.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all duration-200 ${
                active
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300 bg-white/5'
              }`}
              style={
                active
                  ? { boxShadow: '0 0 12px rgba(0,255,255,0.25)' }
                  : {}
              }
            >
              {m.icon}
              <span>{m.label}</span>
              <span className="text-[10px] opacity-50">{m.shortcut}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
