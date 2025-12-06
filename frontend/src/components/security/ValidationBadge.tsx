import React from 'react';

interface ValidationCheck {
  name: string;
  passed: boolean;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

interface ValidationBadgeProps {
  checks?: ValidationCheck[];
  variant?: 'compact' | 'default' | 'detailed';
}

const ValidationBadge: React.FC<ValidationBadgeProps> = ({ checks = [], variant = 'default' }) => {
  const defaultChecks: ValidationCheck[] = [
    {
      name: 'Contract Verified',
      passed: true,
      description: 'Smart contract source code is verified on blockchain explorer',
      severity: 'critical',
    },
    {
      name: 'No Reentrancy',
      passed: true,
      description: 'Contract follows checks-effects-interactions pattern',
      severity: 'critical',
    },
    {
      name: 'Access Control',
      passed: true,
      description: 'Proper role-based access control implemented',
      severity: 'warning',
    },
    {
      name: 'Gas Optimized',
      passed: true,
      description: 'Contract uses gas-efficient patterns',
      severity: 'info',
    },
  ];

  const validationChecks = checks.length > 0 ? checks : defaultChecks;
  const passedCount = validationChecks.filter(c => c.passed).length;
  const totalCount = validationChecks.length;
  const allPassed = passedCount === totalCount;
  const passRate = (passedCount / totalCount) * 100;

  const getStatusColor = () => {
    if (allPassed) return '#10B981'; // Green
    if (passRate >= 75) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getStatusLabel = () => {
    if (allPassed) return 'All Checks Passed';
    if (passRate >= 75) return 'Minor Issues';
    return 'Action Required';
  };

  const getStatusIcon = () => {
    if (allPassed) return '✓';
    if (passRate >= 75) return '⚠';
    return '✕';
  };

  const statusColor = getStatusColor();

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
        style={{
          backgroundColor: `${statusColor}20`,
          color: statusColor,
        }}
        title={`${passedCount}/${totalCount} validations passed`}
      >
        <span>{getStatusIcon()}</span>
        <span>{passedCount}/{totalCount}</span>
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical': return '#EF4444';
        case 'warning': return '#F59E0B';
        default: return '#3B82F6';
      }
    };

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case 'critical': return '🛡️';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
      }
    };

    return (
      <div className="glass-layer-2 rounded-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security Validation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Contract Safety Checks</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
              color: 'white',
            }}
          >
            {getStatusIcon()}
          </div>
        </div>

        {/* Overall Status */}
        <div
          className="p-4 rounded-xl border-2"
          style={{
            backgroundColor: `${statusColor}10`,
            borderColor: `${statusColor}40`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {getStatusLabel()}
            </span>
            <span className="text-sm font-bold" style={{ color: statusColor }}>
              {passedCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${passRate}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-2">
          {validationChecks.map((check, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border bg-white dark:bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all"
              style={{
                borderColor: check.passed ? '#10B98130' : getSeverityColor(check.severity) + '30',
              }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    backgroundColor: check.passed ? '#10B981' : getSeverityColor(check.severity),
                    color: 'white',
                  }}
                >
                  {check.passed ? '✓' : '✕'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {check.name}
                    </span>
                    {!check.passed && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white" style={{ backgroundColor: getSeverityColor(check.severity) }}>
                        {check.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{check.description}</p>
                </div>

                {/* Severity indicator */}
                <div className="flex-shrink-0 text-lg">
                  {getSeverityIcon(check.severity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        {!allPassed && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Some validation checks did not pass. Review the issues above before proceeding.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border-2"
      style={{
        backgroundColor: `${statusColor}10`,
        borderColor: `${statusColor}30`,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
          color: 'white',
        }}
      >
        {getStatusIcon()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">
          {getStatusLabel()}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {passedCount} of {totalCount} checks passed
        </span>
      </div>

      {/* Progress circle */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={statusColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(passRate / 100) * 126} 126`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {Math.round(passRate)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ValidationBadge;
