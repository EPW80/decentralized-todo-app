import React from 'react';
import IconWrapper, { type IconProps } from '../IconWrapper';

const SwapIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <path
        d="M7 16V4M7 4L3 8M7 4L11 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 8V20M17 20L21 16M17 20L13 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
};

export default SwapIcon;
