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
        {/* Lightbulb ON (shown in light mode) */}
        <svg
          className={`absolute inset-0 w-6 h-6 transition-all duration-500 ${
            isDark
              ? 'opacity-0 scale-75'
              : 'opacity-100 scale-100'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: '#eab308' }}
        >
          {/* Bulb body */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>

        {/* Lightbulb OFF (shown in dark mode) */}
        <svg
          className={`absolute inset-0 w-6 h-6 transition-all duration-500 ${
            isDark
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: '#94a3b8' }}
        >
          {/* Bulb body without rays */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3a5 5 0 00-3.536 8.536l-.548.547A3.374 3.374 0 007 14.469V15a2 2 0 104 0v-.531c0-.895.356-1.754.988-2.386l.548-.547A5 5 0 0012 3z"
          />
          {/* Slash through */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364L5.636 5.636"
          />
        </svg>
      </div>
    </button>
  );
};

export default ThemeToggle;
