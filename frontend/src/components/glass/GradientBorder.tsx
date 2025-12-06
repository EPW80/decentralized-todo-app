import React from 'react';

export interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'static' | 'animated' | 'rainbow';
  thickness?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  glow?: boolean;
}

const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  className = '',
  variant = 'static',
  thickness = 2,
  rounded = 'xl',
  glow = false,
}) => {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'animated':
        return 'border-gradient-animated';
      case 'rainbow':
        return 'border-rainbow';
      default:
        return 'border-gradient';
    }
  };

  return (
    <div
      className={`
        ${getVariantClass()}
        ${roundedClasses[rounded]}
        ${glow ? 'glow-intense' : ''}
        ${className}
      `}
      style={{
        borderWidth: `${thickness}px`,
      }}
    >
      <div className={`${roundedClasses[rounded]} overflow-hidden`}>
        {children}
      </div>
    </div>
  );
};

export default GradientBorder;
