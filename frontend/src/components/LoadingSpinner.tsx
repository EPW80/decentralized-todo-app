import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'blockchain';
}

/**
 * Reusable loading spinner component
 * Supports different sizes, messages, and respects reduced motion preferences
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  variant = 'default',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-[6px]',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {variant === 'blockchain' ? (
        // Blockchain-themed spinner
        <div className="relative flex items-center justify-center">
          <div
            className={`${sizeClasses[size]} rounded-full border-purple-500 border-t-transparent ${
              prefersReducedMotion ? '' : 'animate-spin'
            }`}
            style={{ animationDuration: '0.8s' }}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
          {/* Inner ring */}
          <div
            className="absolute inset-0 m-auto border-purple-300 border-t-transparent rounded-full"
            style={{
              width: `calc(${sizeClasses[size].split(' ')[0]} * 0.6)`,
              height: `calc(${sizeClasses[size].split(' ')[1]} * 0.6)`,
              borderWidth: `calc(${sizeClasses[size].split(' ')[2]} * 0.5)`,
              animation: prefersReducedMotion ? 'none' : 'spin 1.2s linear infinite reverse',
            }}
            aria-hidden="true"
          />
        </div>
      ) : (
        // Default spinner
        <div
          className={`${sizeClasses[size]} rounded-full border-purple-500 border-t-transparent ${
            prefersReducedMotion ? '' : 'animate-spin'
          }`}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {message && (
        <p
          className={`${textSizeClasses[size]} font-medium text-gray-700 dark:text-gray-300 text-center max-w-xs ${
            prefersReducedMotion ? '' : 'animate-pulse'
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
