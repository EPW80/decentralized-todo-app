import React from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';

interface ChainConfirmationProps {
  confirmations: number;
  requiredConfirmations: number;
  animated?: boolean;
}

const ChainConfirmation: React.FC<ChainConfirmationProps> = ({
  confirmations,
  requiredConfirmations,
  animated = true,
}) => {
  const networkTheme = useNetworkTheme();
  const links = Array.from({ length: requiredConfirmations }, (_, i) => i);
  const confirmedLinks = Math.min(confirmations, requiredConfirmations);

  return (
    <div className="flex items-center gap-1">
      {links.map((index) => {
        const isConfirmed = index < confirmedLinks;
        const isAnimating = index === confirmedLinks && confirmedLinks < requiredConfirmations;

        return (
          <React.Fragment key={index}>
            {/* Chain Link */}
            <svg
              width="20"
              height="16"
              viewBox="0 0 24 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-all duration-500 ${
                isAnimating && animated ? 'animate-pulse' : ''
              }`}
              style={{
                opacity: isConfirmed ? 1 : 0.3,
                transform: isConfirmed ? 'scale(1)' : 'scale(0.9)',
              }}
            >
              {/* Link Body */}
              <path
                d="M8 4C8 1.79086 9.79086 0 12 0C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12V4Z"
                stroke={isConfirmed ? networkTheme.primaryColor : '#d1d5db'}
                strokeWidth="2"
                fill={isConfirmed ? `${networkTheme.primaryColor}20` : 'none'}
              />
              {/* Left Connector */}
              <path
                d="M4 8C4 10.2091 2.20914 12 0 12"
                stroke={isConfirmed ? networkTheme.primaryColor : '#d1d5db'}
                strokeWidth="2"
                fill="none"
              />
              {/* Right Connector */}
              <path
                d="M20 8C20 10.2091 21.7909 12 24 12"
                stroke={isConfirmed ? networkTheme.primaryColor : '#d1d5db'}
                strokeWidth="2"
                fill="none"
              />

              {/* Glow Effect for Confirmed Links */}
              {isConfirmed && (
                <circle
                  cx="12"
                  cy="8"
                  r="3"
                  fill={networkTheme.primaryColor}
                  opacity="0.3"
                  className={animated ? 'animate-ping' : ''}
                />
              )}
            </svg>

            {/* Connector Line between links */}
            {index < links.length - 1 && (
              <div
                className={`w-3 h-0.5 transition-all duration-500 ${
                  isAnimating && animated ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: isConfirmed ? networkTheme.primaryColor : '#d1d5db',
                  opacity: isConfirmed ? 1 : 0.3,
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Completion Indicator */}
      {confirmedLinks === requiredConfirmations && (
        <div
          className="ml-2 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in"
          style={{
            background: networkTheme.gradient,
            boxShadow: `0 0 12px ${networkTheme.glowColor}`,
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChainConfirmation;
