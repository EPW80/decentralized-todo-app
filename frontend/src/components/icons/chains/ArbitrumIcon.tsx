import React from 'react';
import IconWrapper, { type IconProps } from '../IconWrapper';

const ArbitrumIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 40 40">
      {/* Arbitrum Logo */}
      <circle cx="20" cy="20" r="20" fill="#28A0F0" />
      <path
        d="M24.5 11.5L26.8 15.2L29.5 20.5L26.8 25.8L24.5 29.5L22.2 25.8L19.5 20.5L22.2 15.2L24.5 11.5Z"
        fill="white"
      />
      <path
        d="M15.5 11.5L17.8 15.2L20.5 20.5L17.8 25.8L15.5 29.5L13.2 25.8L10.5 20.5L13.2 15.2L15.5 11.5Z"
        fill="white"
        opacity="0.6"
      />
      <path
        d="M20 8L22.3 11.7L25 17L22.3 22.3L20 26L17.7 22.3L15 17L17.7 11.7L20 8Z"
        fill="white"
        opacity="0.3"
      />
    </IconWrapper>
  );
};

export default ArbitrumIcon;
