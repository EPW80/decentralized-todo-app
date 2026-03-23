import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="group relative glass-effect p-3 rounded-xl shadow-sm hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
           style={{
             background: isDark
               ? 'radial-gradient(circle, rgba(250, 204, 21, 0.3) 0%, transparent 70%)'
               : 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)'
           }}
      />

      <div className="relative w-6 h-6">
        <img
          src="/bulb.png"
          alt={isDark ? 'Light mode (bulb off)' : 'Dark mode (bulb on)'}
          className={`w-6 h-6 transition-all duration-500 ${
            isDark
              ? 'opacity-50 grayscale'
              : 'opacity-100 grayscale-0 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
