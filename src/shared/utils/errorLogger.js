/**
 * Error Logger Utility
 * Enhanced error logging with activity tracking
 */

import { supabase } from '@config/supabase';

/**
 * Log error to database and console
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
export const logError = async (error, context = {}) => {
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack || '',
    name: error.name || 'Error',
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    console.error('Error logged:', errorData);
  }

  try {
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();

    // Log to canonical auth_activity_logs with metadata
    await supabase.from('auth_activity_logs').insert({
      user_id: user?.id || null,
      action: 'error_occurred',
      ip_address: null, // Will be captured by backend if needed
      user_agent: navigator.userAgent,
      metadata: {
        entity_type: 'error',
        entity_id: null,
        details: {
          error: errorData,
          url: window.location.href,
        },
      },
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }

  return errorData;
};

/**
 * Log API error
 * @param {string} endpoint - API endpoint
 * @param {Error} error - Error object
 * @param {object} request - Request data
 */
export const logAPIError = async (endpoint, error, request = {}) => {
  return await logError(error, {
    type: 'API_ERROR',
    endpoint,
    request,
    response: error.response?.data || null,
    status: error.response?.status || null,
  });
};

/**
 * Log authentication error
 * @param {string} action - Auth action (login, signup, etc.)
 * @param {Error} error - Error object
 */
export const logAuthError = async (action, error) => {
  return await logError(error, {
    type: 'AUTH_ERROR',
    action,
  });
};

/**
 * Log validation error
 * @param {string} formName - Form name
 * @param {object} validationErrors - Validation errors
 */
export const logValidationError = async (formName, validationErrors) => {
  return await logError(
    new Error('Validation failed'),
    {
      type: 'VALIDATION_ERROR',
      formName,
      validationErrors,
    }
  );
};

/**
 * Get error logs from database
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} Array of error logs
 */
export const getErrorLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('auth_activity_logs')
      .select('*')
      .eq('action', 'error_occurred')
      .order('created_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }
};

/**
 * Clear old error logs (keep last 30 days)
 */
export const cleanupOldLogs = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('auth_activity_logs')
      .delete()
      .eq('action', 'error_occurred')
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return { success: false, error };
  }
};

/**
 * Handle global errors
 */
export const initGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled promise rejection'), {
      type: 'UNHANDLED_REJECTION',
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'GLOBAL_ERROR',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
};

export default {
  logError,
  logAPIError,
  logAuthError,
  logValidationError,
  getErrorLogs,
  cleanupOldLogs,
  initGlobalErrorHandler,
};
