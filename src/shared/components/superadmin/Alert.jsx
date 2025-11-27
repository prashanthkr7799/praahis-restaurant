import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Alert/Notification Card Component for SuperAdmin Dashboard
 * Updated with emerald accent for success states
 */
const Alert = ({ 
  children, 
  variant = 'info',
  icon: CustomIcon,
  onAction,
  actionLabel,
  className = '' 
}) => {
  const variants = {
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-800 dark:text-emerald-300',
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-800 dark:text-amber-300',
    },
    danger: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-300',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-300',
    },
  };

  const config = variants[variant] || variants.info;
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={`
        flex items-start gap-3 p-3 sm:p-4 rounded-xl border
        ${config.container}
        ${onAction ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''}
        ${className}
      `}
      onClick={onAction}
      role={onAction ? 'button' : undefined}
      tabIndex={onAction ? 0 : undefined}
      onKeyDown={onAction ? (e) => e.key === 'Enter' && onAction() : undefined}
    >
      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-medium ${config.text}`}>
          {children}
        </p>
      </div>
      {actionLabel && (
        <button
          className={`text-xs sm:text-sm font-medium ${config.iconColor} hover:underline shrink-0`}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Alert;
