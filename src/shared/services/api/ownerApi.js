import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Safe storage wrapper that handles contexts where localStorage is not available
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

const ownerStorage = createSafeStorage();

// Ensure a single instance across HMR to avoid multiple GoTrue clients with the same storageKey
const globalAny = globalThis;
export const supabaseOwner =
  globalAny.__supabase_owner__ ??
  (globalAny.__supabase_owner__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Distinct storage key so owner can be signed in separately
      storageKey: 'sb-owner-session',
      // Use safe storage that handles restricted contexts
      storage: ownerStorage,
      // Keep session alive for 4 hours of activity
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'praahis-owner-client',
      },
    },
  }));

export default supabaseOwner;
