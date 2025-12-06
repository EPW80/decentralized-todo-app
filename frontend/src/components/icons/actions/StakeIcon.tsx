import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const StakeIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      {/* Stack of coins */}
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M4 6V14C4 15.6569 7.58172 17 12 17C16.4183 17 20 15.6569 20 14V6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <ellipse cx="12" cy="10" rx="8" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="12" cy="14" rx="8" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Lock symbol */}
      <circle cx="18" cy="18" r="4" fill="currentColor" />
      <path
        d="M18 16.5V17.5M18 17.5V19M18 17.5H16.5M18 17.5H19.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconWrapper>
  );
};

export default StakeIcon;
