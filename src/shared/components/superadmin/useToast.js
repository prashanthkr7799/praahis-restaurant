/**
 * Toast Context and Hook - Separated for Fast Refresh compatibility
 */
import { createContext, useContext } from 'react';

// Export context from here instead of Toast.jsx
export const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
