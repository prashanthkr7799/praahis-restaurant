import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { supabase } from '@config/supabase';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import toast from 'react-hot-toast';
import logger from '@shared/utils/logger';

/**
 * LegacyCustomerMenuRedirect
 * Supports multiple old QR patterns:
 * - /customer/menu/:restaurantId/:tableId
 * - /menu/:restaurantId?table=:tableNumber
 * Redirects to new route: /table/:tableId and sets restaurant context if possible.
 */
const LegacyCustomerMenuRedirect = () => {
  const { restaurantId, tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setRestaurantBySlug } = useRestaurant();

  useEffect(() => {
    const performRedirect = async () => {
      try {
        // Get table info from params or query string
        const tableNumber = searchParams.get('table');
        let finalTableId = tableId;

        logger.log('🔄 Legacy redirect:', { restaurantId, tableId, tableNumber });

        // If no tableId in params but we have restaurantId and table number, look up table
        if (!finalTableId && restaurantId && tableNumber) {
          logger.log('🔍 Looking up table by number:', tableNumber);
          const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('table_number', parseInt(tableNumber))
            .limit(1)
            .single();
          
          if (tableError) {
            console.error('❌ Table lookup error:', tableError);
            throw new Error(`Table ${tableNumber} not found in this restaurant`);
          }
          
          if (tableData) {
            finalTableId = tableData.id;
            logger.log('✅ Found table ID:', finalTableId);
          }
        }

        if (!finalTableId) {
          console.error('❌ No table ID found');
          console.error('Debug info:', { restaurantId, tableId, tableNumber, slug });
          throw new Error('Table not found - please scan a valid QR code');
        }

        // Double-check tableId is valid UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(finalTableId)) {
          logger.error('❌ Invalid table ID format:', finalTableId);
          throw new Error('Invalid table ID format');
        }

        // Try to fetch restaurant slug from ID (optional enhancement)
        let slug = null;
        if (restaurantId && /^[0-9a-fA-F-]{36}$/.test(restaurantId)) {
          const { data, error } = await supabase
            .from('restaurants')
            .select('slug')
            .eq('id', restaurantId)
            .limit(1)
            .single();
          
          if (!error && data && data.slug) {
            slug = data.slug;
            logger.log('✅ Restaurant slug:', slug);
            // Set context using slug (ignore errors silently)
            try { await setRestaurantBySlug(slug); } catch (e) { 
              logger.warn('⚠️ Failed to set restaurant context:', e);
            }
          }
        }
        
        // Final validation before redirect
        if (!finalTableId || finalTableId === 'undefined') {
          logger.error('❌ Cannot redirect with invalid table ID:', finalTableId);
          throw new Error('Invalid table ID');
        }
        
        // Navigate to new table route (slug passed via query if available)
        const target = slug ? `/table/${finalTableId}?restaurant=${encodeURIComponent(slug)}` : `/table/${finalTableId}`;
        logger.log('➡️  Redirecting to:', target);
        navigate(target, { replace: true });
      } catch (err) {
        logger.error('❌ Legacy redirect failed:', err);
        toast.error(err.message || 'Invalid QR link. Please rescan or contact staff.');
        navigate('/', { replace: true });
      }
    };
    
    // Only run if we have at least restaurantId
    if (restaurantId) {
      performRedirect();
    } else {
      console.error('❌ No restaurantId in URL');
      toast.error('Invalid QR code format');
      navigate('/', { replace: true });
    }
  }, [restaurantId, tableId, searchParams, navigate, setRestaurantBySlug]);

  return (
    <div className="min-h-screen flex items-center justify-center customer-theme">
      <LoadingSpinner size="large" text="Loading menu..." />
    </div>
  );
};

export default LegacyCustomerMenuRedirect;
