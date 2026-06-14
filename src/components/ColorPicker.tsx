import React from 'react';
import { motion } from 'framer-motion';

export const NEON_COLORS = [
  { name: 'Cyan', value: '#00ffff' },
  { name: 'Purple', value: '#bf5fff' },
  { name: 'Pink', value: '#ff2d9b' },
  { name: 'Green', value: '#39ff14' },
  { name: 'Orange', value: '#ff6b00' },
  { name: 'White', value: '#ffffff' },
];

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Color
      </label>
      <div className="flex flex-wrap gap-2">
        {NEON_COLORS.map((c) => (
          <motion.button
            key={c.value}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(c.value)}
            title={c.name}
            className="relative w-8 h-8 rounded-full border-2 transition-all duration-200"
            style={{
              backgroundColor: c.value,
              borderColor: selectedColor === c.value ? '#fff' : 'transparent',
              boxShadow:
                selectedColor === c.value
                  ? `0 0 12px ${c.value}, 0 0 24px ${c.value}60`
                  : `0 0 6px ${c.value}40`,
            }}
          >
            {selectedColor === c.value && (
              <motion.span
                layoutId="color-ring"
                className="absolute inset-[-4px] rounded-full border-2 border-white/60"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
        {/* Custom color */}
        <label
          className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          title="Custom color"
        >
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </label>
      </div>
    </div>
  );
};

export default ColorPicker;
