import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const EnhancedStatCard = ({
  title,
  value,
  subtext,
  icon,
  trend,
  color = 'text-white',
  chartData = [],
  onClick,
  loading = false,
  error = false,
}) => {
  const Icon = icon;

  // Skeleton loader
  if (loading) {
    return (
      <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/10 animate-pulse">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="h-3 bg-white/10 rounded w-20"></div>
          <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
        </div>
        <div className="h-8 bg-white/10 rounded w-32 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-24"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-panel p-4 md:p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="stat-card"
      className={`glass-panel p-4 md:p-6 rounded-2xl group transition-all duration-300 relative overflow-hidden border border-white/10 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`${title}: ${value}`}
    >
      {/* Background Icon */}
      <div
        className={`absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
      >
        <Icon className={`h-24 w-24 md:h-32 md:w-32 ${color}`} />
      </div>

      <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
        <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">
          {title}
        </p>
        <div className={`p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/5 ${color}`}>
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between relative z-10 gap-2 md:gap-0">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white font-mono-nums tracking-tight drop-shadow-lg">
            {value}
          </h3>
          {subtext && (
            <p className="text-[10px] md:text-xs text-zinc-400 mt-1 font-medium">{subtext}</p>
          )}
        </div>
        {trend && (
          <div
            className={`self-start md:self-auto flex items-center gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg backdrop-blur-md border border-white/5 ${trend.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="font-mono-nums">{trend.trend}%</span>
          </div>
        )}
      </div>

      {/* Sparkline Chart */}
      {chartData && chartData.length > 0 && (
        <div className="mt-4 h-12 min-h-[48px] relative z-10">
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      color.includes('emerald')
                        ? '#10b981'
                        : color.includes('primary')
                          ? '#8B5CF6'
                          : color.includes('amber')
                            ? '#F59E0B'
                            : '#8B5CF6'
                    }
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      color.includes('emerald')
                        ? '#10b981'
                        : color.includes('primary')
                          ? '#8B5CF6'
                          : color.includes('amber')
                            ? '#F59E0B'
                            : '#8B5CF6'
                    }
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={
                  color.includes('emerald')
                    ? '#10b981'
                    : color.includes('primary')
                      ? '#8B5CF6'
                      : color.includes('amber')
                        ? '#F59E0B'
                        : '#8B5CF6'
                }
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EnhancedStatCard;
