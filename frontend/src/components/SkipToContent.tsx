import React from 'react';

/**
 * SkipToContent component for accessibility
 * Provides a keyboard-accessible link to skip navigation and jump directly to main content
 * WCAG 2.4.1 (Level A) - Bypass Blocks
 */
const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        bg-white dark:bg-gray-900
        text-purple-700 dark:text-purple-400
        px-6 py-3 rounded-lg
        font-semibold text-sm
        shadow-2xl
        focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2
        transition-all duration-200
        transform focus:scale-105
      "
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipToContent;
