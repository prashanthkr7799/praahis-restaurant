/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication and specific permissions
 * Enhanced with restaurant isolation validation
 */

import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '@features/auth/services/authService';
import { hasPermission, getDashboardRoute } from '@shared/utils/permissions';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import { supabase } from '@config/supabase';
import { logger } from '@shared/utils/logger';
import toast from 'react-hot-toast';

const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireRestaurant = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const location = useLocation();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  const logSecurityEvent = useCallback(
    async (eventType, details) => {
      try {
        await supabase.from('auth_activity_logs').insert({
          user_id: user?.id || null,
          action: eventType,
          ip_address: null,
          user_agent: navigator.userAgent,
          metadata: {
            ...details,
            path: location.pathname,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    },
    [user, location.pathname]
  );

  const checkAuth = async () => {
    const { user: authUser, profile: userProfile, error } = await getCurrentUser();

    if (error) {
      console.error('🛡️ ProtectedRoute: Auth error:', error);
    }

    setUser(authUser);
    setProfile(userProfile);
    setLoading(false);
  };

  const validateRestaurantAccess = useCallback(async () => {
    // Skip validation for superadmin/owner
    const roleLower = String(profile?.role || '').toLowerCase();
    if (roleLower === 'owner' || roleLower === 'superadmin') {
      return;
    }

    // Check if this is the subscription page - managers can always access it
    const isSubscriptionPage = location.pathname === '/manager/subscription';
    const isManager = roleLower === 'manager' || roleLower === 'admin';
    // User must have a restaurant_id
    if (!profile?.restaurant_id) {
      setValidationError('no_restaurant_assigned');
      await logSecurityEvent('access_denied_no_restaurant', {
        user_role: profile?.role,
        reason: 'User has no restaurant assigned',
      });
      return;
    }

    // IMPORTANT: Wait for restaurant context to finish loading
    // This prevents false "no context" errors during initial page load
    if (restaurantLoading) {
      // Still loading, don't validate yet
      return;
    }

    // Restaurant context must be set (after loading complete)
    let effectiveRestaurantId = restaurantId;
    if (!effectiveRestaurantId) {
      // Try to rehydrate from localStorage (fallback)
      try {
        const ctxRaw = localStorage.getItem('praahis_restaurant_ctx');
        if (ctxRaw) {
          const ctx = JSON.parse(ctxRaw);
          effectiveRestaurantId = ctx.restaurantId || null;
        }
      } catch {
        // Ignore JSON parse/localStorage errors
      }
    }
    if (!effectiveRestaurantId) {
      setValidationError('no_restaurant_context');
      await logSecurityEvent('access_denied_no_context', {
        user_role: profile?.role,
        user_restaurant_id: profile?.restaurant_id,
        reason: 'Restaurant context not set',
      });
      return;
    }

    // Restaurant context must match user's assigned restaurant
    if (profile.restaurant_id !== effectiveRestaurantId) {
      setValidationError('restaurant_mismatch');
      await logSecurityEvent('cross_restaurant_access_attempt', {
        user_role: profile?.role,
        user_restaurant_id: profile?.restaurant_id,
        attempted_restaurant_id: restaurantId,
        reason: 'Attempted to access different restaurant data',
      });

      toast.error('Unauthorized: Restaurant access violation detected');
      return;
    }

    // CRITICAL: Check if the restaurant is active and subscription is valid
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select(
          `
          id, 
          name, 
          is_active,
          subscriptions (
            id,
            status,
            current_period_end
          )
        `
        )
        .eq('id', profile.restaurant_id)
        .single();

      if (restaurantError) {
        console.error('ProtectedRoute: Failed to check restaurant status:', restaurantError);
        // Don't block on error, but log it
      } else if (restaurant) {
        // Check subscription status first (managers can access subscription page even when deactivated)
        const subscription = Array.isArray(restaurant.subscriptions)
          ? restaurant.subscriptions[0]
          : restaurant.subscriptions;

        if (subscription) {
          const subStatus = subscription.status?.toLowerCase();

          // Block if subscription is suspended or cancelled or expired
          // EXCEPTION: Managers can access subscription page to make payment
          if (subStatus === 'suspended' || subStatus === 'cancelled' || subStatus === 'expired') {
            if (isManager && isSubscriptionPage) {
              // Allow manager to access subscription page for payment
              setValidationError(null);
              return;
            }

            // For managers on other pages, redirect to subscription
            if (isManager) {
              setValidationError('subscription_suspended_manager');
              await logSecurityEvent('manager_redirected_to_subscription', {
                user_role: profile?.role,
                restaurant_id: restaurant.id,
                subscription_status: subStatus,
                reason: 'Manager redirected to subscription page for payment',
              });
              return;
            } else {
              setValidationError('subscription_suspended');
              await logSecurityEvent('access_denied_subscription_suspended', {
                user_role: profile?.role,
                restaurant_id: restaurant.id,
                subscription_status: subStatus,
                reason: 'Subscription has been suspended/cancelled',
              });
              return;
            }
          }

          // Check if subscription is expired (date-based)
          // BUT ONLY if status is NOT explicitly 'active' or 'trial'
          // This allows SuperAdmin to extend subscription and set status to active
          if (subscription.current_period_end && subStatus !== 'active' && subStatus !== 'trial') {
            const expiryDate = new Date(subscription.current_period_end);
            if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
              if (isManager && isSubscriptionPage) {
                // Allow manager to access subscription page for payment
                setValidationError(null);
                return;
              }

              // For managers on other pages, redirect to subscription
              if (isManager) {
                setValidationError('subscription_expired_manager');
                await logSecurityEvent('manager_redirected_to_subscription', {
                  user_role: profile?.role,
                  restaurant_id: restaurant.id,
                  expiry_date: subscription.current_period_end,
                  reason: 'Manager redirected to subscription page for payment',
                });
                return;
              } else {
                setValidationError('subscription_expired');
                await logSecurityEvent('access_denied_subscription_expired', {
                  user_role: profile?.role,
                  restaurant_id: restaurant.id,
                  expiry_date: subscription.current_period_end,
                  reason: 'Subscription has expired',
                });
                return;
              }
            }
          }
        }

        // Check is_active flag (only if subscription check didn't return)
        // But if subscription status is 'active' or 'trial', we should allow access
        // This handles cases where SuperAdmin extended subscription but forgot to reactivate
        // subscription variable is already defined above, reuse it
        const activeSubStatus = subscription?.status?.toLowerCase();

        if (!restaurant.is_active && activeSubStatus !== 'active' && activeSubStatus !== 'trial') {
          // Check if manager trying to access subscription page
          if (isManager && isSubscriptionPage) {
            setValidationError(null);
            return;
          }

          if (isManager) {
            setValidationError('subscription_suspended_manager');
            await logSecurityEvent('manager_redirected_to_subscription', {
              user_role: profile?.role,
              restaurant_id: restaurant.id,
              restaurant_name: restaurant.name,
              reason: 'Restaurant deactivated - manager redirected to subscription',
            });
            return;
          }

          setValidationError('restaurant_deactivated');
          await logSecurityEvent('access_denied_restaurant_deactivated', {
            user_role: profile?.role,
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            reason: 'Restaurant has been deactivated',
          });
          return;
        }
      }
    } catch (error) {
      console.error('ProtectedRoute: Error checking restaurant status:', error);
    }

    // All validations passed
    setValidationError(null);
  }, [profile, restaurantLoading, restaurantId, logSecurityEvent, location.pathname]);

  // All hooks must be called at the top level, after function definitions
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !restaurantLoading && user && profile && requireRestaurant) {
      validateRestaurantAccess();
    }
  }, [
    loading,
    restaurantLoading,
    user,
    profile,
    restaurantId,
    requireRestaurant,
    validateRestaurantAccess,
  ]);

  // Conditional rendering starts below all hooks
  if (loading || (requireRestaurant && restaurantLoading)) {
    logger.debug('🔄 ProtectedRoute: Loading...', { loading, restaurantLoading });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    logger.debug('🔒 ProtectedRoute: Not authenticated - Redirecting to /login');
    logger.debug('   User:', user ? 'exists' : 'NULL');
    logger.debug('   Profile:', profile ? 'exists' : 'NULL');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if account is active
  if (!profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Account Deactivated</h2>
          <p className="text-gray-600 mb-6">
            Your account has been deactivated. Please contact your administrator.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  // Restaurant validation errors
  if (validationError) {
    // For managers with subscription issues, redirect directly to subscription page
    if (
      validationError === 'subscription_suspended_manager' ||
      validationError === 'subscription_expired_manager'
    ) {
      return <Navigate to="/manager/subscription" replace />;
    }

    let errorTitle = 'Access Denied';
    let errorMessage = 'You do not have access to this restaurant.';
    let showPaymentOption = false;

    switch (validationError) {
      case 'no_restaurant_assigned':
        errorMessage =
          'Your account is not associated with any restaurant. Please contact support.';
        break;
      case 'no_restaurant_context':
        errorMessage = 'Restaurant context is missing. Please log in again.';
        break;
      case 'restaurant_mismatch':
        errorTitle = 'Unauthorized Access';
        errorMessage =
          'You are attempting to access data from a different restaurant. This incident has been logged.';
        break;
      case 'restaurant_deactivated':
        errorTitle = 'Restaurant Deactivated';
        errorMessage =
          'Your restaurant has been deactivated by the administrator. Please contact support for assistance.';
        break;
      case 'subscription_suspended':
        errorTitle = 'Subscription Suspended';
        errorMessage =
          'Your restaurant subscription has been suspended. The manager needs to complete payment to reactivate.';
        showPaymentOption = profile?.role?.toLowerCase() === 'manager';
        break;
      case 'subscription_expired':
        errorTitle = 'Subscription Expired';
        errorMessage =
          'Your restaurant subscription has expired. The manager needs to renew the subscription to continue.';
        showPaymentOption = profile?.role?.toLowerCase() === 'manager';
        break;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{errorTitle}</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            {/* Show payment button for managers when subscription is suspended/expired */}
            {showPaymentOption && (
              <a
                href="/manager/subscription"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Payment
              </a>
            )}
            <div className="flex gap-3 justify-center">
              <a
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log In Again
              </a>
              {validationError !== 'restaurant_mismatch' && (
                <a
                  href="mailto:support@praahis.com"
                  className="inline-block px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Contact Support
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role requirement
  if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
    // If the user is an OWNER, redirect them to Super Admin portal instead of showing a block screen
    if ((profile.role || '').toLowerCase() === 'owner') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }

    // Debug logging (dev only)
    logger.debug('🔒 Access Denied Debug:');
    logger.debug('Required roles:', requiredRoles);
    logger.debug('User profile:', profile);
    logger.debug('User role:', profile.role);
    logger.debug('Role match:', requiredRoles.includes(profile.role));

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-2">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-4">
            Required role: {requiredRoles.join(', ')}
            <br />
            Your role: {profile.role || 'none'}
          </p>
          <a
            href={getDashboardRoute(profile.role)}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check permission requirement
  if (requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.some((permission) =>
      hasPermission(profile.role, permission)
    );

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have the required permissions to access this page.
            </p>
            <a
              href={getDashboardRoute(profile.role)}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  // User has access
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requireRestaurant: PropTypes.bool,
};

ProtectedRoute.defaultProps = {
  requiredPermissions: [],
  requiredRoles: [],
  requireRestaurant: true,
};

export default ProtectedRoute;
