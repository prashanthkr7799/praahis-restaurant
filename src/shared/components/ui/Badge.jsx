/**
 * Badge Component
 * Enhanced badge with semantic color variants matching design system
 */

import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-gray-100 dark:bg-muted text-gray-900 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
    info: 'bg-info text-info-foreground hover:bg-info/90',
    upgrade: 'bg-upgrade text-upgrade-foreground hover:bg-upgrade/90',
    outline: 'border border-gray-300 dark:border-input bg-transparent text-gray-900 dark:text-foreground hover:bg-gray-100 dark:hover:bg-muted/50',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
