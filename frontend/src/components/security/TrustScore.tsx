import React from 'react';

interface TrustScoreProps {
  address?: string;
  transactionCount?: number;
  confirmations?: number;
  requiredConfirmations?: number;
  variant?: 'compact' | 'default' | 'detailed';
}

interface TrustMetrics {
  score: number;
  level: 'unknown' | 'low' | 'medium' | 'high' | 'verified';
  color: string;
  label: string;
  icon: string;
  description: string;
}

const calculateTrustScore = (
  transactionCount: number = 0,
  confirmations: number = 0,
  requiredConfirmations: number = 1
): TrustMetrics => {
  let score = 0;

  // Transaction history (max 40 points)
  if (transactionCount > 100) score += 40;
  else if (transactionCount > 50) score += 30;
  else if (transactionCount > 10) score += 20;
  else if (transactionCount > 0) score += 10;

  // Confirmation status (max 40 points)
  const confirmationRatio = Math.min(confirmations / requiredConfirmations, 1);
  score += confirmationRatio * 40;

  // Address validation (max 20 points)
  score += 20; // Assumes valid address

  // Determine level
  if (score >= 80) {
    return {
      score,
      level: 'verified',
      color: '#10B981',
      label: 'Verified',
      icon: '✓',
      description: 'High trust score with strong transaction history',
    };
  } else if (score >= 60) {
    return {
      score,
      level: 'high',
      color: '#3B82F6',
      label: 'High Trust',
      icon: '★',
      description: 'Good transaction history and confirmations',
    };
  } else if (score >= 40) {
    return {
      score,
      level: 'medium',
      color: '#F59E0B',
      label: 'Medium Trust',
      icon: '◆',
      description: 'Moderate transaction history',
    };
  } else if (score >= 20) {
    return {
      score,
      level: 'low',
      color: '#EF4444',
      label: 'Low Trust',
      icon: '!',
      description: 'Limited transaction history',
    };
  } else {
    return {
      score,
      level: 'unknown',
      color: '#6B7280',
      label: 'Unknown',
      icon: '?',
      description: 'No transaction history available',
    };
  }
};

const TrustScore: React.FC<TrustScoreProps> = ({
  address,
  transactionCount = 0,
  confirmations = 0,
  requiredConfirmations = 1,
  variant = 'default',
}) => {
  const trust = calculateTrustScore(transactionCount, confirmations, requiredConfirmations);

  // Compact variant - just a badge
  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
        style={{
          backgroundColor: `${trust.color}20`,
          color: trust.color,
        }}
        title={trust.description}
      >
        <span>{trust.icon}</span>
        <span>{trust.label}</span>
      </div>
    );
  }

  // Detailed variant - full card
  if (variant === 'detailed') {
    return (
      <div className="glass-layer-2 rounded-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trust Score</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Security Assessment</p>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${trust.color}, ${trust.color}dd)`,
              color: 'white',
            }}
          >
            {trust.icon}
          </div>
        </div>

        {/* Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={trust.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(trust.score / 100) * 352} 352`}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 6px ${trust.color}60)`,
                }}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(trust.score)}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">out of 100</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="text-center py-2 px-4 rounded-xl font-bold"
          style={{
            backgroundColor: `${trust.color}20`,
            color: trust.color,
          }}
        >
          {trust.label}
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Transaction History</span>
            <span className="font-bold text-gray-900 dark:text-white">{transactionCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Confirmations</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {confirmations}/{requiredConfirmations}
            </span>
          </div>
          {address && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Address</span>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-3 bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg">
          <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
            {trust.description}
          </p>
        </div>
      </div>
    );
  }

  // Default variant - horizontal card
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border-2"
      style={{
        backgroundColor: `${trust.color}10`,
        borderColor: `${trust.color}30`,
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${trust.color}, ${trust.color}dd)`,
          color: 'white',
        }}
      >
        {trust.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{trust.label}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Score: {Math.round(trust.score)}/100
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{trust.description}</p>
      </div>

      {/* Score Circle (small) */}
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={trust.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(trust.score / 100) * 176} 176`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(trust.score)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustScore;
