/**
 * PAACS v2.0 — Session Management Utilities
 * 
 * Refactored to use Supabase Auth natively (no custom user_sessions table).
 * All session management is handled by Supabase auth.getSession(), auth.refreshSession(), etc.
 * Activity/login events are logged to auth_activity_logs for auditing.
 * 
 * @module lib/auth/sessions
 */

import { supabase } from '../supabase';

// ============================================================================
// Session Creation - Now uses Supabase Auth
// ============================================================================

/**
 * Creates a new session using Supabase auth (replaces old user_sessions table logic).
 * Logs login event to auth_activity_logs for auditing.
 * 
 * @param {Object} params - Session parameters
 * @param {string} params.userId - User ID (UUID) - from auth.uid()
 * @param {string} params.ipAddress - Client IP address (optional)
 * @param {string} params.userAgent - User agent string (optional)
 * @returns {Promise<Object>} Supabase session object from auth.getSession()
 */
export async function createSession({
  userId,
  ipAddress,
  userAgent
}) {
  try {
    // Get current Supabase auth session (already created by signInWithPassword/signUp)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error('Error getting Supabase session:', error);
      throw new Error('Failed to get session');
    }

    // Log login event to auth_activity_logs (canonical audit table)
    await supabase.from('auth_activity_logs').insert({
      user_id: userId,
      action: 'login_success',
      metadata: {
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: session.access_token.substring(0, 10) // partial token for reference
      }
    }).select().single();

    return session;
  } catch (error) {
    console.error('Exception in createSession:', error);
    throw error;
  }
}

// ============================================================================
// Session Retrieval - Now uses Supabase Auth
// ============================================================================

/**
 * Gets current active Supabase auth session.
 * Replaces old getSession(sessionId) which queried user_sessions table.
 * 
 * @returns {Promise<Object|null>} Supabase session object or null
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Exception in getSession:', error);
    return null;
  }
}

/**
 * Gets current authenticated user from Supabase auth.
 * 
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Exception in getUser:', error);
    return null;
  }
}

/**
 * Lists recent login events for a user from auth_activity_logs.
 * Replaces old getUserSessions() which queried user_sessions table.
 * 
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Array>} Array of login log objects
 */
export async function getUserLoginHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .in('action', ['login_success', 'login_failed', 'logout'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error getting user login history:', error);
      throw new Error('Failed to get user login history');
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getUserLoginHistory:', error);
    return [];
  }
}

/**
 * Note: Session counting is not applicable with Supabase auth sessions.
 * Supabase handles session lifecycle internally. This function is deprecated.
 * 
 * @deprecated Use auth.getSession() to check if user has active session
 * @returns {Promise<number>} Always returns 0 or 1
 */
export async function countUserSessions() {
  console.warn('countUserSessions is deprecated - Supabase manages sessions internally');
  const session = await getSession();
  return session ? 1 : 0;
}


// ============================================================================
// Session Updates - Now handled by Supabase Auth
// ============================================================================

/**
 * Session activity updates are handled automatically by Supabase auth.
 * No manual tracking needed. Supabase refreshSession() handles token rotation.
 * 
 * @deprecated Supabase auth manages session activity internally
 * @returns {Promise<boolean>} Always returns true (no-op)
 */
export async function updateSessionActivity() {
  console.warn('updateSessionActivity is deprecated - Supabase manages activity internally');
  return true;
}

/**
 * Token rotation is handled by Supabase auth.refreshSession().
 * No manual token updates needed.
 * 
 * @deprecated Use supabase.auth.refreshSession() directly
 * @returns {Promise<boolean>} Always returns true (no-op)
 */
export async function updateSessionTokens() {
  console.warn('updateSessionTokens is deprecated - Use supabase.auth.refreshSession()');
  return true;
}


// ============================================================================
// Session Revocation - Using Supabase Auth
// ============================================================================

/**
 * Revoke session (sign out)
 * Uses Supabase auth.signOut() to invalidate the session
 * Logs revocation to auth_activity_logs
 * 
 * @param {string} scope - 'local' to clear local storage only, 'global' to revoke everywhere
 * @returns {Promise<boolean>} Success status
 */
export async function revokeSession(scope = 'local') {
  try {
    // Get current session before revoking
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Log logout activity
      await supabase
        .from('auth_activity_logs')
        .insert({
          user_id: session.user.id,
          activity_type: 'logout',
          ip_address: null, // Will be set by trigger if available
          user_agent: navigator?.userAgent || null,
          metadata: { scope }
        });
    }

    // Revoke session via Supabase auth
    const { error } = await supabase.auth.signOut({ scope });

    if (error) {
      console.error('Error revoking session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in revokeSession:', error);
    return false;
  }
}

/**
 * Revoke all sessions except current (sign out other devices)
 * Note: Supabase doesn't support selective multi-session revocation natively
 * 
 * @deprecated Limited support - use revokeSession('global') instead
 * @param {string} _userId - User ID (not used, kept for API compatibility)
 * @param {string} _exceptSessionId - Session ID to keep (not used)
 * @returns {Promise<number>} Always returns 0 (not supported)
 */
export async function revokeOtherSessions(_userId, _exceptSessionId) {
  console.warn('revokeOtherSessions is not supported - use revokeSession("global") instead');
  return 0;
}

/**
 * Revoke ALL sessions for a user (admin function)
 * Requires admin privileges - must be implemented server-side
 * 
 * @param {string} userId - User ID to revoke sessions for
 * @returns {Promise<number>} Count of revoked sessions (0 for client-side)
 */
export async function revokeAllUserSessions(userId) {
  try {
    // Log admin action attempt
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('auth_activity_logs')
        .insert({
          user_id: userId,
          activity_type: 'admin_logout_attempt',
          ip_address: null,
          user_agent: navigator?.userAgent || null,
          metadata: { 
            admin_user_id: user.id,
            reason: 'Attempted to revoke all sessions (requires server-side)'
          }
        });
    }

    console.warn('revokeAllUserSessions requires server-side implementation with service role');
    return 0;
  } catch (error) {
    console.error('Exception in revokeAllUserSessions:', error);
    return 0;
  }
}

/**
 * Revoke session by refresh token JTI
 * Not applicable with Supabase auth - use revokeSession() instead
 * 
 * @deprecated Supabase manages JTI internally
 * @param {string} _refreshJti - Refresh token JTI (not used)
 * @returns {Promise<boolean>} Always returns false
 */
export async function revokeSessionByRefreshJti(_refreshJti) {
  console.warn('revokeSessionByRefreshJti is deprecated - use revokeSession() instead');
  return false;
}

// ============================================================================
// Session Validation - Using Supabase Auth
// ============================================================================

/**
 * Validates if current session is active and not expired
 * Uses Supabase auth to check session validity
 * 
 * @returns {Promise<boolean>} True if session is valid
 */
export async function isSessionValid() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Supabase handles expiration checking internally
    return session !== null;
  } catch (error) {
    console.error('Exception in isSessionValid:', error);
    return false;
  }
}

/**
 * Session JTI validation not needed with Supabase auth
 * Supabase manages token rotation and JTI validation internally
 * 
 * @deprecated Supabase handles JTI validation
 * @returns {boolean} Always returns true (no-op)
 */
export function validateSessionJti() {
  console.warn('validateSessionJti is deprecated - Supabase handles JTI validation');
  return true;
}

// ============================================================================
// Session Cleanup - Not Needed with Supabase Auth
// ============================================================================

/**
 * Cleanup expired sessions - handled by Supabase automatically
 * Supabase auth manages session cleanup internally
 * 
 * @deprecated Supabase handles session cleanup
 * @returns {Promise<number>} Always returns 0 (no-op)
 */
export async function cleanupExpiredSessions() {
  console.warn('cleanupExpiredSessions is deprecated - Supabase handles this automatically');
  return 0;
}

/**
 * Delete old sessions - handled by Supabase automatically
 * Supabase auth manages session storage internally
 * 
 * @deprecated Supabase handles session storage
 * @param {number} _daysOld - Days old (not used)
 * @returns {Promise<number>} Always returns 0 (no-op)
 */
export async function deleteOldSessions(_daysOld = 90) {
  console.warn('deleteOldSessions is deprecated - Supabase manages session storage');
  return 0;
}

// ============================================================================
// Session Analytics - Using auth_activity_logs
// ============================================================================

/**
 * Get session statistics for a restaurant
 * Queries auth_activity_logs for login activity
 * 
 * @param {string} restaurantId - Restaurant ID (UUID)
 * @returns {Promise<Object>} Session statistics
 */
export async function getRestaurantSessionStats(restaurantId) {
  try {
    // Query recent login activity from auth_activity_logs
    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('user_id, created_at, metadata')
      .eq('activity_type', 'login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting restaurant session stats:', error);
      return { totalLogins: 0, uniqueUsers: 0, recentActivity: [] };
    }

    const logins = data || [];
    
    // Filter by restaurant if metadata contains it
    const restaurantLogins = logins.filter(log => 
      log.metadata?.restaurant_id === restaurantId
    );

    const uniqueUsers = new Set(restaurantLogins.map(l => l.user_id)).size;
    const recentActivity = restaurantLogins.slice(0, 10).map(l => ({
      userId: l.user_id,
      loginTime: l.created_at,
      device: l.metadata?.device_name || 'Unknown'
    }));

    return {
      totalLogins: restaurantLogins.length,
      uniqueUsers,
      recentActivity
    };
  } catch (error) {
    console.error('Exception in getRestaurantSessionStats:', error);
    return { totalLogins: 0, uniqueUsers: 0, recentActivity: [] };
  }
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Creation
  createSession,
  
  // Retrieval
  getSession,
  getUser,
  getUserLoginHistory,
  countUserSessions,
  
  // Updates (deprecated - Supabase handles internally)
  updateSessionActivity,
  updateSessionTokens,
  
  // Revocation
  revokeSession,
  revokeOtherSessions,
  revokeAllUserSessions,
  revokeSessionByRefreshJti,
  
  // Validation (simplified with Supabase)
  isSessionValid,
  validateSessionJti,
  
  // Cleanup (deprecated - Supabase handles)
  cleanupExpiredSessions,
  deleteOldSessions,
  
  // Analytics
  getRestaurantSessionStats
};
