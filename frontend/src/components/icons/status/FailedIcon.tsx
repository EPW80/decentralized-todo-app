import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const FailedIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M15 9L9 15M9 9L15 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </IconWrapper>
  );
};

export default FailedIcon;
