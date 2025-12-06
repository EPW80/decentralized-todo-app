import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const OptimismIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 40 40">
      {/* Optimism Logo */}
      <circle cx="20" cy="20" r="20" fill="#FF0420" />
      <g transform="translate(8, 12)">
        {/* O shape */}
        <ellipse cx="7" cy="8" rx="6" ry="7" fill="none" stroke="white" strokeWidth="3" />
        {/* Underline */}
        <path d="M16 13 Q18 13, 20 11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </g>
    </IconWrapper>
  );
};

export default OptimismIcon;
