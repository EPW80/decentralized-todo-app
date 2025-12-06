import React from 'react';

interface DigitalGridProps {
  className?: string;
  gridSize?: number;
  color?: string;
  opacity?: number;
  animated?: boolean;
}

const DigitalGrid: React.FC<DigitalGridProps> = ({
  className = '',
  gridSize = 30,
  color = '#667eea',
  opacity = 0.1,
  animated = false,
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? 'animate-pulse' : ''}
      >
        <defs>
          <pattern
            id="digital-grid"
            x="0"
            y="0"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
            />
            <circle
              cx={gridSize}
              cy={gridSize}
              r="1"
              fill={color}
              opacity={opacity * 1.5}
            />
          </pattern>

          <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: color, stopOpacity: opacity }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#digital-grid)" />
        <rect width="100%" height="100%" fill="url(#grid-gradient)" opacity="0.5" />
      </svg>
    </div>
  );
};

export default DigitalGrid;
