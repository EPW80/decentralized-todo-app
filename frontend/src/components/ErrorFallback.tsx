import React from 'react';
import { useNetworkTheme } from '../hooks/useNetworkTheme';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  componentStack?: string;
}

/**
 * Error fallback UI component
 * Displays when an error is caught by ErrorBoundary
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentStack,
}) => {
  const networkTheme = useNetworkTheme();
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="glass-effect rounded-3xl p-8 sm:p-12 max-w-3xl w-full shadow-glow animate-scale-in">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="relative p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            }}
          >
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
          style={{ color: networkTheme.primaryColor }}
        >
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
          We're sorry, but something unexpected happened. Our team has been notified and we're
          working on a fix.
        </p>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Error Details (Development Mode)
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                  Error Message:
                </p>
                <pre className="text-xs text-red-900 dark:text-red-200 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto border border-red-200 dark:border-red-700">
                  {error.message}
                </pre>
              </div>
              {error.stack && (
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    Stack Trace:
                  </p>
                  <pre className="text-xs text-red-900 dark:text-red-200 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto border border-red-200 dark:border-red-700 max-h-40">
                    {error.stack}
                  </pre>
                </div>
              )}
              {componentStack && (
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    Component Stack:
                  </p>
                  <pre className="text-xs text-red-900 dark:text-red-200 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto border border-red-200 dark:border-red-700 max-h-40">
                    {componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Home
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If this problem persists, please contact support or{' '}
            <a
              href="https://github.com/your-repo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              report an issue
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
