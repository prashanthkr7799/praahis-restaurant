/**
 * Authentication Error Handler & Token Cleanup Utility
 * 
 * Handles common Supabase authentication errors:
 * - Invalid refresh tokens
 * - Expired sessions
 * - Multiple client instances warnings
 * 
 * Usage: Import and call at app initialization
 */

/**
 * Clear invalid or expired authentication tokens from localStorage
 */
export const clearInvalidTokens = () => {
  try {
    const managerSession = localStorage.getItem('sb-manager-session');
    const ownerSession = localStorage.getItem('sb-owner-session');
    
    let cleared = false;
    
    // Check and clean manager session
    if (managerSession) {
      try {
        const parsed = JSON.parse(managerSession);
        // If refresh_token exists but is invalid, clear it
        if (!parsed || !parsed.refresh_token || !parsed.access_token) {
          localStorage.removeItem('sb-manager-session');
          cleared = true;
          console.info('🧹 Cleared invalid manager session');
        }
      } catch {
        localStorage.removeItem('sb-manager-session');
        cleared = true;
        console.info('🧹 Cleared malformed manager session');
      }
    }
    
    // Check and clean owner session
    if (ownerSession) {
      try {
        const parsed = JSON.parse(ownerSession);
        if (!parsed || !parsed.refresh_token || !parsed.access_token) {
          localStorage.removeItem('sb-owner-session');
          cleared = true;
          console.info('🧹 Cleared invalid owner session');
        }
      } catch {
        localStorage.removeItem('sb-owner-session');
        cleared = true;
        console.info('🧹 Cleared malformed owner session');
      }
    }
    
    if (cleared) {
      console.info('✅ Token cleanup complete - please refresh if needed');
    }
    
    return cleared;
  } catch (error) {
    console.error('Error during token cleanup:', error);
    return false;
  }
};

/**
 * Handle authentication errors globally
 */
export const handleAuthError = (error) => {
  if (!error) return;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Handle invalid refresh token
  if (errorMessage.includes('refresh token') && errorMessage.includes('not found')) {
    console.warn('⚠️ Invalid refresh token detected - clearing session');
    clearInvalidTokens();
    return true;
  }
  
  // Handle expired token
  if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
    console.warn('⚠️ Token expired or invalid');
    return true;
  }
  
  return false;
};

/**
 * Suppress multiple GoTrueClient instances warning
 * This is expected behavior when using dual-client architecture (manager + owner)
 */
export const suppressMultiClientWarning = () => {
  // Store original console.warn
  const originalWarn = console.warn;
  
  // Override console.warn to filter GoTrueClient warnings
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress the specific multiple instances warning
    if (message.includes('Multiple GoTrueClient instances')) {
      // This is expected - we use dual clients for manager/owner sessions
      return;
    }
    
    // Pass through all other warnings
    originalWarn.apply(console, args);
  };
};

/**
 * Initialize authentication error handling
 * Call this once at app startup (e.g., in main.jsx)
 */
export const initAuthErrorHandling = () => {
  // Clear any invalid tokens on startup
  clearInvalidTokens();
  
  // Suppress expected multi-client warning
  suppressMultiClientWarning();
  
  console.info('✅ Auth error handling initialized');
};

/**
 * Check if user session is valid
 */
export const isValidSession = (sessionKey = 'sb-manager-session') => {
  try {
    const session = localStorage.getItem(sessionKey);
    if (!session) return false;
    
    const parsed = JSON.parse(session);
    if (!parsed?.access_token || !parsed?.refresh_token) return false;
    
    // Check if token is expired (basic check)
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at * 1000);
      if (expiresAt < new Date()) {
        console.info('ℹ️ Session expired');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

/**
 * Safe logout that clears all sessions
 */
export const clearAllSessions = () => {
  localStorage.removeItem('sb-manager-session');
  localStorage.removeItem('sb-owner-session');
  
  // Clear other Praahis-specific data
  const praahisKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('praahis_')
  );
  
  praahisKeys.forEach(key => {
    if (!key.includes('_restaurant_')) {
      // Keep restaurant context but clear auth-related data
      localStorage.removeItem(key);
    }
  });
  
  console.info('🔒 All sessions cleared');
};

export default {
  clearInvalidTokens,
  handleAuthError,
  suppressMultiClientWarning,
  initAuthErrorHandling,
  isValidSession,
  clearAllSessions,
};
