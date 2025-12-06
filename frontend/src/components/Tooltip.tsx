import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Small delay for animation
      setTimeout(() => setShowTooltip(true), 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
    // Wait for animation to complete before hiding
    setTimeout(() => setIsVisible(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-180',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 -rotate-90',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-90',
  };

  const scaleClasses = {
    top: showTooltip ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    bottom: showTooltip ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    left: showTooltip ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    right: showTooltip ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-50 pointer-events-none whitespace-nowrap
            ${positionClasses[position]}
            ${scaleClasses[position]}
            transition-all duration-200 ease-out
            ${className}
          `}
        >
          {/* Tooltip content */}
          <div className="glass-effect dark:glass-effect px-3 py-2 rounded-lg shadow-xl border dark:border-purple-500/30">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {content}
            </div>
          </div>

          {/* Arrow */}
          <div className={`absolute ${arrowClasses[position]}`}>
            <div className="w-2 h-2 bg-white dark:bg-gray-900 border border-white/30 dark:border-purple-500/30 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
