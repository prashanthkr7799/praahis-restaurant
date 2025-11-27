import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/billingUtils';

/**
 * OVERVIEW CARDS COMPONENT
 * Displays key revenue metrics in card format
 * - Today's Revenue
 * - This Week's Revenue
 * - This Month's Revenue
 * - Pending Payments
 */

const OverviewCards = ({ revenueStats, loading, onCardClick }) => {
  const cards = [
    {
      id: 'today',
      title: "Today's Revenue",
      value: revenueStats?.todayRevenue || 0,
      icon: DollarSign,
      bgColor: 'from-emerald-500/10 to-emerald-600/10',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20',
      trend: null, // Could add comparison to yesterday
    },
    {
      id: 'week',
      title: "This Week's Revenue",
      value: revenueStats?.weekRevenue || 0,
      icon: Calendar,
      bgColor: 'from-purple-500/10 to-purple-600/10',
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/20',
      trend: null,
    },
    {
      id: 'month',
      title: "This Month's Revenue",
      value: revenueStats?.monthRevenue || 0,
      icon: TrendingUp,
      bgColor: 'from-blue-500/10 to-blue-600/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
      trend: null,
    },
    {
      id: 'pending',
      title: 'Pending Payments',
      value: revenueStats?.pendingPayments || 0,
      icon: AlertCircle,
      bgColor: 'from-amber-500/10 to-amber-600/10',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/20',
      isCount: true, // This is a count, not a revenue
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.id)}
            className={`
              relative overflow-hidden
              bg-gradient-to-br ${card.bgColor}
              backdrop-blur-sm
              border ${card.borderColor}
              rounded-xl p-5
              transition-all duration-300
              hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10
              cursor-pointer
              group
            `}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
              <Icon className="w-full h-full" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div
                className={`
                  w-12 h-12 rounded-lg
                  bg-gray-900/50
                  flex items-center justify-center
                  mb-3
                  group-hover:scale-110 transition-transform
                `}
              >
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                {card.title}
              </h3>

              {/* Value */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {card.isCount
                    ? card.value
                    : formatINR(card.value)}
                </span>
                
                {/* Trend indicator (optional) */}
                {card.trend && (
                  <span
                    className={`
                      flex items-center gap-1 text-xs font-medium
                      ${card.trend > 0 ? 'text-emerald-400' : 'text-red-400'}
                    `}
                  >
                    {card.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(card.trend)}%
                  </span>
                )}
              </div>

              {/* Subtext */}
              {card.isCount && card.value > 0 && (
                <p className="text-xs text-amber-400/70 mt-2">
                  Action required
                </p>
              )}
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
