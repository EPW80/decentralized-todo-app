import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  layered?: boolean;
  depth?: 'sm' | 'md' | 'lg';
  hover3d?: boolean;
  glow?: boolean;
  glowIntensity?: 'normal' | 'intense' | 'active';
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  layered = false,
  depth = 'md',
  hover3d = false,
  glow = false,
  glowIntensity = 'normal',
}) => {
  const depthClasses = {
    sm: 'depth-shadow-sm',
    md: 'depth-shadow',
    lg: 'depth-shadow-lg',
  };

  const glowClasses = {
    normal: 'shadow-glow',
    intense: 'glow-intense',
    active: 'glow-active',
  };

  if (layered) {
    return (
      <div className={`relative ${className}`}>
        {/* Layer 1 - Background layer */}
        <div className="absolute inset-0 glass-layer-1 rounded-2xl transform translate-x-2 translate-y-2" />

        {/* Layer 2 - Middle layer */}
        <div className="absolute inset-0 glass-layer-2 rounded-2xl transform translate-x-1 translate-y-1" />

        {/* Layer 3 - Top layer */}
        <div
          className={`
            relative glass-layer-3 rounded-2xl p-6
            ${depthClasses[depth]}
            ${hover3d ? 'floating-3d' : 'transition-transform hover:translate-y-[-4px]'}
            ${glow ? glowClasses[glowIntensity] : ''}
          `}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        glass-effect rounded-2xl p-6
        ${depthClasses[depth]}
        ${hover3d ? 'floating-3d' : 'transition-transform hover:translate-y-[-4px]'}
        ${glow ? glowClasses[glowIntensity] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
