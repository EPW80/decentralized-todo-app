import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const ReceiveIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props}>
      <path
        d="M12 2V16M12 16L7 11M12 16L17 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 18V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconWrapper>
  );
};

export default ReceiveIcon;
