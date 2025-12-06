import React from 'react';

interface NoTodosIllustrationProps {
  size?: number;
  className?: string;
}

const NoTodosIllustration: React.FC<NoTodosIllustrationProps> = ({
  size = 200,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="todo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#667EEA', stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: '#764BA2', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#todo-gradient)" />

      {/* Clipboard */}
      <rect x="60" y="50" width="80" height="100" rx="8" fill="white" stroke="#667EEA" strokeWidth="3" />

      {/* Clipboard top */}
      <rect x="85" y="45" width="30" height="10" rx="3" fill="#667EEA" />
      <circle cx="100" cy="50" r="3" fill="white" />

      {/* Checkmark lines (empty) */}
      <line x1="75" y1="80" x2="125" y2="80" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="100" x2="125" y2="100" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="120" x2="125" y2="120" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />

      {/* Checkboxes (empty) */}
      <rect x="75" y="75" width="10" height="10" rx="2" fill="none" stroke="#D1D5DB" strokeWidth="2" />
      <rect x="75" y="95" width="10" height="10" rx="2" fill="none" stroke="#D1D5DB" strokeWidth="2" />
      <rect x="75" y="115" width="10" height="10" rx="2" fill="none" stroke="#D1D5DB" strokeWidth="2" />

      {/* Sparkles */}
      <g opacity="0.5">
        <path d="M45 70 L47 75 L52 77 L47 79 L45 84 L43 79 L38 77 L43 75 Z" fill="#667EEA" className="animate-pulse" />
        <path d="M150 90 L152 95 L157 97 L152 99 L150 104 L148 99 L143 97 L148 95 Z" fill="#764BA2" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
      </g>
    </svg>
  );
};

export default NoTodosIllustration;
