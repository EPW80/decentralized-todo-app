import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const SendIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="13" r="1.5" fill="currentColor" />
    </IconWrapper>
  );
};

export default SendIcon;
