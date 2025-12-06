export interface NetworkTheme {
  chainId: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  glowColor: string;
  badgeGradient: string;
}

export const networkThemes: Record<number, NetworkTheme> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    primaryColor: '#627EEA',
    secondaryColor: '#7C95F0',
    accentColor: '#4A67D8',
    gradient: 'linear-gradient(135deg, #627EEA 0%, #7C95F0 100%)',
    glowColor: 'rgba(98, 126, 234, 0.35)',
    badgeGradient: 'from-[#627EEA] to-[#7C95F0]',
  },

  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    primaryColor: '#FF6B9D',
    secondaryColor: '#FF8FB5',
    accentColor: '#FF4785',
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)',
    glowColor: 'rgba(255, 107, 157, 0.35)',
    badgeGradient: 'from-[#FF6B9D] to-[#FF8FB5]',
  },

  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    primaryColor: '#8247E5',
    secondaryColor: '#9D6BF0',
    accentColor: '#6A23D8',
    gradient: 'linear-gradient(135deg, #8247E5 0%, #9D6BF0 100%)',
    glowColor: 'rgba(130, 71, 229, 0.35)',
    badgeGradient: 'from-[#8247E5] to-[#9D6BF0]',
  },

  // Polygon Mumbai Testnet
  80001: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    primaryColor: '#8247E5',
    secondaryColor: '#9D6BF0',
    accentColor: '#6A23D8',
    gradient: 'linear-gradient(135deg, #8247E5 0%, #9D6BF0 100%)',
    glowColor: 'rgba(130, 71, 229, 0.35)',
    badgeGradient: 'from-[#8247E5] to-[#9D6BF0]',
  },

  // Arbitrum
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    primaryColor: '#28A0F0',
    secondaryColor: '#4DB8F5',
    accentColor: '#0C88D8',
    gradient: 'linear-gradient(135deg, #28A0F0 0%, #4DB8F5 100%)',
    glowColor: 'rgba(40, 160, 240, 0.35)',
    badgeGradient: 'from-[#28A0F0] to-[#4DB8F5]',
  },

  // Arbitrum Goerli Testnet
  421613: {
    chainId: 421613,
    name: 'Arbitrum Goerli',
    primaryColor: '#28A0F0',
    secondaryColor: '#4DB8F5',
    accentColor: '#0C88D8',
    gradient: 'linear-gradient(135deg, #28A0F0 0%, #4DB8F5 100%)',
    glowColor: 'rgba(40, 160, 240, 0.35)',
    badgeGradient: 'from-[#28A0F0] to-[#4DB8F5]',
  },

  // Optimism
  10: {
    chainId: 10,
    name: 'Optimism',
    primaryColor: '#FF0420',
    secondaryColor: '#FF3347',
    accentColor: '#D60318',
    gradient: 'linear-gradient(135deg, #FF0420 0%, #FF3347 100%)',
    glowColor: 'rgba(255, 4, 32, 0.35)',
    badgeGradient: 'from-[#FF0420] to-[#FF3347]',
  },

  // Optimism Sepolia Testnet
  11155420: {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    primaryColor: '#FF0420',
    secondaryColor: '#FF3347',
    accentColor: '#D60318',
    gradient: 'linear-gradient(135deg, #FF0420 0%, #FF3347 100%)',
    glowColor: 'rgba(255, 4, 32, 0.35)',
    badgeGradient: 'from-[#FF0420] to-[#FF3347]',
  },

  // Localhost/Hardhat
  31337: {
    chainId: 31337,
    name: 'Localhost',
    primaryColor: '#667EEA',
    secondaryColor: '#764BA2',
    accentColor: '#5469D4',
    gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.35)',
    badgeGradient: 'from-[#667EEA] to-[#764BA2]',
  },
};

// Default theme (fallback for unknown networks)
export const defaultTheme: NetworkTheme = {
  chainId: 0,
  name: 'Unknown Network',
  primaryColor: '#667EEA',
  secondaryColor: '#764BA2',
  accentColor: '#5469D4',
  gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  glowColor: 'rgba(102, 126, 234, 0.35)',
  badgeGradient: 'from-[#667EEA] to-[#764BA2]',
};

/**
 * Get the theme configuration for a specific chain ID
 */
export const getNetworkTheme = (chainId: number | null): NetworkTheme => {
  if (!chainId) return defaultTheme;
  return networkThemes[chainId] || defaultTheme;
};

/**
 * Convert hex color to RGB values for use in rgba()
 */
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '102, 126, 234'; // Default to primary color RGB

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};
