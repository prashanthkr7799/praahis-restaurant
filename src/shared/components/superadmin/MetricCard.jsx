import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Professional Metric Card Component for SuperAdmin Dashboard
 * Used for displaying key statistics with trends
 */
const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs last month',
  loading = false,
  onClick,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${isClickable ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums mb-2">
            {value}
          </p>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
