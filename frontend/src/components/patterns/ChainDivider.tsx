import React from 'react';
import ChainLinkPattern from './ChainLinkPattern';

interface ChainDividerProps {
  className?: string;
  animated?: boolean;
}

const ChainDivider: React.FC<ChainDividerProps> = ({
  className = '',
  animated = false,
}) => {
  return (
    <div className={`flex items-center gap-4 my-6 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-purple-300"></div>
      <ChainLinkPattern count={3} animated={animated} direction="horizontal" />
      <div className="flex-1 h-px bg-gradient-to-r from-purple-300 via-purple-300 to-transparent"></div>
    </div>
  );
};

export default ChainDivider;
