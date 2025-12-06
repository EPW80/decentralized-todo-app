import React from 'react';

export interface ActiveGlowProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  intensity?: 'normal' | 'intense' | 'extreme';
  color?: 'purple' | 'blue' | 'custom';
  customColor?: string;
  pulse?: boolean;
}

const ActiveGlow: React.FC<ActiveGlowProps> = ({
  children,
  className = '',
  active = false,
  intensity = 'intense',
  color = 'blue',
  customColor,
  pulse = true,
}) => {
  const getGlowStyle = () => {
    if (!active) return {};

    const colors = {
      purple: 'rgba(118, 75, 162, 0.8)',
      blue: 'rgba(102, 126, 234, 0.8)',
      custom: customColor || 'rgba(102, 126, 234, 0.8)',
    };

    const glowColor = colors[color];

    const shadows = {
      normal: `
        0 0 20px ${glowColor},
        0 0 40px ${glowColor.replace('0.8', '0.5')},
        0 0 60px ${glowColor.replace('0.8', '0.3')}
      `,
      intense: `
        0 0 30px ${glowColor},
        0 0 60px ${glowColor.replace('0.8', '0.6')},
        0 0 90px ${glowColor.replace('0.8', '0.4')},
        inset 0 0 20px ${glowColor.replace('0.8', '0.1')}
      `,
      extreme: `
        0 0 40px ${glowColor},
        0 0 80px ${glowColor},
        0 0 120px ${glowColor.replace('0.8', '0.7')},
        0 0 160px ${glowColor.replace('0.8', '0.5')},
        inset 0 0 30px ${glowColor.replace('0.8', '0.15')}
      `,
    };

    return {
      boxShadow: shadows[intensity],
    };
  };

  const getGlowClass = () => {
    if (!active) return '';
    if (pulse) {
      return color === 'purple' ? 'glow-intense-purple' : 'glow-active';
    }
    return intensity === 'normal'
      ? 'shadow-glow'
      : color === 'purple'
      ? 'glow-intense-purple'
      : 'glow-intense';
  };

  return (
    <div
      className={`
        ${getGlowClass()}
        transition-all duration-500
        ${className}
      `}
      style={active ? getGlowStyle() : {}}
    >
      {children}
    </div>
  );
};

export default ActiveGlow;
