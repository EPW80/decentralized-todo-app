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
      <div className="relative w-5 h-5">
        <img
          src="/bulb.png"
          alt=""
          className={`w-5 h-5 object-contain transition-all duration-500 ${
            isDark
              ? 'brightness-0 invert opacity-40'
              : 'opacity-90 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
