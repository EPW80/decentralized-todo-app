import React from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import type { TransactionStage } from '../../types/transaction';
import { getStageProgress, getStageLabel, getStageColor } from '../../types/transaction';

interface ConfirmationProgressProps {
  stage: TransactionStage;
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  showDetails?: boolean;
}

const ConfirmationProgress: React.FC<ConfirmationProgressProps> = ({
  stage,
  confirmations,
  requiredConfirmations,
  blockNumber,
  showDetails = true,
}) => {
  const networkTheme = useNetworkTheme();
  const progress = getStageProgress(stage);
  const confirmationProgress = Math.min((confirmations / requiredConfirmations) * 100, 100);
  const stageColor = getStageColor(stage);

  return (
    <div className="space-y-3">
      {/* Stage Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">Transaction Status</span>
          <span
            className="font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${stageColor}20`,
              color: stageColor,
            }}
          >
            {getStageLabel(stage)}
          </span>
        </div>

        {/* Overall Progress */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: networkTheme.gradient,
              boxShadow: `0 0 10px ${networkTheme.glowColor}`,
            }}
          >
            {progress > 0 && progress < 100 && (
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  backgroundSize: '200% 100%',
                }}
              />
            )}
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex items-center justify-between text-xs">
          {(['initiated', 'pending', 'confirming', 'confirmed', 'synced'] as TransactionStage[]).map((s, index) => {
            const isActive = getStageProgress(s) <= progress;
            const isCurrent = s === stage;

            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent ? 'scale-125 shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? stageColor : '#e5e7eb',
                    color: isActive ? 'white' : '#9ca3af',
                    boxShadow: isCurrent ? `0 4px 12px ${stageColor}60` : 'none',
                  }}
                >
                  {isCurrent && stage !== 'synced' && stage !== 'failed' ? (
                    <div
                      className="w-2 h-2 rounded-full bg-white animate-pulse"
                      style={{ animationDuration: '1s' }}
                    />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {s.charAt(0).toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Details */}
      {showDetails && stage === 'confirming' && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-900">Block Confirmations</span>
            <span className="text-sm font-bold text-purple-700">
              {confirmations}/{requiredConfirmations}
            </span>
          </div>

          {/* Confirmation Progress Bar */}
          <div className="relative h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
              style={{ width: `${confirmationProgress}%` }}
            >
              {confirmationProgress > 20 && (
                <span className="text-white text-xs font-bold">
                  {Math.round(confirmationProgress)}%
                </span>
              )}
            </div>
          </div>

          {/* Block Counter */}
          {blockNumber && (
            <div className="flex items-center gap-2 text-xs text-purple-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-semibold">Block #{blockNumber.toLocaleString()}</span>
            </div>
          )}

          {/* Animated Dots */}
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <span className="font-medium">Waiting for confirmations</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Synced Success */}
      {showDetails && stage === 'synced' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-3 animate-scale-in">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-green-900">Transaction Complete!</p>
            <p className="text-xs text-green-700">Synced with blockchain</p>
          </div>
        </div>
      )}

      {/* Failed State */}
      {showDetails && stage === 'failed' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-3 animate-scale-in">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">Transaction Failed</p>
            <p className="text-xs text-red-700">Please try again</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationProgress;
