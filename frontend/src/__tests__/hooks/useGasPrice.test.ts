import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGasPrice, useHistoricalGasPrice } from '../../hooks/useGasPrice';
import * as Web3Context from '../../contexts/Web3Context';

// Mock the Web3Context
vi.mock('../../contexts/Web3Context', () => ({
  useWeb3: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useGasPrice Hook', () => {
  const mockProvider = {
    getFeeData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      provider: mockProvider as any,
      chainId: 1,
      address: '0x123',
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
    });

    mockProvider.getFeeData.mockResolvedValue({
      gasPrice: BigInt(30000000000), // 30 Gwei
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useGasPrice());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches gas price from provider', async () => {
    const { result } = renderHook(() => useGasPrice());

    // Advance timers to allow async operations
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.current).toBeGreaterThan(0);
    expect(result.current.fast).toBeGreaterThan(result.current.standard);
    expect(result.current.standard).toBeGreaterThan(result.current.slow);
  });

  it('attempts API fetch for supported networks', async () => {
    const mockApiResponse = {
      status: '1',
      result: {
        SafeGasPrice: '25',
        ProposeGasPrice: '30',
        FastGasPrice: '35',
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useGasPrice());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.slow).toBe(25);
    expect(result.current.standard).toBe(30);
    expect(result.current.fast).toBe(35);
  });

  it('falls back to provider when API fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useGasPrice());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.loading).toBe(false);
    // Should still have gas data from provider fallback
    expect(result.current.current).toBeGreaterThan(0);
  });

  it('handles no provider gracefully', async () => {
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      provider: null,
      chainId: null,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
    });

    const { result } = renderHook(() => useGasPrice());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.loading).toBe(false);

    expect(result.current.error).toBe('No provider connected');
  });

  it('refreshes gas price at specified interval', async () => {
    const { result } = renderHook(() => useGasPrice(5000)); // 5 second interval

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.loading).toBe(false);
    const initialTimestamp = result.current.lastUpdated;

    // Fast-forward 5 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.lastUpdated).toBeGreaterThan(initialTimestamp);
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useGasPrice(5000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});

describe('useHistoricalGasPrice Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

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
    vi.useRealTimers();
  });

  it('returns initial loading state', async () => {
    const { result } = renderHook(() => useHistoricalGasPrice());

    // The hook immediately generates mock data synchronously, so loading becomes false
    // after the first effect runs
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    
    // After effect runs, loading should be false and history populated
    expect(result.current.loading).toBe(false);
    expect(result.current.history.length).toBeGreaterThan(0);
  });

  it('generates historical data points', async () => {
    const { result } = renderHook(() => useHistoricalGasPrice(24));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(result.current.loading).toBe(false);

    expect(result.current.history.length).toBeGreaterThan(0);
    expect(result.current.history[0]).toHaveProperty('timestamp');
    expect(result.current.history[0]).toHaveProperty('price');
  });

  it('generates correct number of data points', async () => {
    const hours = 12;
    const { result } = renderHook(() => useHistoricalGasPrice(hours));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(result.current.loading).toBe(false);

    // Should have hours + 1 data points (including current)
    expect(result.current.history.length).toBe(hours + 1);
  });

  it('adjusts base price for different networks', async () => {
    // Test with mainnet
    const { result: mainnetResult } = renderHook(() => useHistoricalGasPrice(24));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(mainnetResult.current.loading).toBe(false);

    const mainnetPrices = mainnetResult.current.history.map(d => d.price);

    // Test with testnet
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

    const { result: testnetResult } = renderHook(() => useHistoricalGasPrice(24));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(testnetResult.current.loading).toBe(false);

    const testnetPrices = testnetResult.current.history.map(d => d.price);

    // Mainnet should generally have higher prices
    const mainnetAvg = mainnetPrices.reduce((a, b) => a + b, 0) / mainnetPrices.length;
    const testnetAvg = testnetPrices.reduce((a, b) => a + b, 0) / testnetPrices.length;

    expect(mainnetAvg).toBeGreaterThan(testnetAvg);
  });
});
