import React from 'react';

interface BlockchainBorderProps {
  className?: string;
  animated?: boolean;
  color?: string;
  thickness?: number;
}

const BlockchainBorder: React.FC<BlockchainBorderProps> = ({
  className = '',
  animated = false,
  color = '#667eea',
  thickness = 2,
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="border-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#764ba2', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.8 }} />
          </linearGradient>
        </defs>

        <rect
          x={thickness / 2}
          y={thickness / 2}
          width={`calc(100% - ${thickness}px)`}
          height={`calc(100% - ${thickness}px)`}
          fill="none"
          stroke="url(#border-gradient)"
          strokeWidth={thickness}
          strokeDasharray="10 5"
          rx="8"
          className={animated ? 'animate-border-flow' : ''}
        />

        {/* Corner accents */}
        <circle cx="8" cy="8" r="3" fill={color} opacity="0.6" />
        <circle cx="calc(100% - 8px)" cy="8" r="3" fill={color} opacity="0.6" />
        <circle cx="8" cy="calc(100% - 8px)" r="3" fill={color} opacity="0.6" />
        <circle cx="calc(100% - 8px)" cy="calc(100% - 8px)" r="3" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
};

export default BlockchainBorder;
