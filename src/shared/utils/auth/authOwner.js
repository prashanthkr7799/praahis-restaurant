import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';

export const signInOwner = async (email, password) => {
  try {
    const { data, error } = await supabaseOwner.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Optional: mark owner session in localStorage to avoid confusion
  try { localStorage.setItem('is_owner_session', 'true'); } catch { /* ignore */ }
    return { data, error: null };
  } catch (error) {
    console.error('Owner sign in error:', error);
    return { data: null, error };
  }
};

export const signOutOwner = async () => {
  try {
    await supabaseOwner.auth.signOut();
    try { localStorage.removeItem('is_owner_session'); } catch { /* ignore */ }
    return { error: null };
  } catch (error) {
    console.error('Owner sign out error:', error);
    return { error };
  }
};

export const getCurrentOwnerUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabaseOwner.auth.getUser();
    if (authError || !user) return { user: null, profile: null, error: authError };

    const { data: profile, error: profileError } = await supabaseOwner
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) return { user, profile: null, error: profileError };

    return { user, profile, error: null };
  } catch (error) {
    console.error('Get current owner user error:', error);
    return { user: null, profile: null, error };
  }
};

export const getOwnerSession = async () => {
  try {
    const { data: { session }, error } = await supabaseOwner.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Get owner session error:', error);
    return { session: null, error };
  }
};
