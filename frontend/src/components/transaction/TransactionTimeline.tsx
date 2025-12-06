import React from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import type { TransactionStage } from '../../types/transaction';
import { getStageLabel, getStageColor, getStageIcon } from '../../types/transaction';

interface TimelineEvent {
  stage: TransactionStage;
  timestamp: number;
  message: string;
  txHash?: string;
  blockNumber?: number;
}

interface TransactionTimelineProps {
  events: TimelineEvent[];
  currentStage: TransactionStage;
  compact?: boolean;
}

const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  events,
  currentStage,
  compact = false,
}) => {
  const networkTheme = useNetworkTheme();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeDiff = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 10) return `${seconds}s ago`;
    return 'just now';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {events.map((event, index) => {
          const isCurrent = event.stage === currentStage;
          const stageColor = getStageColor(event.stage);

          return (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                isCurrent ? 'bg-opacity-20' : 'bg-opacity-5'
              }`}
              style={{ backgroundColor: `${stageColor}20` }}
            >
              <span className="text-lg">{getStageIcon(event.stage)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{event.message}</p>
                <p className="text-xs text-gray-600">{getTimeDiff(event.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div
        className="absolute left-6 top-0 bottom-0 w-0.5"
        style={{ background: `${networkTheme.primaryColor}30` }}
      />

      <div className="space-y-6">
        {events.map((event, index) => {
          const isCurrent = event.stage === currentStage;
          const isLast = index === events.length - 1;
          const stageColor = getStageColor(event.stage);

          return (
            <div key={index} className="relative flex gap-4 items-start">
              {/* Timeline Node */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                  isCurrent ? 'scale-110 shadow-lg' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${stageColor}, ${stageColor}dd)`,
                  boxShadow: isCurrent ? `0 4px 16px ${stageColor}60` : 'none',
                }}
              >
                <span className="text-2xl">
                  {isCurrent && !isLast ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  ) : (
                    getStageIcon(event.stage)
                  )}
                </span>

                {isCurrent && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: stageColor, opacity: 0.3 }}
                  />
                )}
              </div>

              {/* Event Card */}
              <div
                className={`flex-1 rounded-xl p-4 transition-all duration-300 ${
                  isCurrent ? 'shadow-md' : 'shadow-sm'
                }`}
                style={{
                  backgroundColor: `${stageColor}10`,
                  border: `2px solid ${stageColor}${isCurrent ? '60' : '30'}`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4
                      className="text-sm font-bold mb-1"
                      style={{ color: stageColor }}
                    >
                      {getStageLabel(event.stage)}
                    </h4>
                    <p className="text-sm text-gray-700">{event.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-semibold text-gray-900">
                      {formatTime(event.timestamp)}
                    </p>
                    <p className="text-xs text-gray-600">{getTimeDiff(event.timestamp)}</p>
                  </div>
                </div>

                {/* Additional Details */}
                {(event.txHash || event.blockNumber) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                    {event.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:underline"
                        style={{
                          backgroundColor: `${stageColor}20`,
                          color: stageColor,
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="font-mono">
                          {event.txHash.substring(0, 6)}...{event.txHash.substring(event.txHash.length - 4)}
                        </span>
                      </a>
                    )}
                    {event.blockNumber && (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1"
                        style={{
                          backgroundColor: `${stageColor}20`,
                          color: stageColor,
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Block #{event.blockNumber.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionTimeline;
