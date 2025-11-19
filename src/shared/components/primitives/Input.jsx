/**
 * Professional Input Component
 * Reusable input with dark mode styling and proper visibility
 */

import React from 'react';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const id = props.id || props.name;
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label 
          htmlFor={id}
          className={`block text-sm font-semibold text-foreground mb-2 ${labelClassName}`}
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={id}
        className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
        } ${className}`}
        {...props}
      />
      
      {error && (
        <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
          <span className="text-base">⚠</span> {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
