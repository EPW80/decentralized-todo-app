import React from 'react';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  frosted?: boolean;
  floating?: boolean;
  dark?: boolean;
  animate?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  frosted = false,
  floating = true,
  dark = false,
  animate = false,
}) => {
  const glassClass = frosted
    ? dark
      ? 'glass-frosted-dark'
      : 'glass-frosted'
    : 'glass-effect';

  const floatingClass = floating ? 'floating-3d-heavy' : '';
  const animateClass = animate ? 'animate-float-3d' : '';

  return (
    <div
      className={`
        ${glassClass}
        ${floatingClass}
        ${animateClass}
        rounded-2xl p-6
        depth-shadow-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
