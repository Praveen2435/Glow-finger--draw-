import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingScreenProps {
  onDismiss: () => void;
}

const gestures = [
  {
    emoji: '☝️',
    title: 'Draw',
    desc: 'Raise index finger, keep middle finger down to draw glowing strokes',
    color: '#00ffff',
  },
  {
    emoji: '✌️',
    title: 'Pause',
    desc: 'Raise index + middle finger together to pause drawing',
    color: '#bf5fff',
  },
  {
    emoji: '🖐️',
    title: 'Stop',
    desc: 'Open palm — all fingers up — stops the current stroke',
    color: '#ff2d9b',
  },
  {
    emoji: '👊',
    title: 'Closed Fist',
    desc: 'No fingers raised — pointer only mode, no drawing',
    color: '#39ff14',
  },
];

const shortcuts = [
  { key: 'C', action: 'Clear canvas' },
  { key: 'S', action: 'Save PNG' },
  { key: 'E', action: 'Eraser mode' },
  { key: 'D', action: 'Draw mode' },
  { key: 'U', action: 'Undo stroke' },
  { key: 'R', action: 'Record / Stop' },
  { key: 'F', action: 'Toggle FPS' },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDismiss }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,20,40,0.97) 0%, rgba(0,0,0,0.98) 100%)',
        }}
      >
        {/* Ambient glow orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00ffff, transparent)' }} />
        <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #bf5fff, transparent)' }} />

        <div className="relative max-w-2xl w-full">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl mb-4"
            >
              ✨
            </motion.div>
            <h1 className="text-4xl font-bold mb-2"
              style={{
                background: 'linear-gradient(90deg, #00ffff, #bf5fff, #ff2d9b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Glow Finger Draw
            </h1>
            <p className="text-gray-400 text-lg">Draw glowing letters in the air with your finger</p>
          </motion.div>

          {/* Gesture cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {gestures.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-2xl p-4 border"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: `${g.color}30`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="text-3xl mb-2">{g.emoji}</div>
                <div className="font-semibold text-sm mb-1" style={{ color: g.color }}>
                  {g.title}
                </div>
                <div className="text-gray-400 text-xs leading-relaxed">{g.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Keyboard shortcuts */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-4 border border-white/10 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Keyboard Shortcuts
            </p>
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 rounded-md text-xs font-mono font-bold border border-white/20 text-cyan-400"
                    style={{ background: 'rgba(0,255,255,0.08)' }}>
                    {s.key}
                  </kbd>
                  <span className="text-xs text-gray-500">{s.action}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDismiss}
            className="w-full py-4 rounded-2xl font-semibold text-black text-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00ffff, #bf5fff)',
              boxShadow: '0 0 30px rgba(0,255,255,0.3), 0 0 60px rgba(191,95,255,0.2)',
            }}
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
            />
            Start Drawing ✨
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingScreen;
