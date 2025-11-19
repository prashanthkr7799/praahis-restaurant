import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { getCurrentUser } from '@shared/utils/auth/auth';
import {
  setRestaurantContext as setRuntimeRestaurant,
  clearRestaurantContext as clearRuntimeRestaurant,
} from '@/lib/restaurantContextStore';

const LS_KEY = 'praahis_restaurant_ctx';

const RestaurantContext = createContext({
  restaurantId: null,
  restaurantSlug: null,
  restaurantName: null,
  branding: null,
  loading: true,
  error: null,
  setRestaurantBySlug: async (_slug) => {},
  clearRestaurant: () => {},
});

const readFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeToLocalStorage = (ctx) => {
  try {
    if (!ctx) localStorage.removeItem(LS_KEY);
    else localStorage.setItem(LS_KEY, JSON.stringify(ctx));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
};

const parseQuery = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('restaurant');
    return slug ? slug.trim().toLowerCase() : null;
  } catch {
    return null;
  }
};

const detectSubdomainSlug = () => {
  // Optional future: implement subdomain-based routing (e.g., slug.app.com)
  try {
    const host = window.location.hostname || '';
    const parts = host.split('.');
    if (parts.length > 2) {
      const sub = parts[0];
      if (sub && sub !== 'www') return sub.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
};

const fetchRestaurantBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, is_active')
    .ilike('slug', slug)
    .eq('is_active', true)
    .limit(1);
  if (error) {
    // If unauthorized, throw silently (user not logged in)
    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
      throw new Error('Unauthorized');
    }
    throw error;
  }
  if (!data || data.length === 0) throw new Error('Restaurant not found');
  const row = data[0];
  return {
    restaurantId: row.id,
    restaurantSlug: row.slug || slug,
    restaurantName: row.name,
    branding: {
      logoUrl: row.logo_url || null,
    },
  };
};

const fetchRestaurantById = async (id) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .limit(1);
  if (error) {
    // If unauthorized, throw silently (user not logged in)
    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
      throw new Error('Unauthorized');
    }
    throw error;
  }
  if (!data || data.length === 0) throw new Error('Restaurant not found');
  const row = data[0];
  return {
    restaurantId: row.id,
    restaurantSlug: row.slug || null,
    restaurantName: row.name,
    branding: { logoUrl: row.logo_url || null },
  };
};

export const RestaurantProvider = ({ children }) => {
  const [state, setState] = useState({
    restaurantId: null,
    restaurantSlug: null,
    restaurantName: null,
    branding: null,
    loading: true,
    error: null,
  });
  const initialisedRef = useRef(false);

  const applyContext = useCallback((ctx) => {
    setState((s) => ({ ...s, ...ctx, loading: false, error: null }));
    writeToLocalStorage(ctx);
    setRuntimeRestaurant(ctx);
  }, []);

  const clearRestaurant = useCallback(() => {
    writeToLocalStorage(null);
    clearRuntimeRestaurant();
    setState({
      restaurantId: null,
      restaurantSlug: null,
      restaurantName: null,
      branding: null,
      loading: false,
      error: null,
    });
  }, []);

  const setRestaurantBySlug = useCallback(async (slug) => {
    const resolved = await fetchRestaurantBySlug(slug);
    applyContext(resolved);
    return resolved;
  }, [applyContext]);

  // Resolve on first mount following priority:
  // (a) URL query ?restaurant=slug, (b) subdomain (optional), (c) logged-in user's restaurant_id, else localStorage fallback
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const bootstrap = async () => {
      try {
        // Priority (a): URL query param
        const querySlug = parseQuery();
        if (querySlug) {
          const ctx = await fetchRestaurantBySlug(querySlug);
          applyContext(ctx);
          return;
        }

        // Priority (b): subdomain (optional)
        const subdomainSlug = detectSubdomainSlug();
        if (subdomainSlug) {
          try {
            const ctx = await fetchRestaurantBySlug(subdomainSlug);
            applyContext(ctx);
            return;
          } catch {
            // fall through to next source
          }
        }

        // Priority (c): Fallback to localStorage FIRST (faster)
        const cached = readFromLocalStorage();
        if (cached?.restaurantId) {
          applyContext(cached);
          // Don't return - continue to validate user in background
        }

        // Priority (d): logged-in user profile (validate in background)
        try {
          const { profile } = await getCurrentUser();
          if (profile?.restaurant_id) {
            const ctx = await fetchRestaurantById(profile.restaurant_id);
            // Only update if different from cached
            if (!cached || cached.restaurantId !== ctx.restaurantId) {
              applyContext(ctx);
            }
            return;
          }
        } catch {
          // User not authenticated or profile fetch failed
          // If we have cached data, keep it; otherwise clear
          if (!cached) {
            setState((s) => ({ ...s, loading: false }));
          }
          return;
        }

        // Nothing found; remain without context
        if (!cached) {
          setState((s) => ({ ...s, loading: false }));
        }
        setState((s) => ({ ...s, loading: false }));
      } catch (error) {
        // Silently handle auth errors (expected on login pages)
        if (error?.message?.includes('401') || error?.code === 'PGRST301') {
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        // Silently handle "restaurant not found" - normal for customer pages
        if (error?.message?.includes('Restaurant not found')) {
          console.debug('Restaurant context: No restaurant auto-detected (normal for customer pages)');
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        console.error('Restaurant context bootstrap error:', error);
        setState((s) => ({ ...s, loading: false, error }));
      }
    };

    bootstrap();
  }, [applyContext]);

  // Clear on logout and handle token errors
  useEffect(() => {
    const { data: unsub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        clearRestaurant();
      }
      
      // Handle token refresh errors silently
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed, but don't clear context yet
        // Let individual components handle re-authentication
        console.info('Token refresh failed - may need to re-authenticate');
      }
    });
    return () => {
      unsub?.subscription?.unsubscribe?.();
    };
  }, [clearRestaurant]);

  const ctxValue = useMemo(() => ({
    ...state,
    setRestaurantBySlug,
    clearRestaurant,
  }), [state, setRestaurantBySlug, clearRestaurant]);

  return (
    <RestaurantContext.Provider value={ctxValue}>
      {children}
    </RestaurantContext.Provider>
  );
};

export default RestaurantContext;
