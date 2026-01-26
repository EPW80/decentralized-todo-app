import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import { useGasPrice } from '../../hooks/useGasPrice';

interface NetworkStats {
  blockNumber: number;
  blockTime: number;
  pendingTransactions: number;
  networkHashrate: string;
  difficulty: string;
  lastBlockTimestamp: number;
}

const NetworkActivityStats: React.FC = () => {
  const { provider, chainId, isConnected } = useWeb3();
  const networkTheme = useNetworkTheme();
  const gasData = useGasPrice();
  const [stats, setStats] = useState<NetworkStats>({
    blockNumber: 0,
    blockTime: 0,
    pendingTransactions: 0,
    networkHashrate: 'N/A',
    difficulty: 'N/A',
    lastBlockTimestamp: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const blockSubscription: (() => void) | null = null;

    const fetchNetworkStats = async () => {
      if (!provider || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get current block number
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);

        // Get previous block to calculate block time
        const prevBlock = await provider.getBlock(blockNumber - 1);
        const blockTime = block && prevBlock
          ? block.timestamp - prevBlock.timestamp
          : 0;

        if (mounted) {
          setStats({
            blockNumber,
            blockTime,
            pendingTransactions: 0, // Most providers don't expose this
            networkHashrate: 'N/A',
            difficulty: 'N/A',
            lastBlockTimestamp: block?.timestamp || 0,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching network stats:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchNetworkStats();

    // Subscribe to new blocks
    if (provider) {
      provider.on('block', (blockNumber: number) => {
        if (mounted) {
          setStats(prev => ({ ...prev, blockNumber }));
        }
      });
    }

    return () => {
      mounted = false;
      if (provider && blockSubscription) {
        provider.off('block', blockSubscription);
      }
    };
  }, [provider, isConnected]);

  const getNetworkName = (chainId: number | null): string => {
    const names: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon',
      80001: 'Mumbai Testnet',
      42161: 'Arbitrum One',
      421613: 'Arbitrum Goerli',
      10: 'Optimism',
      11155420: 'Optimism Sepolia',
      31337: 'Localhost',
    };
    return chainId ? names[chainId] || `Chain ${chainId}` : 'Not Connected';
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && !isConnected) {
    return (
      <div className="glass-layer-2 rounded-2xl p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-medium">Connect wallet to view network stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-layer-2 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Network Activity</h3>
          <p className="text-sm" style={{ color: networkTheme.primaryColor }}>
            {getNetworkName(chainId)}
          </p>
        </div>
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: isConnected ? '#10B981' : '#6B7280' }}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Block */}
        <div
          className="p-4 rounded-xl border-2 backdrop-blur-sm"
          style={{
            backgroundColor: `${networkTheme.primaryColor}10`,
            borderColor: `${networkTheme.primaryColor}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" style={{ color: networkTheme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current Block</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.blockNumber.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {formatTimestamp(stats.lastBlockTimestamp)}
          </p>
        </div>

        {/* Block Time */}
        <div
          className="p-4 rounded-xl border-2 backdrop-blur-sm"
          style={{
            backgroundColor: `${networkTheme.secondaryColor}10`,
            borderColor: `${networkTheme.secondaryColor}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" style={{ color: networkTheme.secondaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Block Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.blockTime > 0 ? `${stats.blockTime}s` : 'N/A'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Average confirmation
          </p>
        </div>

        {/* Current Gas Price */}
        <div
          className="p-4 rounded-xl border-2 backdrop-blur-sm"
          style={{
            backgroundColor: `${networkTheme.accentColor}10`,
            borderColor: `${networkTheme.accentColor}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" style={{ color: networkTheme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gas Price</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {gasData.loading ? '...' : gasData.current.toFixed(1)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Gwei (current)
          </p>
        </div>

        {/* Network Health */}
        <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-50">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Health</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {isConnected ? 'Healthy' : 'Offline'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Network status
          </p>
        </div>
      </div>

      {/* Gas Price Range */}
      <div className="p-4 bg-white dark:bg-gray-800 bg-opacity-50 rounded-xl space-y-3">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gas Price Range</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 font-medium">Slow</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {gasData.loading ? '...' : gasData.slow.toFixed(1)} Gwei
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                style={{ width: gasData.slow ? `${Math.min((gasData.slow / 100) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-600 font-medium">Standard</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {gasData.loading ? '...' : gasData.standard.toFixed(1)} Gwei
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all"
                style={{ width: gasData.standard ? `${Math.min((gasData.standard / 100) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-600 font-medium">Fast</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {gasData.loading ? '...' : gasData.fast.toFixed(1)} Gwei
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
                style={{ width: gasData.fast ? `${Math.min((gasData.fast / 100) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400">
        Last updated: {gasData.lastUpdated ? formatTimestamp(Math.floor(gasData.lastUpdated / 1000)) : 'Never'}
      </div>
    </div>
  );
};

export default NetworkActivityStats;
