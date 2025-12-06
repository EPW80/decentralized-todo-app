import React, { useMemo } from 'react';
import { useHistoricalGasPrice } from '../../hooks/useGasPrice';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';
import { getGasPriceLevel } from '../../types/transaction';

interface GasTrendChartProps {
  hours?: number;
  height?: number;
}

const GasTrendChart: React.FC<GasTrendChartProps> = ({ hours = 24, height = 200 }) => {
  const { history, loading } = useHistoricalGasPrice(hours);
  const networkTheme = useNetworkTheme();

  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    const prices = history.map(h => h.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create SVG path points
    const width = 100; // percentage
    const step = width / (history.length - 1);

    const points = history.map((h, i) => {
      const x = i * step;
      const normalizedPrice = ((h.price - minPrice) / priceRange);
      const y = height - (normalizedPrice * (height - 40)); // Leave margin for labels
      return { x, y, price: h.price, timestamp: h.timestamp };
    });

    // Create smooth curve path using quadratic bezier curves
    const path = points.reduce((acc, point, i) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const prevPoint = points[i - 1];
      const cpX = (prevPoint.x + point.x) / 2;
      return `${acc} Q ${cpX} ${prevPoint.y}, ${cpX} ${(prevPoint.y + point.y) / 2} Q ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    // Create area path
    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

    const currentPrice = history[history.length - 1]?.price || 0;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      path,
      areaPath,
      points,
      maxPrice,
      minPrice,
      currentPrice,
      avgPrice,
    };
  }, [history, height]);

  if (loading) {
    return (
      <div
        className="glass-layer-2 rounded-2xl p-6 animate-pulse"
        style={{ height: height + 80 }}
      >
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="glass-layer-2 rounded-2xl p-6 text-center text-gray-500">
        No gas price data available
      </div>
    );
  }

  const currentLevel = getGasPriceLevel(chartData.currentPrice);

  return (
    <div className="glass-layer-2 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gas Price Trends</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last {hours} hours</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: currentLevel.color }}>
              {chartData.currentPrice.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Gwei</span>
          </div>
          <div
            className="text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1"
            style={{
              backgroundColor: `${currentLevel.color}20`,
              color: currentLevel.color,
            }}
          >
            <span>{currentLevel.icon}</span>
            {currentLevel.label}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <line
              key={i}
              x1="0"
              y1={fraction * height}
              x2="100"
              y2={fraction * height}
              stroke="currentColor"
              strokeWidth="0.2"
              className="text-gray-300 dark:text-gray-700"
              strokeDasharray="2,2"
            />
          ))}

          {/* Area gradient */}
          <defs>
            <linearGradient id="gasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={networkTheme.primaryColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={networkTheme.primaryColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area */}
          <path
            d={chartData.areaPath}
            fill="url(#gasGradient)"
          />

          {/* Line */}
          <path
            d={chartData.path}
            fill="none"
            stroke={networkTheme.primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-glow"
          />

          {/* Data points */}
          {chartData.points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={networkTheme.primaryColor}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <title>
                {point.price.toFixed(2)} Gwei at{' '}
                {new Date(point.timestamp).toLocaleTimeString()}
              </title>
            </circle>
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 -ml-12">
          <span>{chartData.maxPrice.toFixed(0)}</span>
          <span>{chartData.avgPrice.toFixed(0)}</span>
          <span>{chartData.minPrice.toFixed(0)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white dark:bg-gray-800 bg-opacity-50 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {chartData.avgPrice.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-white dark:bg-gray-800 bg-opacity-50 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Low</p>
          <p className="text-lg font-bold text-green-600">
            {chartData.minPrice.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-white dark:bg-gray-800 bg-opacity-50 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">High</p>
          <p className="text-lg font-bold text-red-600">
            {chartData.maxPrice.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GasTrendChart;
