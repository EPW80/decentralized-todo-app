import React from 'react';

interface EmptyWalletIllustrationProps {
  size?: number;
  className?: string;
}

const EmptyWalletIllustration: React.FC<EmptyWalletIllustrationProps> = ({
  size = 200,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#F3F4F6" />

      {/* Wallet */}
      <rect x="50" y="70" width="100" height="70" rx="8" fill="#667EEA" opacity="0.1" />
      <rect x="50" y="70" width="100" height="70" rx="8" stroke="#667EEA" strokeWidth="3" fill="none" />

      {/* Wallet flap */}
      <path d="M50 85 L150 85 L150 70 Q150 62 142 62 L58 62 Q50 62 50 70 Z" fill="#667EEA" opacity="0.2" />
      <path d="M50 85 L150 85" stroke="#667EEA" strokeWidth="3" strokeLinecap="round" />

      {/* Lock/Empty indicator */}
      <circle cx="100" cy="105" r="15" fill="white" stroke="#667EEA" strokeWidth="2" />
      <path
        d="M95 105 L100 110 L105 100"
        stroke="#667EEA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />

      {/* Floating particles */}
      <circle cx="65" cy="50" r="3" fill="#667EEA" opacity="0.3" className="animate-float" />
      <circle cx="135" cy="55" r="2" fill="#764BA2" opacity="0.3" className="animate-float" style={{ animationDelay: '0.5s' }} />
      <circle cx="70" cy="145" r="2.5" fill="#667EEA" opacity="0.3" className="animate-float" style={{ animationDelay: '1s' }} />
      <circle cx="130" cy="150" r="3" fill="#764BA2" opacity="0.3" className="animate-float" style={{ animationDelay: '1.5s' }} />
    </svg>
  );
};

export default EmptyWalletIllustration;
