import { useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { getNetworkTheme, hexToRgb } from '../config/networkThemes';
import type { NetworkTheme } from '../config/networkThemes';

/**
 * Hook to get the current network theme based on the connected chain
 */
export const useNetworkTheme = (): NetworkTheme => {
  const { chainId } = useWeb3();
  const theme = getNetworkTheme(chainId);

  // Update CSS custom properties when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const rgbPrimary = hexToRgb(theme.primaryColor);
    const rgbSecondary = hexToRgb(theme.secondaryColor);

    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--shadow-color', theme.glowColor);
    root.style.setProperty('--gradient-primary', theme.gradient);
    root.style.setProperty('--rgb-primary', rgbPrimary);
    root.style.setProperty('--rgb-secondary', rgbSecondary);
  }, [theme]);

  return theme;
};
