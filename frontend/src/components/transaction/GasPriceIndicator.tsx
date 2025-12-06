import React from 'react';
import { getGasPriceLevel } from '../../types/transaction';

interface GasPriceIndicatorProps {
  gasPriceGwei: number;
  variant?: 'default' | 'compact' | 'detailed';
  showLabel?: boolean;
}

const GasPriceIndicator: React.FC<GasPriceIndicatorProps> = ({
  gasPriceGwei,
  variant = 'default',
  showLabel = true,
}) => {
  const gasLevel = getGasPriceLevel(gasPriceGwei);

  // Compact variant - just an icon
  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
        style={{
          backgroundColor: `${gasLevel.color}20`,
          color: gasLevel.color,
        }}
        title={`Gas Price: ${gasPriceGwei.toFixed(2)} Gwei (${gasLevel.label})`}
      >
        <span>{gasLevel.icon}</span>
        {showLabel && <span>{gasPriceGwei.toFixed(0)} Gwei</span>}
      </div>
    );
  }

  // Detailed variant - full card
  if (variant === 'detailed') {
    return (
      <div
        className="rounded-xl p-4 border-2"
        style={{
          backgroundColor: `${gasLevel.color}10`,
          borderColor: `${gasLevel.color}40`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-xl"
              style={{
                background: `linear-gradient(135deg, ${gasLevel.color}, ${gasLevel.color}dd)`,
              }}
            >
              ⛽
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Gas Price</p>
              <p className="text-xs text-gray-600">Network Fee</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: gasLevel.color }}>
              {gasPriceGwei.toFixed(1)}
            </p>
            <p className="text-xs text-gray-600">Gwei</p>
          </div>
        </div>

        {/* Gas Level Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">Fee Level</span>
            <span
              className="font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: `${gasLevel.color}30`,
                color: gasLevel.color,
              }}
            >
              <span>{gasLevel.icon}</span>
              {gasLevel.label}
            </span>
          </div>

          {/* Visual Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((gasPriceGwei / 150) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${gasLevel.color}, ${gasLevel.color}cc)`,
              }}
            />
          </div>

          {/* Reference Points */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              🟢 <span>&lt;20</span>
            </span>
            <span className="flex items-center gap-1">
              🟡 <span>20-50</span>
            </span>
            <span className="flex items-center gap-1">
              🔴 <span>50-100</span>
            </span>
            <span className="flex items-center gap-1">
              🔥 <span>&gt;100</span>
            </span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded-lg">
          <p className="text-xs text-gray-700">
            {gasLevel.level === 'low' && '✅ Great time to transact! Low fees.'}
            {gasLevel.level === 'medium' && '⚡ Moderate fees. Consider if urgent.'}
            {gasLevel.level === 'high' && '⚠️ High fees. Consider waiting if not urgent.'}
            {gasLevel.level === 'extreme' && '🚨 Very high fees! Wait for better rates.'}
          </p>
        </div>
      </div>
    );
  }

  // Default variant - badge style
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 shadow-sm"
      style={{
        backgroundColor: `${gasLevel.color}15`,
        borderColor: `${gasLevel.color}40`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${gasLevel.color}, ${gasLevel.color}dd)`,
        }}
      >
        <span className="text-white text-sm">⛽</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-600 font-medium">Gas Price</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: gasLevel.color }}>
            {gasPriceGwei.toFixed(1)} Gwei
          </span>
          <span className="text-xs">{gasLevel.icon}</span>
        </div>
      </div>
    </div>
  );
};

export default GasPriceIndicator;
