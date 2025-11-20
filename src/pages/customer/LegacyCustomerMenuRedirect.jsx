import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import toast from 'react-hot-toast';

/**
 * LegacyCustomerMenuRedirect
 * Supports old QR pattern: /customer/menu/:restaurantId/:tableId
 * Redirects to new route: /table/:tableId and sets restaurant context if possible.
 */
const LegacyCustomerMenuRedirect = () => {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const { setRestaurantBySlug } = useRestaurant();

  useEffect(() => {
    const performRedirect = async () => {
      try {
        // Try to fetch restaurant slug from ID (optional enhancement)
        let slug = null;
        if (restaurantId && /^[0-9a-fA-F-]{36}$/.test(restaurantId)) {
          const { data, error } = await supabase
            .from('restaurants')
            .select('slug')
            .eq('id', restaurantId)
            .limit(1);
          if (!error && data && data.length > 0 && data[0].slug) {
            slug = data[0].slug;
            // Set context using slug (ignore errors silently)
            try { await setRestaurantBySlug(slug); } catch { /* ignore slug set errors */ }
          }
        }
        // Navigate to new table route (slug passed via query if available)
        const target = slug ? `/table/${tableId}?restaurant=${encodeURIComponent(slug)}` : `/table/${tableId}`;
        navigate(target, { replace: true });
      } catch (err) {
        console.error('Legacy redirect failed:', err);
        toast.error('Invalid QR link. Please rescan or contact staff.');
        navigate('/', { replace: true });
      }
    };
    performRedirect();
  }, [restaurantId, tableId, navigate, setRestaurantBySlug]);

  return (
    <div className="min-h-screen flex items-center justify-center customer-theme">
      <LoadingSpinner size="large" text="Loading menu..." />
    </div>
  );
};

export default LegacyCustomerMenuRedirect;
