import React from 'react';
import IconWrapper, { type IconProps } from '../IconWrapper';

const ConfirmedIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
};

export default ConfirmedIcon;
