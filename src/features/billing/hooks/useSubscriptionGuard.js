import { useState, useEffect } from 'react';
import { supabase } from '@config/supabase';
import { useNavigate } from 'react-router-dom';

/**
 * useSubscriptionGuard Hook
 * Netflix-style subscription check - blocks access if subscription expired/suspended
 * 
 * Usage:
 * const { subscription, loading, hasAccess } = useSubscriptionGuard();
 * 
 * Returns:
 * - subscription: { status, is_active, days_remaining, in_grace_period, message }
 * - loading: boolean
 * - hasAccess: boolean (true = allow access, false = redirect to suspension page)
 * - checkStatus: function to manually refresh status
 */
export const useSubscriptionGuard = (options = {}) => {
  const {
    redirectOnExpired = false,
    redirectPath = '/subscription-expired',
    skipCheck = false, // For public pages
    restaurantId = null // Optional: check specific restaurant
  } = options;

  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's restaurant_id
      let targetRestaurantId = restaurantId;
      
      if (!targetRestaurantId) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('restaurant_id')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        targetRestaurantId = userData?.restaurant_id;
      }

      if (!targetRestaurantId) {
        // No restaurant association (Super Admin or customer)
        setLoading(false);
        return;
      }

      // Call check_subscription_status function
      const { data, error: rpcError } = await supabase
        .rpc('check_subscription_status', {
          p_restaurant_id: targetRestaurantId
        });

      if (rpcError) throw rpcError;

      const statusData = data && data.length > 0 ? data[0] : null;
      
      setSubscription(statusData);

      // Redirect if no access and redirect enabled
      if (redirectOnExpired && statusData && !statusData.is_active) {
        navigate(redirectPath, {
          state: {
            status: statusData.status,
            message: statusData.message,
            daysRemaining: statusData.days_remaining
          }
        });
      }

    } catch (err) {
      console.error('Subscription check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!skipCheck) {
      checkStatus();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipCheck, restaurantId]);

  const hasAccess = subscription?.is_active ?? true; // Default to true if no subscription data
  const isInGracePeriod = subscription?.in_grace_period ?? false;
  const status = subscription?.status ?? 'unknown';

  return {
    subscription,
    loading,
    error,
    hasAccess,
    isInGracePeriod,
    status,
    checkStatus, // Manual refresh
    daysRemaining: subscription?.days_remaining ?? 0
  };
};

export default useSubscriptionGuard;
