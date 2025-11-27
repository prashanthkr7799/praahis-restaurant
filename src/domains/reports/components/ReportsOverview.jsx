/**
 * ⚠️ REPORTS OVERVIEW — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@domains/reports/utils/reportsUtils'
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Percent } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  calculateRevenue,
  calculateAverageOrderValue,
  formatCurrency
} from '@domains/reports/utils/reportsUtils';

/**
 * Reports Overview Component
 * Displays 4 key metric cards with sparklines and trends
 */
export default function ReportsOverview({ 
  orders = [], 
  previousOrders = [],
  onCardClick 
}) {
  // Calculate current metrics
  const totalRevenue = calculateRevenue(orders);
  const totalOrders = orders.length;
  const avgOrderValue = calculateAverageOrderValue(orders);
  const totalDiscounts = orders.reduce((sum, order) => sum + (parseFloat(order.discount) || 0), 0);

  // Calculate previous metrics for trends
  const prevRevenue = calculateRevenue(previousOrders);
  const prevOrders = previousOrders.length;
  const prevAvgOrder = calculateAverageOrderValue(previousOrders);
  const prevDiscounts = previousOrders.reduce((sum, order) => sum + (parseFloat(order.discount) || 0), 0);

  // Calculate trends
  const revenueTrend = calculateTrend(totalRevenue, prevRevenue);
  const ordersTrend = calculateTrend(totalOrders, prevOrders);
  const avgOrderTrend = calculateTrend(avgOrderValue, prevAvgOrder);
  const discountsTrend = calculateTrend(totalDiscounts, prevDiscounts);

  // Generate sparkline data for revenue (last 7 days)
  const revenueSparklineData = generateSparklineData(orders, 7);

  const metrics = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      trend: revenueTrend,
      icon: DollarSign,
      color: 'emerald',
      sparklineData: revenueSparklineData
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: totalOrders,
      trend: ordersTrend,
      icon: ShoppingCart,
      color: 'blue',
      sparklineData: generateOrdersSparklineData(orders, 7)
    },
    {
      id: 'avgOrder',
      title: 'Avg Order Value',
      value: formatCurrency(avgOrderValue),
      trend: avgOrderTrend,
      icon: TrendingUp,
      color: 'purple',
      sparklineData: revenueSparklineData
    },
    {
      id: 'discounts',
      title: 'Total Discounts',
      value: formatCurrency(totalDiscounts),
      trend: discountsTrend,
      icon: Percent,
      color: 'amber',
      sparklineData: generateDiscountsSparklineData(orders, 7)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          metric={metric}
          onClick={onCardClick ? () => onCardClick(metric.id) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Individual Metric Card Component
 */
function MetricCard({ metric, onClick }) {
  const { title, value, trend, icon: Icon, color, sparklineData } = metric;

  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };

  const sparklineColors = {
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    amber: '#f59e0b'
  };

  const isPositiveTrend = trend >= 0;
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <div
      onClick={onClick}
      className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl transition-all ${
        onClick ? 'cursor-pointer hover:bg-white/15 hover:scale-105' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {/* Trend Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            isPositiveTrend
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white/70 text-sm font-medium mb-2">{title}</h3>

      {/* Value */}
      <div className="text-3xl font-bold text-white mb-4">
        {value}
      </div>

      {/* Sparkline Chart */}
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColors[color]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={sparklineColors[color]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={sparklineColors[color]}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Generate sparkline data for revenue (last N days)
 */
function generateSparklineData(orders, days = 7) {
  if (!orders || orders.length === 0) {
    return Array.from({ length: days }, () => ({ value: 0 }));
  }

  const now = new Date();
  const dataMap = {};

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dataMap[dateStr] = 0;
  }

  // Aggregate revenue by date
  orders.forEach(order => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (dateStr in dataMap) {
      dataMap[dateStr] += parseFloat(order.total_amount) || 0;
    }
  });

  // Convert to array
  return Object.values(dataMap).map(value => ({ value }));
}

/**
 * Generate sparkline data for order counts (last N days)
 */
function generateOrdersSparklineData(orders, days = 7) {
  if (!orders || orders.length === 0) {
    return Array.from({ length: days }, () => ({ value: 0 }));
  }

  const now = new Date();
  const dataMap = {};

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dataMap[dateStr] = 0;
  }

  // Count orders by date
  orders.forEach(order => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (dateStr in dataMap) {
      dataMap[dateStr]++;
    }
  });

  // Convert to array
  return Object.values(dataMap).map(value => ({ value }));
}

/**
 * Generate sparkline data for discounts (last N days)
 */
function generateDiscountsSparklineData(orders, days = 7) {
  if (!orders || orders.length === 0) {
    return Array.from({ length: days }, () => ({ value: 0 }));
  }

  const now = new Date();
  const dataMap = {};

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dataMap[dateStr] = 0;
  }

  // Aggregate discounts by date
  orders.forEach(order => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (dateStr in dataMap) {
      dataMap[dateStr] += parseFloat(order.discount) || 0;
    }
  });

  // Convert to array
  return Object.values(dataMap).map(value => ({ value }));
}

/**
 * Calculate trend percentage
 */
function calculateTrend(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
