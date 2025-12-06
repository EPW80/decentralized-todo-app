import React, { useState } from 'react';

interface CopyButtonProps {
  text: string;
  displayText?: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'icon' | 'text' | 'both';
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  displayText,
  className = '',
  showIcon = true,
  variant = 'both',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        group relative inline-flex items-center gap-2 transition-all duration-300
        ${copied ? 'scale-105' : 'hover:scale-105'}
        ${className}
      `}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {/* Display text */}
      {(variant === 'text' || variant === 'both') && displayText && (
        <span className="font-mono font-bold">{displayText}</span>
      )}

      {/* Copy/Check icon */}
      {(variant === 'icon' || variant === 'both') && showIcon && (
        <div className="relative w-4 h-4">
          {/* Copy icon */}
          <svg
            className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
              copied
                ? 'opacity-0 scale-0 rotate-90'
                : 'opacity-70 group-hover:opacity-100 scale-100 rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>

          {/* Check icon */}
          <svg
            className={`absolute inset-0 w-4 h-4 text-green-500 transition-all duration-300 ${
              copied
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-0 -rotate-90'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* Success feedback tooltip */}
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg shadow-lg animate-scale-in whitespace-nowrap z-50">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </div>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45"></div>
        </div>
      )}

      {/* Ripple effect on copy */}
      {copied && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-green-500/20 animate-ping"></div>
        </div>
      )}
    </button>
  );
};

export default CopyButton;
