/**
 * PAACS v2.0 — Authentication Activity Logging
 * 
 * Provides comprehensive audit logging for all authentication events.
 * Logs are immutable and used for security monitoring and compliance.
 * 
 * @module lib/auth/logs
 */

import { supabase } from '../supabase';

// ============================================================================
// Log Event Types (constants)
// ============================================================================

export const AUTH_EVENTS = {
  // Login events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_LOCKED: 'login_locked',
  
  // Logout events
  LOGOUT: 'logout',
  LOGOUT_ALL: 'logout_all',
  SESSION_REVOKED: 'session_revoked',
  SESSION_EXPIRED: 'session_expired',
  
  // Token events
  TOKEN_REFRESH: 'token_refresh',
  TOKEN_REFRESH_FAILED: 'token_refresh_failed',
  TOKEN_ROTATION: 'token_rotation',
  
  // Password events
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  PASSWORD_RESET_FAILED: 'password_reset_failed',
  
  // Account events
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  ROLE_CHANGED: 'role_changed',
  
  // 2FA events
  TWO_FA_SETUP: '2fa_setup',
  TWO_FA_ENABLED: '2fa_enabled',
  TWO_FA_DISABLED: '2fa_disabled',
  TWO_FA_SUCCESS: '2fa_success',
  TWO_FA_FAILED: '2fa_failed',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  MULTIPLE_FAILED_ATTEMPTS: 'multiple_failed_attempts',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt'
};

// Failure reason constants
export const FAILURE_REASONS = {
  // Login failures
  USER_NOT_FOUND: 'user_not_found',
  INVALID_PASSWORD: 'invalid_password',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_DEACTIVATED: 'account_deactivated',
  RESTAURANT_SUSPENDED: 'restaurant_suspended',
  
  // Token failures
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid',
  TOKEN_REVOKED: 'token_revoked',
  SESSION_INACTIVE: 'session_inactive',
  JTI_MISMATCH: 'jti_mismatch',
  
  // 2FA failures
  INVALID_TOTP: 'invalid_totp',
  INVALID_BACKUP_CODE: 'invalid_backup_code',
  TWO_FA_REQUIRED: '2fa_required',
  
  // Password failures
  TOKEN_USED: 'token_used',
  TOKEN_NOT_FOUND: 'token_not_found',
  WEAK_PASSWORD: 'weak_password',
  
  // General
  VALIDATION_ERROR: 'validation_error',
  DATABASE_ERROR: 'database_error',
  UNKNOWN_ERROR: 'unknown_error'
};

// ============================================================================
// Core Logging Function
// ============================================================================

/**
 * Logs an authentication event to the database
 * This is the primary function used by all authentication flows
 * 
 * @param {Object} params - Log parameters
 * @param {string} params.action - Action type (use AUTH_EVENTS constants)
 * @param {boolean} params.success - Whether the action was successful
 * @param {string} [params.userId] - User ID (may be null for failed logins)
 * @param {string} [params.restaurantId] - Restaurant ID
 * @param {string} [params.email] - User email (for failed login attempts)
 * @param {string} [params.ipAddress] - Client IP address
 * @param {string} [params.deviceInfo] - User agent or device description
 * @param {string} [params.failureReason] - Reason for failure (use FAILURE_REASONS constants)
 * @param {Object} [params.metadata] - Additional metadata (stored as JSON)
 * @returns {Promise<boolean>} Success status
 */
export async function logAuthEvent({
  action,
  success,
  userId = null,
  restaurantId = null,
  email = null,
  ipAddress = null,
  deviceInfo = null,
  failureReason = null,
  metadata: _metadata = null // metadata reserved for future use
}) {
  try {
    const logEntry = {
      action,
      success,
      user_id: userId,
      restaurant_id: restaurantId,
      email,
      ip_address: ipAddress,
      device_info: deviceInfo,
      failure_reason: success ? null : failureReason,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('auth_activity_logs')
      .insert(logEntry);

    if (error) {
      console.error('Error logging auth event:', error);
      // Don't throw - logging failures shouldn't break auth flow
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in logAuthEvent:', error);
    return false;
  }
}

// ============================================================================
// Convenience Logging Functions
// ============================================================================

/**
 * Logs a successful login
 */
export async function logLoginSuccess({
  userId,
  restaurantId,
  email,
  ipAddress,
  deviceInfo
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.LOGIN_SUCCESS,
    success: true,
    userId,
    restaurantId,
    email,
    ipAddress,
    deviceInfo
  });
}

/**
 * Logs a failed login attempt
 */
export async function logLoginFailure({
  userId = null,
  email,
  ipAddress,
  deviceInfo,
  reason
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.LOGIN_FAILED,
    success: false,
    userId,
    email,
    ipAddress,
    deviceInfo,
    failureReason: reason
  });
}

/**
 * Logs account lockout
 */
export async function logAccountLocked({
  userId,
  email,
  ipAddress,
  deviceInfo,
  lockDurationMinutes
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.ACCOUNT_LOCKED,
    success: false,
    userId,
    email,
    ipAddress,
    deviceInfo,
    failureReason: FAILURE_REASONS.ACCOUNT_LOCKED,
    metadata: { lockDurationMinutes }
  });
}

/**
 * Logs logout
 */
export async function logLogout({
  userId,
  restaurantId,
  ipAddress,
  deviceInfo,
  allDevices = false
}) {
  return logAuthEvent({
    action: allDevices ? AUTH_EVENTS.LOGOUT_ALL : AUTH_EVENTS.LOGOUT,
    success: true,
    userId,
    restaurantId,
    ipAddress,
    deviceInfo
  });
}

/**
 * Logs token refresh
 */
export async function logTokenRefresh({
  userId,
  restaurantId,
  success,
  failureReason = null
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.TOKEN_REFRESH,
    success,
    userId,
    restaurantId,
    failureReason
  });
}

/**
 * Logs password change
 */
export async function logPasswordChange({
  userId,
  restaurantId,
  email,
  ipAddress,
  deviceInfo,
  initiatedBy = 'user' // 'user' | 'admin' | 'system'
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.PASSWORD_CHANGE,
    success: true,
    userId,
    restaurantId,
    email,
    ipAddress,
    deviceInfo,
    metadata: { initiatedBy }
  });
}

/**
 * Logs password reset request
 */
export async function logPasswordResetRequest({
  userId = null,
  email,
  ipAddress,
  deviceInfo
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.PASSWORD_RESET_REQUEST,
    success: true,
    userId,
    email,
    ipAddress,
    deviceInfo
  });
}

/**
 * Logs password reset success/failure
 */
export async function logPasswordReset({
  userId,
  email,
  success,
  failureReason = null,
  ipAddress,
  deviceInfo
}) {
  return logAuthEvent({
    action: success ? AUTH_EVENTS.PASSWORD_RESET_SUCCESS : AUTH_EVENTS.PASSWORD_RESET_FAILED,
    success,
    userId,
    email,
    ipAddress,
    deviceInfo,
    failureReason
  });
}

/**
 * Logs 2FA events
 */
export async function log2FAEvent({
  action,
  userId,
  restaurantId,
  email,
  success,
  failureReason = null,
  ipAddress,
  deviceInfo
}) {
  return logAuthEvent({
    action,
    success,
    userId,
    restaurantId,
    email,
    ipAddress,
    deviceInfo,
    failureReason
  });
}

/**
 * Logs suspicious activity
 */
export async function logSuspiciousActivity({
  userId = null,
  email,
  ipAddress,
  deviceInfo,
  description
}) {
  return logAuthEvent({
    action: AUTH_EVENTS.SUSPICIOUS_ACTIVITY,
    success: false,
    userId,
    email,
    ipAddress,
    deviceInfo,
    failureReason: description,
    metadata: { alertLevel: 'high' }
  });
}

// ============================================================================
// Query & Analytics Functions
// ============================================================================

/**
 * Gets recent authentication activity for a user
 * 
 * @param {string} userId - User ID (UUID)
 * @param {number} limit - Max number of records to return
 * @returns {Promise<Array>} Array of log entries
 */
export async function getUserAuthActivity(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting user auth activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getUserAuthActivity:', error);
    return [];
  }
}

/**
 * Gets failed login attempts for an email (for bruteforce detection)
 * 
 * @param {string} email - User email
 * @param {number} withinMinutes - Time window in minutes
 * @returns {Promise<number>} Count of failed attempts
 */
export async function getFailedLoginCount(email, withinMinutes = 15) {
  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - withinMinutes);

    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('action', AUTH_EVENTS.LOGIN_FAILED)
      .eq('success', false)
      .gte('timestamp', cutoffTime.toISOString());

    if (error) {
      console.error('Error getting failed login count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception in getFailedLoginCount:', error);
    return 0;
  }
}

/**
 * Gets authentication activity for a restaurant (for manager dashboard)
 * 
 * @param {string} restaurantId - Restaurant ID (UUID)
 * @param {number} limit - Max number of records
 * @returns {Promise<Array>} Array of log entries
 */
export async function getRestaurantAuthActivity(restaurantId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting restaurant auth activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getRestaurantAuthActivity:', error);
    return [];
  }
}

/**
 * Gets authentication statistics for security dashboard
 * 
 * @param {string} restaurantId - Restaurant ID (UUID)
 * @param {number} daysBack - Number of days to analyze
 * @returns {Promise<Object>} Statistics object
 */
export async function getAuthStats(restaurantId, daysBack = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Error getting auth stats:', error);
      return { totalEvents: 0, successfulLogins: 0, failedLogins: 0, lockouts: 0 };
    }

    const logs = data || [];
    
    return {
      totalEvents: logs.length,
      successfulLogins: logs.filter(l => l.action === AUTH_EVENTS.LOGIN_SUCCESS && l.success).length,
      failedLogins: logs.filter(l => l.action === AUTH_EVENTS.LOGIN_FAILED && !l.success).length,
      lockouts: logs.filter(l => l.action === AUTH_EVENTS.ACCOUNT_LOCKED).length,
      passwordResets: logs.filter(l => l.action === AUTH_EVENTS.PASSWORD_RESET_REQUEST).length,
      suspiciousActivity: logs.filter(l => l.action === AUTH_EVENTS.SUSPICIOUS_ACTIVITY).length
    };
  } catch (error) {
    console.error('Exception in getAuthStats:', error);
    return { totalEvents: 0, successfulLogins: 0, failedLogins: 0, lockouts: 0 };
  }
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Deletes old authentication logs (for compliance/retention policies)
 * Should be run periodically via cron job
 * 
 * @param {number} retentionDays - Keep logs for this many days
 * @returns {Promise<number>} Count of deleted logs
 */
export async function cleanupOldAuthLogs(retentionDays = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('auth_activity_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('Error cleaning up old auth logs:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`Cleaned up ${count} old auth logs`);
    }
    
    return count;
  } catch (error) {
    console.error('Exception in cleanupOldAuthLogs:', error);
    return 0;
  }
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Constants
  AUTH_EVENTS,
  FAILURE_REASONS,
  
  // Core logging
  logAuthEvent,
  
  // Convenience functions
  logLoginSuccess,
  logLoginFailure,
  logAccountLocked,
  logLogout,
  logTokenRefresh,
  logPasswordChange,
  logPasswordResetRequest,
  logPasswordReset,
  log2FAEvent,
  logSuspiciousActivity,
  
  // Queries
  getUserAuthActivity,
  getFailedLoginCount,
  getRestaurantAuthActivity,
  getAuthStats,
  
  // Cleanup
  cleanupOldAuthLogs
};
