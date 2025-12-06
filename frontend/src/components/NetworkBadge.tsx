import React from 'react';
import { useNetworkTheme } from '../hooks/useNetworkTheme';
import { useWeb3 } from '../contexts/Web3Context';
import { blockchainService } from '../services/blockchain';

interface NetworkBadgeProps {
  variant?: 'default' | 'compact' | 'pill' | 'icon-only';
  showStatus?: boolean;
  animated?: boolean;
  className?: string;
}

const NetworkBadge: React.FC<NetworkBadgeProps> = ({
  variant = 'default',
  showStatus = true,
  animated = true,
  className = '',
}) => {
  const networkTheme = useNetworkTheme();
  const { chainId, isConnected } = useWeb3();

  if (!isConnected || !chainId) {
    return null;
  }

  const isSupported = blockchainService.isSupportedNetwork(chainId);

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <div
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 ${
          animated ? 'animate-glow-pulse' : ''
        } ${className}`}
        style={{
          background: networkTheme.gradient,
          boxShadow: `0 4px 16px ${networkTheme.glowColor}`,
        }}
        title={networkTheme.name}
      >
        <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm"></div>
        <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  }

  // Pill variant
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all duration-300 hover:shadow-lg ${className}`}
        style={{
          background: networkTheme.gradient,
          boxShadow: `0 4px 12px ${networkTheme.glowColor}`,
        }}
      >
        {showStatus && (
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: isSupported ? '#22c55e' : '#eab308',
              boxShadow: isSupported
                ? '0 0 8px rgba(34, 197, 94, 0.8)'
                : '0 0 8px rgba(234, 179, 8, 0.8)',
            }}
          />
        )}
        <span className="text-white font-semibold text-sm">{networkTheme.name}</span>
        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm transition-all duration-300 ${className}`}
        style={{
          background: `${networkTheme.primaryColor}15`,
          border: `2px solid ${networkTheme.primaryColor}40`,
        }}
      >
        {showStatus && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: networkTheme.primaryColor,
              boxShadow: `0 0 6px ${networkTheme.glowColor}`,
            }}
          />
        )}
        <span
          className="font-semibold text-xs"
          style={{ color: networkTheme.primaryColor }}
        >
          {networkTheme.name}
        </span>
      </div>
    );
  }

  // Default variant - card style
  return (
    <div
      className={`relative glass-effect rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
      style={{
        border: `2px solid ${networkTheme.primaryColor}40`,
        boxShadow: `0 4px 16px ${networkTheme.glowColor}`,
      }}
    >
      {/* Gradient background accent */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: networkTheme.gradient }}
      />

      {/* Animated flowing border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${networkTheme.primaryColor}40, transparent)`,
          animation: animated ? 'shimmer 3s infinite' : 'none',
        }}
      />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Network icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: networkTheme.gradient,
              }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: networkTheme.primaryColor }}
              >
                {networkTheme.name}
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                Chain ID: {chainId}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          {showStatus && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    isSupported ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {isSupported ? 'Active' : 'Limited'}
                </span>
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: isSupported ? '#22c55e' : '#eab308',
                    boxShadow: isSupported
                      ? '0 0 10px rgba(34, 197, 94, 0.7)'
                      : '0 0 10px rgba(234, 179, 8, 0.7)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Network color indicators */}
        <div className="flex gap-2 mt-3">
          <div
            className="flex-1 h-2 rounded-full"
            style={{ background: networkTheme.gradient }}
          />
          <div
            className="w-8 h-2 rounded-full opacity-70"
            style={{ backgroundColor: networkTheme.primaryColor }}
          />
          <div
            className="w-8 h-2 rounded-full opacity-50"
            style={{ backgroundColor: networkTheme.secondaryColor }}
          />
          <div
            className="w-8 h-2 rounded-full opacity-30"
            style={{ backgroundColor: networkTheme.accentColor }}
          />
        </div>
      </div>
    </div>
  );
};

export default NetworkBadge;
