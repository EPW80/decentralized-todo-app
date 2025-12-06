import React from 'react';

interface BlockchainIllustrationProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const BlockchainIllustration: React.FC<BlockchainIllustrationProps> = ({
  size = 200,
  className = '',
  animated = true,
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
      {/* Background */}
      <circle cx="100" cy="100" r="80" fill="#F9FAFB" />

      {/* Blockchain blocks */}
      <g opacity="0.9">
        {/* Block 1 */}
        <rect x="30" y="85" width="30" height="30" rx="4" fill="#667EEA" opacity="0.8" />
        <rect x="30" y="85" width="30" height="30" rx="4" stroke="#667EEA" strokeWidth="2" fill="none" />
        <circle cx="45" cy="100" r="3" fill="white" className={animated ? 'animate-pulse' : ''} />

        {/* Block 2 */}
        <rect x="70" y="85" width="30" height="30" rx="4" fill="#764BA2" opacity="0.8" />
        <rect x="70" y="85" width="30" height="30" rx="4" stroke="#764BA2" strokeWidth="2" fill="none" />
        <circle cx="85" cy="100" r="3" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }} />

        {/* Block 3 */}
        <rect x="110" y="85" width="30" height="30" rx="4" fill="#667EEA" opacity="0.8" />
        <rect x="110" y="85" width="30" height="30" rx="4" stroke="#667EEA" strokeWidth="2" fill="none" />
        <circle cx="125" cy="100" r="3" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }} />

        {/* Block 4 */}
        <rect x="150" y="85" width="30" height="30" rx="4" fill="#764BA2" opacity="0.8" />
        <rect x="150" y="85" width="30" height="30" rx="4" stroke="#764BA2" strokeWidth="2" fill="none" />
        <circle cx="165" cy="100" r="3" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }} />
      </g>

      {/* Connecting lines */}
      <line x1="60" y1="100" x2="70" y2="100" stroke="#667EEA" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="100" y1="100" x2="110" y2="100" stroke="#764BA2" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="140" y1="100" x2="150" y2="100" stroke="#667EEA" strokeWidth="2" strokeDasharray="4 2" />

      {/* Network nodes above and below */}
      <circle cx="45" cy="60" r="4" fill="#667EEA" opacity="0.4" className={animated ? 'animate-node-glow' : ''} />
      <circle cx="125" cy="60" r="4" fill="#764BA2" opacity="0.4" className={animated ? 'animate-node-glow' : ''} style={{ animationDelay: '0.3s' }} />
      <circle cx="85" cy="140" r="4" fill="#667EEA" opacity="0.4" className={animated ? 'animate-node-glow' : ''} style={{ animationDelay: '0.6s' }} />
      <circle cx="165" cy="140" r="4" fill="#764BA2" opacity="0.4" className={animated ? 'animate-node-glow' : ''} style={{ animationDelay: '0.9s' }} />

      {/* Connection lines to nodes */}
      <line x1="45" y1="85" x2="45" y2="64" stroke="#667EEA" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      <line x1="125" y1="85" x2="125" y2="64" stroke="#764BA2" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      <line x1="85" y1="115" x2="85" y2="136" stroke="#667EEA" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      <line x1="165" y1="115" x2="165" y2="136" stroke="#764BA2" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
};

export default BlockchainIllustration;
