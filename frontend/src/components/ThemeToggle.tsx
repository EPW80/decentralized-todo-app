import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="group relative glass-effect p-2 rounded-xl shadow-sm hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div
        className={`relative w-6 h-6 transition-all duration-500 ${isDark
            ? 'text-gray-400 opacity-50'
            : 'text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]'
          }`}
      >
        <img src="/bulb.png" alt="" className="w-6 h-6" style={{ filter: isDark ? 'invert(0.6)' : 'invert(0) sepia(1) saturate(5) hue-rotate(15deg)' }} />
      </div>
    </button>
  );
};

export default ThemeToggle;
