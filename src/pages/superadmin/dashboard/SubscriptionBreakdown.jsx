import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * SubscriptionBreakdown Component
 * 
 * Displays a pie chart showing subscription plan distribution
 * Features:
 * - Visual breakdown of Trial, Basic, Pro, Enterprise plans
 * - Color-coded segments with percentages
 * - Responsive design
 * - Light/dark mode support
 * 
 * @param {Array} data - Subscription data array with shape: [{ name: string, value: number, revenue: number }]
 * @param {boolean} loading - Loading state
 */
const SubscriptionBreakdown = ({ data = [], loading = false }) => {
  // Color scheme for subscription tiers
  const COLORS = {
    'Trial': '#94a3b8',      // Gray
    'Basic': '#3b82f6',      // Blue
    'Pro': '#f97316',        // Orange
    'Enterprise': '#10b981', // Green
  };

  // Calculate total subscriptions and revenue
  const totalSubs = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom label for pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label for slices < 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 dark:bg-card p-3 rounded-lg shadow-lg border border-gray-700 dark:border-border">
          <p className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2">
            {data.name}
          </p>
          <p className="text-sm text-gray-400 dark:text-muted-foreground">
            Subscriptions: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-muted-foreground">
            Revenue: <span className="font-semibold">{formatCurrency(data.revenue)}</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-muted-foreground">
            Share: <span className="font-semibold">
              {((data.value / totalSubs) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 dark:bg-card rounded-lg p-6 border border-gray-700 dark:border-border shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-muted rounded w-1/2 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 dark:bg-card rounded-lg p-6 border border-gray-700 dark:border-border shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-100 dark:text-foreground">
          Subscription Breakdown
        </h3>
        <p className="text-sm text-gray-400 dark:text-muted-foreground mt-1">
          Distribution by plan tier
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || '#94a3b8'} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value, entry) => (
              <span className="text-gray-100 dark:text-foreground">
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700 dark:border-border">
        <div>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mb-1">Total Active</p>
          <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
            {totalSubs}
          </p>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
            subscriptions
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mb-1">MRR</p>
          <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
            monthly recurring
          </p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="mt-6 space-y-2">
        {data.map((plan) => {
          const percentage = ((plan.value / totalSubs) * 100).toFixed(1);
          return (
            <div key={plan.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[plan.name] || '#94a3b8' }}
                />
                <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                  {plan.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 dark:text-muted-foreground">
                  {plan.value} ({percentage}%)
                </span>
                <span className="text-sm font-medium text-gray-100 dark:text-foreground min-w-[80px] text-right">
                  {formatCurrency(plan.revenue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionBreakdown;
