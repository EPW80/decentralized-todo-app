import React, { useEffect, useState } from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import ChainLinkPattern from './ChainLinkPattern';

interface BlockConfirmationProps {
  message?: string;
  txHash?: string;
  onComplete?: () => void;
  duration?: number;
}

const BlockConfirmation: React.FC<BlockConfirmationProps> = ({
  message = 'Transaction Confirmed!',
  txHash,
  onComplete,
  duration = 3000,
}) => {
  const networkTheme = useNetworkTheme();
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    setShowParticles(true);

    if (onComplete && duration) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 animate-scale-in">
      {/* Success Icon with blockchain animation */}
      <div className="relative mb-6">
        {/* Expanding rings */}
        <div
          className="absolute inset-0 w-24 h-24 rounded-full animate-ping opacity-20"
          style={{ background: networkTheme.gradient }}
        ></div>
        <div
          className="absolute inset-0 w-24 h-24 rounded-full animate-pulse opacity-30"
          style={{ background: networkTheme.gradient, animationDelay: '0.3s' }}
        ></div>

        {/* Hexagonal border */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '4s' }}>
            <defs>
              <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#047857', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M 50 5 L 85 27.5 L 85 72.5 L 50 95 L 15 72.5 L 15 27.5 Z"
              fill="none"
              stroke="url(#success-gradient)"
              strokeWidth="3"
              strokeDasharray="5 3"
            />
            {/* Corner nodes */}
            <circle cx="50" cy="5" r="3" fill="#10b981" className="animate-node-glow" />
            <circle cx="85" cy="27.5" r="3" fill="#10b981" className="animate-node-glow" style={{ animationDelay: '0.3s' }} />
            <circle cx="85" cy="72.5" r="3" fill="#10b981" className="animate-node-glow" style={{ animationDelay: '0.6s' }} />
            <circle cx="50" cy="95" r="3" fill="#10b981" className="animate-node-glow" style={{ animationDelay: '0.9s' }} />
            <circle cx="15" cy="72.5" r="3" fill="#10b981" className="animate-node-glow" style={{ animationDelay: '1.2s' }} />
            <circle cx="15" cy="27.5" r="3" fill="#10b981" className="animate-node-glow" style={{ animationDelay: '1.5s' }} />
          </svg>

          {/* Center checkmark */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl animate-scale-in">
            <svg className="w-10 h-10 text-white animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animationDelay: '0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Floating particles */}
        {showParticles && (
          <>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-green-500 animate-float"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `float 2s ease-out ${i * 0.1}s forwards`,
                  transform: `rotate(${i * 30}deg) translateY(-60px)`,
                  opacity: 0.8 - i * 0.05,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Message */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2 justify-center">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {message}
        </h3>

        {/* Chain animation */}
        <div className="flex items-center justify-center gap-2 py-3">
          <ChainLinkPattern count={5} animated={true} color="#10b981" direction="horizontal" />
        </div>

        {/* Transaction hash */}
        {txHash && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 max-w-md">
            <p className="text-xs font-medium text-green-700 mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono text-green-900 break-all">{txHash}</p>
          </div>
        )}

        {/* Block added animation */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 animate-fade-in">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600 animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="font-medium">Added to Blockchain</span>
        </div>
      </div>
    </div>
  );
};

export default BlockConfirmation;
