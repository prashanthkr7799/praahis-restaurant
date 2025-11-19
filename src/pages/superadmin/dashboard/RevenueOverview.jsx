import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * RevenueOverview Component
 * 
 * Displays a line chart showing revenue trends over time
 * Features:
 * - Monthly revenue breakdown
 * - Comparison with previous period
 * - Responsive design for mobile/tablet/desktop
 * - Light/dark mode support
 * 
 * @param {Array} data - Revenue data array with shape: [{ month: string, revenue: number, previousYear: number }]
 * @param {boolean} loading - Loading state
 */
const RevenueOverview = ({ data = [], loading = false }) => {
  // Calculate total revenue
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const previousRevenue = data.reduce((sum, item) => sum + (item.previousYear || 0), 0);
  const growthRate = previousRevenue > 0 
    ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
    : 0;

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-card p-3 rounded-lg shadow-lg border border-gray-700 dark:border-border">
          <p className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2">
            {payload[0].payload.month}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-400 dark:text-muted-foreground">
              <span style={{ color: entry.color }}>●</span>{' '}
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 dark:bg-card rounded-lg p-6 border border-gray-700 dark:border-border shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-muted rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 dark:bg-card rounded-lg p-6 border border-gray-700 dark:border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-100 dark:text-foreground">
            Revenue Overview
          </h3>
          <p className="text-sm text-gray-400 dark:text-muted-foreground mt-1">
            Monthly revenue trends
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <TrendingUp className={`h-4 w-4 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-sm font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </span>
            <span className="text-xs text-gray-400 dark:text-muted-foreground ml-1">
              vs last period
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="month" 
            className="text-gray-400 dark:text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-gray-400 dark:text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            name="Current Year"
            stroke="#f97316" 
            strokeWidth={3}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="previousYear" 
            name="Previous Year"
            stroke="#94a3b8" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#94a3b8', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700 dark:border-border">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-muted-foreground mb-1">Avg Monthly</p>
          <p className="text-sm font-semibold text-gray-100 dark:text-foreground">
            {formatCurrency(data.length > 0 ? totalRevenue / data.length : 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-muted-foreground mb-1">Peak Month</p>
          <p className="text-sm font-semibold text-gray-100 dark:text-foreground">
            {data.length > 0 
              ? data.reduce((max, item) => item.revenue > max.revenue ? item : max, data[0]).month 
              : 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-muted-foreground mb-1">Growth</p>
          <p className={`text-sm font-semibold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueOverview;
