import React from 'react';

interface HexagonPatternProps {
  className?: string;
  opacity?: number;
  color?: string;
  size?: number;
}

const HexagonPattern: React.FC<HexagonPatternProps> = ({
  className = '',
  opacity = 0.1,
  color = '#667eea',
  size = 40,
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <defs>
          <pattern
            id="hexagon-pattern"
            x="0"
            y="0"
            width={size * 1.5}
            height={size * Math.sqrt(3)}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${size * 0.5} 0 L ${size} ${size * 0.289} L ${size} ${size * 0.866} L ${size * 0.5} ${size * 1.155} L 0 ${size * 0.866} L 0 ${size * 0.289} Z`}
              fill="none"
              stroke={color}
              strokeWidth="1"
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagon-pattern)" />
      </svg>
    </div>
  );
};

export default HexagonPattern;
