/**
 * Notification Utilities
 * Wrapper around react-hot-toast for consistent notifications
 */

import toast from 'react-hot-toast';

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {object} options - Toast options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 4000,
    position: 'top-right',
    ...options,
  });
};

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {object} options - Toast options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    position: 'top-right',
    ...options,
  });
};

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {object} options - Toast options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    ...options,
  });
};

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {object} options - Toast options
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 5000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#FEF3C7',
      color: '#92400E',
    },
    ...options,
  });
};

/**
 * Show loading notification
 * @param {string} message - Loading message
 * @param {object} options - Toast options
 * @returns {string} Toast ID for updating later
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    position: 'top-right',
    ...options,
  });
};

/**
 * Update existing notification
 * @param {string} toastId - Toast ID to update
 * @param {string} type - Type: 'success', 'error', 'info'
 * @param {string} message - New message
 */
export const updateNotification = (toastId, type, message) => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else if (type === 'error') {
    toast.error(message, { id: toastId });
  } else {
    toast(message, { id: toastId });
  }
};

/**
 * Dismiss notification
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissNotification = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all notifications
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Show promise notification (loading -> success/error)
 * @param {Promise} promise - Promise to track
 * @param {object} messages - Messages for different states
 */
export const showPromise = (promise, messages = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    },
    {
      position: 'top-right',
    }
  );
};

export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  updateNotification,
  dismissNotification,
  dismissAll,
  showPromise,
};
