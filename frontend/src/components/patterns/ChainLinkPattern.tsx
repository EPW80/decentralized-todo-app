import React from 'react';

interface ChainLinkPatternProps {
  className?: string;
  count?: number;
  animated?: boolean;
  color?: string;
  direction?: 'horizontal' | 'vertical';
}

const ChainLinkPattern: React.FC<ChainLinkPatternProps> = ({
  className = '',
  count = 5,
  animated = false,
  color = '#667eea',
  direction = 'horizontal',
}) => {
  const isHorizontal = direction === 'horizontal';

  return (
    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center justify-center gap-1 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <svg
            width={isHorizontal ? '24' : '16'}
            height={isHorizontal ? '16' : '24'}
            viewBox="0 0 24 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={animated ? 'animate-pulse' : ''}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <path
              d="M8 4C8 1.79086 9.79086 0 12 0C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12V4Z"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M4 8C4 10.2091 2.20914 12 0 12"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M20 8C20 10.2091 21.7909 12 24 12"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />
          </svg>
          {i < count - 1 && (
            <div
              className={`${isHorizontal ? 'w-2 h-0.5' : 'h-2 w-0.5'} ${animated ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: color,
                opacity: 0.3,
                animationDelay: `${i * 0.1 + 0.05}s`,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ChainLinkPattern;
