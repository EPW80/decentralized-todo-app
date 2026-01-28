import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import * as Web3Context from '../../contexts/Web3Context';

// Mock the Web3Context
vi.mock('../../contexts/Web3Context', () => ({
  useWeb3: vi.fn(),
}));

// Mock the network themes config
vi.mock('../../config/networkThemes', () => ({
  getNetworkTheme: vi.fn((chainId: number) => ({
    primaryColor: chainId === 1 ? '#627eea' : '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f093fb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    name: chainId === 1 ? 'Ethereum Mainnet' : 'Localhost',
  })),
  hexToRgb: vi.fn((_hex: string) => {
    // Simple hex to RGB conversion for testing
    return '102, 126, 234';
  }),
}));

describe('useNetworkTheme Hook', () => {
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      chainId: 1,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      provider: null,
    });
  });

  afterEach(() => {
    setPropertySpy.mockRestore();
    vi.clearAllMocks();
  });

  it('returns network theme based on chainId', () => {
    const { result } = renderHook(() => useNetworkTheme());

    expect(result.current).toHaveProperty('primaryColor');
    expect(result.current).toHaveProperty('secondaryColor');
    expect(result.current).toHaveProperty('gradient');
    expect(result.current).toHaveProperty('name');
  });

  it('updates CSS custom properties when theme changes', () => {
    renderHook(() => useNetworkTheme());

    expect(setPropertySpy).toHaveBeenCalledWith('--color-primary', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--color-secondary', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--color-accent', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--shadow-color', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--gradient-primary', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--rgb-primary', expect.any(String));
    expect(setPropertySpy).toHaveBeenCalledWith('--rgb-secondary', expect.any(String));
  });

  it('updates theme when chainId changes', () => {
    const { rerender } = renderHook(() => useNetworkTheme());

    setPropertySpy.mockClear();

    // Change chainId
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      chainId: 11155111,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      provider: null,
    });

    rerender();

    // CSS properties should be updated again
    expect(setPropertySpy).toHaveBeenCalled();
  });

  it('handles null chainId gracefully', () => {
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      chainId: null,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      provider: null,
    });

    const { result } = renderHook(() => useNetworkTheme());

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('primaryColor');
  });
});
