import React from 'react';

export interface IconProps {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

interface IconWrapperProps extends IconProps {
  children: React.ReactNode;
  viewBox?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  size = 24,
  className = '',
  color,
  style,
  viewBox = '0 0 24 24',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        ...style,
        color: color || style?.color,
      }}
    >
      {children}
    </svg>
  );
};

export default IconWrapper;
