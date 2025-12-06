import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

interface GasPriceData {
  fast: number;
  standard: number;
  slow: number;
  current: number;
  lastUpdated: number;
  loading: boolean;
  error: string | null;
}

// Etherscan API endpoints for different networks
const API_ENDPOINTS: Record<number, string> = {
  1: 'https://api.etherscan.io/api',
  11155111: 'https://api-sepolia.etherscan.io/api', // Sepolia
  137: 'https://api.polygonscan.com/api', // Polygon
  80001: 'https://api-testnet.polygonscan.com/api', // Mumbai
  // For other networks, we'll fallback to provider gasPrice
};

export const useGasPrice = (refreshInterval: number = 15000) => {
  const { provider, chainId } = useWeb3();
  const [gasData, setGasData] = useState<GasPriceData>({
    fast: 0,
    standard: 0,
    slow: 0,
    current: 0,
    lastUpdated: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let mounted = true;

    const fetchGasPrice = async () => {
      if (!provider || !chainId) {
        setGasData(prev => ({ ...prev, loading: false, error: 'No provider connected' }));
        return;
      }

      try {
        setGasData(prev => ({ ...prev, loading: true, error: null }));

        const apiEndpoint = API_ENDPOINTS[chainId];

        if (apiEndpoint) {
          // Use Etherscan/Polygonscan API for supported networks
          try {
            const response = await fetch(
              `${apiEndpoint}?module=gastracker&action=gasoracle&apikey=YourApiKeyToken`
            );
            const data = await response.json();

            if (data.status === '1' && data.result) {
              const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = data.result;

              if (mounted) {
                setGasData({
                  slow: parseFloat(SafeGasPrice || '0'),
                  standard: parseFloat(ProposeGasPrice || '0'),
                  fast: parseFloat(FastGasPrice || '0'),
                  current: parseFloat(ProposeGasPrice || '0'),
                  lastUpdated: Date.now(),
                  loading: false,
                  error: null,
                });
              }
              return;
            }
          } catch (apiError) {
            console.warn('API fetch failed, falling back to provider:', apiError);
          }
        }

        // Fallback to provider for unsupported networks or API failures
        const feeData = await provider.getFeeData();
        const gasPriceWei = feeData.gasPrice || BigInt(0);
        const gasPriceGwei = Number(gasPriceWei) / 1e9;

        if (mounted) {
          // Estimate slow/standard/fast based on current price
          setGasData({
            slow: gasPriceGwei * 0.8,
            standard: gasPriceGwei,
            fast: gasPriceGwei * 1.2,
            current: gasPriceGwei,
            lastUpdated: Date.now(),
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching gas price:', error);
        if (mounted) {
          setGasData(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch gas price',
          }));
        }
      }
    };

    // Initial fetch
    fetchGasPrice();

    // Set up interval for periodic updates
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchGasPrice, refreshInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [provider, chainId, refreshInterval]);

  return gasData;
};

// Hook for historical gas price data (simulated for now)
export const useHistoricalGasPrice = (hours: number = 24) => {
  const { chainId } = useWeb3();
  const [history, setHistory] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate historical data
    // In production, this would fetch from a blockchain analytics API
    const generateMockHistory = () => {
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      const dataPoints: Array<{ timestamp: number; price: number }> = [];

      for (let i = hours; i >= 0; i--) {
        const timestamp = now - i * hourMs;
        // Generate realistic-looking gas prices with some variance
        const basePrice = chainId === 1 ? 30 : 20; // Higher for mainnet
        const variance = Math.sin(i / 4) * 10 + Math.random() * 5;
        const price = Math.max(basePrice + variance, 1);

        dataPoints.push({ timestamp, price });
      }

      setHistory(dataPoints);
      setLoading(false);
    };

    generateMockHistory();
  }, [hours, chainId]);

  return { history, loading };
};
