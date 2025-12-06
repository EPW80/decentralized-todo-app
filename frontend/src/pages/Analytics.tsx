import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useGasPrice } from '../hooks/useGasPrice';
import GasPriceIndicator from '../components/transaction/GasPriceIndicator';
import GasTrendChart from '../components/charts/GasTrendChart';
import ActivityChart from '../components/charts/ActivityChart';
import NetworkActivityStats from '../components/charts/NetworkActivityStats';
import TrustScore from '../components/security/TrustScore';
import ValidationBadge from '../components/security/ValidationBadge';
import ConfirmationProgress from '../components/transaction/ConfirmationProgress';
import TransactionTimeline from '../components/transaction/TransactionTimeline';
import type { TransactionStage } from '../types/transaction';

const Analytics: React.FC = () => {
  const { address, isConnected } = useWeb3();
  const gasData = useGasPrice();

  // Sample data for demo purposes
  const [demoTransaction] = useState({
    stage: 'confirming' as TransactionStage,
    confirmations: 8,
    requiredConfirmations: 12,
    blockNumber: 12345678,
  });

  // Sample activity data
  const sampleActivityData = [
    { date: '2025-12-01', count: 5, type: 'created' as const },
    { date: '2025-12-01', count: 3, type: 'completed' as const },
    { date: '2025-12-02', count: 8, type: 'created' as const },
    { date: '2025-12-02', count: 6, type: 'completed' as const },
    { date: '2025-12-02', count: 1, type: 'deleted' as const },
    { date: '2025-12-03', count: 4, type: 'created' as const },
    { date: '2025-12-03', count: 4, type: 'completed' as const },
    { date: '2025-12-04', count: 6, type: 'created' as const },
    { date: '2025-12-04', count: 3, type: 'completed' as const },
    { date: '2025-12-05', count: 7, type: 'created' as const },
    { date: '2025-12-05', count: 5, type: 'completed' as const },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time blockchain metrics, gas prices, and security insights
        </p>
      </div>

      {!isConnected && (
        <div className="glass-layer-2 rounded-2xl p-8 text-center mb-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to view real-time analytics and network data
          </p>
        </div>
      )}

      {/* Gas Price Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gas Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {!gasData.loading && (
            <>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Compact View</p>
                <GasPriceIndicator gasPriceGwei={gasData.current} variant="compact" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Default View</p>
                <GasPriceIndicator gasPriceGwei={gasData.current} variant="default" />
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Detailed View</p>
                <GasPriceIndicator gasPriceGwei={gasData.current} variant="detailed" />
              </div>
            </>
          )}
        </div>

        {/* Gas Trend Chart */}
        <GasTrendChart hours={24} />
      </div>

      {/* Network & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Network Stats */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Network Activity
          </h2>
          <NetworkActivityStats />
        </div>

        {/* Activity Chart */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Todo Activity
          </h2>
          <ActivityChart data={sampleActivityData} days={7} />
        </div>
      </div>

      {/* Security Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Security & Trust
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trust Score Variants */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Trust Score - Compact
              </p>
              <TrustScore
                address={address}
                transactionCount={42}
                confirmations={10}
                requiredConfirmations={12}
                variant="compact"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Trust Score - Default
              </p>
              <TrustScore
                address={address}
                transactionCount={42}
                confirmations={10}
                requiredConfirmations={12}
                variant="default"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Trust Score - Detailed
              </p>
              <TrustScore
                address={address}
                transactionCount={42}
                confirmations={10}
                requiredConfirmations={12}
                variant="detailed"
              />
            </div>
          </div>

          {/* Validation Badge Variants */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Validation - Compact
              </p>
              <ValidationBadge variant="compact" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Validation - Default
              </p>
              <ValidationBadge variant="default" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Validation - Detailed
              </p>
              <ValidationBadge variant="detailed" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Tracking Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Transaction Tracking
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confirmation Progress */}
          <div className="glass-layer-2 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirmation Progress
            </h3>
            <ConfirmationProgress
              stage={demoTransaction.stage}
              confirmations={demoTransaction.confirmations}
              requiredConfirmations={demoTransaction.requiredConfirmations}
              blockNumber={demoTransaction.blockNumber}
              showDetails={true}
            />
          </div>

          {/* Transaction Timeline */}
          <div className="glass-layer-2 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Transaction Timeline
            </h3>
            <TransactionTimeline
              events={[
                {
                  stage: 'initiated',
                  timestamp: Date.now() - 300000,
                  description: 'Transaction initiated',
                },
                {
                  stage: 'pending',
                  timestamp: Date.now() - 240000,
                  description: 'Submitted to mempool',
                  hash: '0x1234...5678',
                },
                {
                  stage: 'confirming',
                  timestamp: Date.now() - 180000,
                  description: 'Mining confirmation 8/12',
                  blockNumber: 12345678,
                },
              ]}
              currentStage={demoTransaction.stage}
              variant="full"
            />
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="glass-layer-1 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              About Phase 4 Features
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              This dashboard showcases Phase 4 data visualization features including real-time gas price monitoring,
              historical trends, network activity metrics, security trust scores, and comprehensive transaction tracking.
              All components are network-aware and update automatically based on your connected wallet and blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
