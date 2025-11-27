import React from 'react';

/**
 * Professional Badge Component for SuperAdmin Dashboard
 * Supports multiple variants with proper light/dark mode theming
 * Updated with emerald accent color (#10b981)
 */
const Badge = ({ 
  children, 
  variant = 'default', 
  icon: Icon,
  size = 'md',
  className = '' 
}) => {
  const variants = {
    // Status variants - emerald for success/active states
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    
    // Specific status badges - emerald for active states
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    overdue: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  };

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1',
    lg: 'text-sm sm:text-base px-2.5 sm:px-3 py-1 sm:py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 sm:gap-1.5 font-medium rounded-md border
        ${variants[variant] || variants.default}
        ${sizes[size]}
        ${className}
      `}
    >
      {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
      {children}
    </span>
  );
};

export default Badge;
