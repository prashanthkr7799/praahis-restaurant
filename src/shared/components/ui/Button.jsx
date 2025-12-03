import React from 'react';
import PropTypes from 'prop-types';

/**
 * Professional Button Component for SuperAdmin Dashboard
 * Supports multiple variants, sizes, and states
 * Updated with emerald accent color (#10b981)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent dark:bg-emerald-500 dark:hover:bg-emerald-600',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border-transparent dark:bg-red-500 dark:hover:bg-red-600',
    success:
      'bg-green-600 hover:bg-green-700 text-white border-transparent dark:bg-green-500 dark:hover:bg-green-600',
    warning:
      'bg-amber-600 hover:bg-amber-700 text-white border-transparent dark:bg-amber-500 dark:hover:bg-amber-600',
    outline:
      'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 dark:hover:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent dark:hover:bg-gray-800 dark:text-gray-300',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
    icon: 'p-2',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    icon: 'h-5 w-5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className={`animate-spin ${iconSizes[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {Icon && !loading && iconPosition === 'left' && <Icon className={iconSizes[size]} />}
      {children}
      {Icon && !loading && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'danger',
    'success',
    'warning',
    'outline',
    'ghost',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon']),
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

Button.defaultProps = {
  variant: 'primary',
  size: 'md',
  iconPosition: 'left',
  loading: false,
  disabled: false,
  fullWidth: false,
  className: '',
  type: 'button',
};

export default Button;
