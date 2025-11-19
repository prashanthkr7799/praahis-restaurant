import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Ensure a single instance across HMR to avoid multiple GoTrue clients with the same storageKey
const globalAny = globalThis;
export const supabaseOwner = globalAny.__supabase_owner__ ?? (
  (globalAny.__supabase_owner__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Distinct storage key so owner can be signed in separately
      storageKey: 'sb-owner-session',
      // Keep session alive for 4 hours of activity
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'praahis-owner-client',
      },
    },
  }))
);

export default supabaseOwner;
