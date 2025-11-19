/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication and specific permissions
 * Enhanced with restaurant isolation validation
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '@shared/utils/auth/auth';
import { hasPermission, getDashboardRoute } from '@shared/utils/permissions/permissions';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRoles = [], requireRestaurant = true }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const location = useLocation();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  const logSecurityEvent = useCallback(async (eventType, details) => {
    try {
      await supabase.from('auth_activity_logs').insert({
        user_id: user?.id || null,
        action: eventType,
        ip_address: null,
        user_agent: navigator.userAgent,
        metadata: {
          ...details,
          path: location.pathname,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user, location.pathname]);

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

    // User must have a restaurant_id
    if (!profile?.restaurant_id) {
      setValidationError('no_restaurant_assigned');
      await logSecurityEvent('access_denied_no_restaurant', {
        user_role: profile?.role,
        reason: 'User has no restaurant assigned'
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
        reason: 'Restaurant context not set'
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
        reason: 'Attempted to access different restaurant data'
      });
      
      toast.error('Unauthorized: Restaurant access violation detected');
      return;
    }

    // All validations passed
    setValidationError(null);
  }, [profile, restaurantLoading, restaurantId, logSecurityEvent]);

  // All hooks must be called at the top level, after function definitions
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !restaurantLoading && user && profile && requireRestaurant) {
      validateRestaurantAccess();
    }
  }, [loading, restaurantLoading, user, profile, restaurantId, requireRestaurant, validateRestaurantAccess]);

  // Conditional rendering starts below all hooks
  if (loading || (requireRestaurant && restaurantLoading)) {
    if (import.meta?.env?.DEV) {
      console.log('🔄 ProtectedRoute: Loading...', { loading, restaurantLoading });
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    if (import.meta?.env?.DEV) {
      console.log('🔒 ProtectedRoute: Not authenticated - Redirecting to /login');
      console.log('   User:', user ? 'exists' : 'NULL');
      console.log('   Profile:', profile ? 'exists' : 'NULL');
    }
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
    let errorTitle = 'Access Denied';
    let errorMessage = 'You do not have access to this restaurant.';
    
    switch (validationError) {
      case 'no_restaurant_assigned':
        errorMessage = 'Your account is not associated with any restaurant. Please contact support.';
        break;
      case 'no_restaurant_context':
        errorMessage = 'Restaurant context is missing. Please log in again.';
        break;
      case 'restaurant_mismatch':
        errorTitle = 'Unauthorized Access';
        errorMessage = 'You are attempting to access data from a different restaurant. This incident has been logged.';
        break;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{errorTitle}</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
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
    );
  }

  // Check role requirement
  if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
    // If the user is an OWNER, redirect them to Super Admin portal instead of showing a block screen
    if ((profile.role || '').toLowerCase() === 'owner') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    
    // Debug logging (dev only)
    if (import.meta?.env?.DEV) {
      console.log('🔒 Access Denied Debug:');
      console.log('Required roles:', requiredRoles);
      console.log('User profile:', profile);
      console.log('User role:', profile.role);
      console.log('Role match:', requiredRoles.includes(profile.role));
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Required role: {requiredRoles.join(', ')}<br/>
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

export default ProtectedRoute;
