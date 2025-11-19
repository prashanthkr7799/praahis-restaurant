import { useEffect, useState } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';

/**
 * Hook to check subscription status and enforce restrictions
 * Call this on login or app initialization
 */
export const useSubscriptionCheck = (restaurantId) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the database function to check subscription
      const { data, error: rpcError } = await supabase.rpc(
        'check_subscription_status',
        { p_restaurant_id: restaurantId }
      );

      if (rpcError) throw rpcError;

      setSubscriptionStatus(data);

      // If subscription is expired, prevent access
      if (!data.can_login) {
        return {
          allowed: false,
          reason: data.message,
          status: data.status,
        };
      }

      return {
        allowed: true,
        status: data.status,
        expiresAt: data.expires_at,
        daysRemaining: data.days_remaining,
      };
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err.message);
      
      // Fail secure - if we can't check, assume expired
      return {
        allowed: false,
        reason: 'Unable to verify subscription status',
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    checkSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const refreshStatus = () => {
    return checkSubscription();
  };

  return {
    subscriptionStatus,
    loading,
    error,
    refreshStatus,
    isExpired: subscriptionStatus && !subscriptionStatus.can_login,
    daysRemaining: subscriptionStatus?.days_remaining,
    expiresAt: subscriptionStatus?.expires_at,
  };
};

export default useSubscriptionCheck;
