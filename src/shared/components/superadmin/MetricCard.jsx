import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Professional Metric Card Component for SuperAdmin Dashboard
 * Used for displaying key statistics with trends
 * Updated with emerald accent color (#10b981)
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={isClickable ? `View ${title}` : undefined}
      className={`
        bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums mb-1 sm:mb-2">
            {value}
          </p>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg shrink-0 ml-2">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
