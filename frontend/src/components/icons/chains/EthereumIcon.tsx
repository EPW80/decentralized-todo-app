import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const EthereumIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 40 40">
      {/* Ethereum Diamond */}
      <circle cx="20" cy="20" r="20" fill="#627EEA" />
      <g opacity="0.6">
        <path d="M20 4L19.6 5.3V25.7L20 26.1L29.2 20.5L20 4Z" fill="white" />
      </g>
      <path d="M20 4L10.8 20.5L20 26.1V4Z" fill="white" />
      <g opacity="0.6">
        <path d="M20 28.1L19.8 28.4V35.6L20 36.2L29.2 22.6L20 28.1Z" fill="white" />
      </g>
      <path d="M20 36.2V28.1L10.8 22.6L20 36.2Z" fill="white" />
      <g opacity="0.2">
        <path d="M20 26.1L29.2 20.5L20 15.5V26.1Z" fill="white" />
      </g>
      <g opacity="0.6">
        <path d="M10.8 20.5L20 26.1V15.5L10.8 20.5Z" fill="white" />
      </g>
    </IconWrapper>
  );
};

export default EthereumIcon;
