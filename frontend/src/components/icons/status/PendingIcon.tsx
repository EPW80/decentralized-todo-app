import React from 'react';
import IconWrapper, { type IconProps } from '../IconWrapper';

const PendingIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 6V12L16 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" className="animate-pulse" />
    </IconWrapper>
  );
};

export default PendingIcon;
