import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastContext } from './useToast';

/**
 * Professional Toast Notification System for SuperAdmin Dashboard
 * Note: ToastContext is exported from useToast.js for Fast Refresh compatibility
 */

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      variant: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss (except errors)
    if (newToast.variant !== 'error' && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (message, options) => addToast({ message, variant: 'success', ...options }),
    error: (message, options) => addToast({ message, variant: 'error', duration: 0, ...options }),
    warning: (message, options) => addToast({ message, variant: 'warning', ...options }),
    info: (message, options) => addToast({ message, variant: 'info', ...options }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const variants = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      text: 'text-green-800 dark:text-green-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-800 dark:text-amber-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-300',
    },
  };

  const config = variants[toast.variant] || variants.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg
        min-w-[320px] max-w-md
        animate-fade-in
        ${config.bg}
      `}
    >
      <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${config.text}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`shrink-0 hover:opacity-70 transition-opacity ${config.iconColor}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastProvider;
