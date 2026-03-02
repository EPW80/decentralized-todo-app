import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNetworkTheme } from '../hooks/useNetworkTheme';

/**
 * 404 Not Found page component
 * Displays when users navigate to non-existent routes
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const networkTheme = useNetworkTheme();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="glass-effect rounded-3xl p-8 sm:p-12 max-w-2xl w-full text-center shadow-glow animate-scale-in">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 blur-3xl opacity-30"
            style={{ background: networkTheme.gradient }}
          />
          <div className="relative">
            <svg
              className="w-48 h-48 mx-auto text-purple-500 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-8xl sm:text-9xl font-bold opacity-10"
                style={{ color: networkTheme.primaryColor }}
                aria-hidden="true"
              >
                404
              </span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent"
          style={{ backgroundImage: networkTheme.gradient }}
        >
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist on the blockchain or in our system.
          It might have been moved or deleted.
        </p>

        {/* Helpful Links */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>

            <Link
              to="/"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
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
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Quick Links:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/about"
                className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
              >
                About
              </Link>
              <Link
                to="/analytics"
                className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
            Error Code: 404 | Page Not Found
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
