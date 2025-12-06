import React from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';

interface BlockchainSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showChainLinks?: boolean;
}

const BlockchainSpinner: React.FC<BlockchainSpinnerProps> = ({
  size = 'md',
  message = 'Processing on blockchain...',
  showChainLinks = true,
}) => {
  const networkTheme = useNetworkTheme();

  const sizeClasses = {
    sm: { container: 'w-12 h-12', innerCircle: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-16 h-16', innerCircle: 'w-12 h-12', text: 'text-sm' },
    lg: { container: 'w-24 h-24', innerCircle: 'w-18 h-18', text: 'text-base' },
    xl: { container: 'w-32 h-32', innerCircle: 'w-24 h-24', text: 'text-lg' },
  };

  const { container, innerCircle, text } = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating hexagon */}
        <div className={`${container} relative animate-spin`} style={{ animationDuration: '3s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: networkTheme.primaryColor, stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: networkTheme.secondaryColor, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: networkTheme.accentColor, stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            {/* Hexagon path */}
            <path
              d="M 50 5 L 85 27.5 L 85 72.5 L 50 95 L 15 72.5 L 15 27.5 Z"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="3"
              strokeDasharray="10 5"
              className="animate-border-flow"
            />
            {/* Corner nodes */}
            <circle cx="50" cy="5" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" />
            <circle cx="85" cy="27.5" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" style={{ animationDelay: '0.5s' }} />
            <circle cx="85" cy="72.5" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" style={{ animationDelay: '1s' }} />
            <circle cx="50" cy="95" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" style={{ animationDelay: '1.5s' }} />
            <circle cx="15" cy="72.5" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" style={{ animationDelay: '2s' }} />
            <circle cx="15" cy="27.5" r="4" fill={networkTheme.primaryColor} className="animate-node-glow" style={{ animationDelay: '2.5s' }} />
          </svg>
        </div>

        {/* Inner pulsing circle */}
        <div
          className={`absolute ${innerCircle} rounded-full flex items-center justify-center`}
          style={{
            background: networkTheme.gradient,
            boxShadow: `0 0 30px ${networkTheme.glowColor}`,
          }}
        >
          <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: networkTheme.gradient }}></div>
          <svg className="w-1/2 h-1/2 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Orbiting blocks (representing blockchain) */}
        {showChainLinks && (
          <>
            <div
              className="absolute w-3 h-3 rounded-sm animate-spin"
              style={{
                background: networkTheme.primaryColor,
                animationDuration: '2s',
                top: '10%',
                left: '50%',
                transformOrigin: '0 300%',
              }}
            ></div>
            <div
              className="absolute w-3 h-3 rounded-sm animate-spin"
              style={{
                background: networkTheme.secondaryColor,
                animationDuration: '2s',
                animationDelay: '0.5s',
                top: '10%',
                left: '50%',
                transformOrigin: '0 300%',
              }}
            ></div>
            <div
              className="absolute w-3 h-3 rounded-sm animate-spin"
              style={{
                background: networkTheme.accentColor,
                animationDuration: '2s',
                animationDelay: '1s',
                top: '10%',
                left: '50%',
                transformOrigin: '0 300%',
              }}
            ></div>
          </>
        )}
      </div>

      {message && (
        <p className={`${text} font-semibold text-gray-700 animate-pulse text-center max-w-xs`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default BlockchainSpinner;
