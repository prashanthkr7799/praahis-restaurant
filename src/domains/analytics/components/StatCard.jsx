/**
 * StatCard Component
 * Displays a single statistic with icon
 */

import React from 'react';

// Dark-theme tokenized StatCard
const StatCard = ({ title, value, icon, tint = 'info', change, brightTitle = false }) => {
  const IconComponent = icon;
  const tintMap = {
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
    brand: 'bg-primary-tint text-primary',
  };
  const tintClasses = tintMap[tint] || tintMap.info;

  const changeColor = change === undefined ? '' : change >= 0 ? 'text-success' : 'text-destructive';

  return (
    <div className="card-minimal p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${brightTitle ? 'text-foreground' : 'text-muted'} mb-1`}>{title}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${changeColor}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${tintClasses}`}>
          <IconComponent className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
