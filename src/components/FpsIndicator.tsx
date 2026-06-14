import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FpsIndicatorProps {
  visible: boolean;
}

const FpsIndicator: React.FC<FpsIndicatorProps> = ({ visible }) => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;

    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!visible) return null;

  const color = fps >= 50 ? '#39ff14' : fps >= 30 ? '#ff6b00' : '#ff2d9b';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-4 left-4 z-40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        borderColor: `${color}40`,
        color,
        boxShadow: `0 0 10px ${color}30`,
      }}
    >
      {fps} FPS
    </motion.div>
  );
};

export default FpsIndicator;
