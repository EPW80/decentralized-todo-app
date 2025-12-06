import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const WalletConnectIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 40 40">
      {/* WalletConnect Bridge */}
      <defs>
        <linearGradient id="walletconnect-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4AB3F4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3396FF', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#walletconnect-gradient)" />
      <path
        d="M13.5 16.5c3.5-3.5 9-3.5 12.5 0l.5.5c.2.2.2.5 0 .7l-1.7 1.7c-.1.1-.3.1-.4 0l-.7-.7c-2.5-2.5-6.5-2.5-9 0l-.7.7c-.1.1-.3.1-.4 0l-1.7-1.7c-.2-.2-.2-.5 0-.7l.6-.5zm15.4 3.5l1.5 1.5c.2.2.2.5 0 .7L24 28.6c-.2.2-.5.2-.7 0l-4.1-4.1c0-.1-.1-.1-.2 0l-4.1 4.1c-.2.2-.5.2-.7 0l-6.4-6.4c-.2-.2-.2-.5 0-.7l1.5-1.5c.2-.2.5-.2.7 0l4.1 4.1c.1.1.2.1.2 0l4.1-4.1c.2-.2.5-.2.7 0l4.1 4.1c.1.1.2.1.2 0l4.1-4.1c.2-.2.5-.2.7 0z"
        fill="white"
      />
    </IconWrapper>
  );
};

export default WalletConnectIcon;
