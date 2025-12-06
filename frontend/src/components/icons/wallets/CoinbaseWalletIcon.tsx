import React from 'react';
import IconWrapper, { IconProps } from '../IconWrapper';

const CoinbaseWalletIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 40 40">
      {/* Coinbase Wallet Logo */}
      <defs>
        <linearGradient id="coinbase-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2E66F8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#124ADB', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill="url(#coinbase-gradient)" />
      <rect x="12" y="12" width="16" height="16" rx="2" fill="white" />
    </IconWrapper>
  );
};

export default CoinbaseWalletIcon;
