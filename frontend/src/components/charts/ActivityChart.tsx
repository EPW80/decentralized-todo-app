import React, { useMemo } from 'react';
import { useNetworkTheme } from '../../hooks/useNetworkTheme';

interface ActivityDataPoint {
  date: string;
  count: number;
  type: 'created' | 'completed' | 'deleted';
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  days?: number;
  height?: number;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, days = 7, height = 180 }) => {
  const networkTheme = useNetworkTheme();

  const chartData = useMemo(() => {
    if (data.length === 0) {
      // Generate sample data for empty state
      const now = new Date();
      const sampleData: ActivityDataPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        sampleData.push({ date: dateStr, count: 0, type: 'created' });
      }
      return { groupedData: sampleData, maxCount: 10 };
    }

    // Group by date
    const grouped = new Map<string, { created: number; completed: number; deleted: number }>();

    data.forEach(item => {
      const existing = grouped.get(item.date) || { created: 0, completed: 0, deleted: 0 };
      existing[item.type] += item.count;
      grouped.set(item.date, existing);
    });

    // Convert to array and calculate max
    const groupedData = Array.from(grouped.entries()).map(([date, counts]) => ({
      date,
      ...counts,
      total: counts.created + counts.completed + counts.deleted,
    }));

    const maxCount = Math.max(...groupedData.map(d => d.total), 1);

    return { groupedData, maxCount };
  }, [data, days]);

  const barWidth = 100 / (chartData.groupedData.length || 1);

  return (
    <div className="glass-layer-2 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activity Overview</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last {days} days</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Created</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Deleted</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 100 ${height}`} className="w-full h-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <React.Fragment key={i}>
              <line
                x1="0"
                y1={height - fraction * (height - 20)}
                x2="100"
                y2={height - fraction * (height - 20)}
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-gray-300 dark:text-gray-700"
                strokeDasharray="1,1"
              />
              <text
                x="-2"
                y={height - fraction * (height - 20)}
                className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: '3px' }}
                textAnchor="end"
              >
                {Math.round(fraction * chartData.maxCount)}
              </text>
            </React.Fragment>
          ))}

          {/* Bars */}
          {chartData.groupedData.map((day, i) => {
            const x = i * barWidth + barWidth * 0.1;
            const barActualWidth = barWidth * 0.8;

            const total = 'total' in day ? day.total : 0;
            const created = 'created' in day ? day.created : 0;
            const completed = 'completed' in day ? day.completed : 0;
            const deleted = 'deleted' in day ? day.deleted : 0;

            const barHeight = (total / chartData.maxCount) * (height - 25);
            const y = height - barHeight - 5;

            // Calculate stack heights
            const createdHeight = (created / total) * barHeight || 0;
            const completedHeight = (completed / total) * barHeight || 0;
            const deletedHeight = (deleted / total) * barHeight || 0;

            return (
              <g key={i} className="group">
                {/* Background bar on hover */}
                <rect
                  x={x}
                  y={y}
                  width={barActualWidth}
                  height={barHeight || 2}
                  fill="currentColor"
                  className="text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  rx="1"
                />

                {/* Stacked bars */}
                {created > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barActualWidth}
                    height={createdHeight}
                    fill="#3B82F6"
                    className="transition-all duration-300 hover:brightness-110"
                    rx="1"
                  >
                    <title>{`Created: ${created}`}</title>
                  </rect>
                )}

                {completed > 0 && (
                  <rect
                    x={x}
                    y={y + createdHeight}
                    width={barActualWidth}
                    height={completedHeight}
                    fill="#10B981"
                    className="transition-all duration-300 hover:brightness-110"
                    rx="1"
                  >
                    <title>{`Completed: ${completed}`}</title>
                  </rect>
                )}

                {deleted > 0 && (
                  <rect
                    x={x}
                    y={y + createdHeight + completedHeight}
                    width={barActualWidth}
                    height={deletedHeight}
                    fill="#EF4444"
                    className="transition-all duration-300 hover:brightness-110"
                    rx="1"
                  >
                    <title>{`Deleted: ${deleted}`}</title>
                  </rect>
                )}

                {/* Date label */}
                <text
                  x={x + barActualWidth / 2}
                  y={height}
                  className="text-gray-600 dark:text-gray-400"
                  style={{ fontSize: '3px' }}
                  textAnchor="middle"
                >
                  {new Date(day.date).getDate()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Actions</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {chartData.groupedData.reduce((sum, d) => sum + ('total' in d ? d.total : 0), 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Most Active</p>
          <p className="text-xl font-bold" style={{ color: networkTheme.primaryColor }}>
            {Math.max(...chartData.groupedData.map(d => 'total' in d ? d.total : 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg/Day</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {(
              chartData.groupedData.reduce((sum, d) => sum + ('total' in d ? d.total : 0), 0) /
              (chartData.groupedData.length || 1)
            ).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;
