/**
 * Supabase Client Configuration
 * Core client setup with auth, realtime, and error handling
 */

import { createClient } from '@supabase/supabase-js';
import { handleAuthError, clearAllSessions } from '@shared/utils/authErrorHandler';
import { logger } from '@shared/utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Safe storage wrapper that handles contexts where localStorage is not available
 * (e.g., some privacy modes, service workers, iframes with restricted permissions)
 */
const createSafeStorage = () => {
  const memoryStorage = new Map();

  const isStorageAvailable = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  const storageAvailable = isStorageAvailable();

  return {
    getItem: (key) => {
      try {
        return storageAvailable ? localStorage.getItem(key) : (memoryStorage.get(key) ?? null);
      } catch {
        return memoryStorage.get(key) ?? null;
      }
    },
    setItem: (key, value) => {
      try {
        if (storageAvailable) {
          localStorage.setItem(key, value);
        } else {
          memoryStorage.set(key, value);
        }
      } catch {
        memoryStorage.set(key, value);
      }
    },
    removeItem: (key) => {
      try {
        if (storageAvailable) {
          localStorage.removeItem(key);
        } else {
          memoryStorage.delete(key);
        }
      } catch {
        memoryStorage.delete(key);
      }
    },
  };
};

// Suppress expected multi-client warning (we use dual clients for manager + owner sessions)
// and chart initialization warnings
if (typeof console !== 'undefined' && !globalThis.__supabase_warn_suppressed__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Multiple GoTrueClient instances')) {
      // This is expected - we use separate clients for staff and owner sessions
      return;
    }
    if (message.includes('width(-1) and height(-1) of chart')) {
      // This is a temporary Recharts warning during initial render - safe to ignore
      return;
    }
    originalWarn.apply(console, args);
  };
  globalThis.__supabase_warn_suppressed__ = true;
}

// Create safe storage instance for manager client
const managerStorage = createSafeStorage();

// Ensure a single instance across HMR to avoid multiple GoTrue clients with the same storageKey
const globalAny = globalThis;
export const supabase =
  globalAny.__supabase_manager__ ??
  (globalAny.__supabase_manager__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use a distinct storage key for manager/staff sessions
      storageKey: 'sb-manager-session',
      // Use safe storage that handles restricted contexts
      storage: managerStorage,
      // Keep session alive for 4 hours of activity
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'praahis-manager-client',
      },
    },
  }));

// Listen for auth errors and handle invalid refresh tokens automatically
supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'TOKEN_REFRESHED') {
    logger.info('✅ Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    logger.info('🔒 User signed out');
  }
});

// Handle auth errors globally - catch invalid refresh tokens
const originalRefresh = supabase.auth._refreshAccessToken?.bind(supabase.auth);
if (originalRefresh) {
  supabase.auth._refreshAccessToken = async (...args) => {
    try {
      return await originalRefresh(...args);
    } catch (error) {
      if (
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('Invalid Refresh Token')
      ) {
        logger.warn('⚠️ Invalid refresh token - clearing sessions');
        clearAllSessions();
        // Redirect to login after clearing
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/auth/login';
        }
      }
      throw error;
    }
  };
}

/**
 * Wrapper to handle authentication errors in Supabase responses
 * Automatically clears invalid tokens and provides user-friendly errors
 */
export const handleSupabaseError = (error) => {
  if (!error) return null;

  // Check for authentication errors
  if (error.code === 'PGRST301' || error.message?.includes('401')) {
    handleAuthError(error);
    return new Error('Session expired. Please log in again.');
  }

  // Handle other auth-related errors
  if (error.message?.includes('refresh token') || error.message?.includes('JWT')) {
    handleAuthError(error);
    return new Error('Authentication error. Please log in again.');
  }

  return error;
};

export default supabase;
