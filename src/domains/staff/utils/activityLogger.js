/**
 * Activity Logger
 * Logs all admin/staff actions to activity_logs table for audit trail
 */

import { supabase } from '@shared/utils/api/supabaseClient';

/**
 * Log an activity
 */
export const logActivity = async ({
  action,
  entityType = null,
  entityId = null,
  details = {},
  userId = null,
  restaurantId = null,
}) => {
  try {
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    // Get restaurant ID from user if not provided
    if (!restaurantId && userId) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', userId)
        .single();
      restaurantId = userProfile?.restaurant_id || null;
    }

    // Get IP and user agent
    const ipAddress = null; // Will be set by Edge Function in production
    const userAgent = navigator.userAgent;

    const { data, error } = await supabase
      .from('auth_activity_logs')
      .insert({
        user_id: userId,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          details,
          restaurant_id: restaurantId,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Activity log error:', error);
    return { data: null, error };
  }
};

/**
 * Predefined action loggers
 */

// Menu actions
export const logMenuItemCreated = (menuItemId, details = {}) => {
  return logActivity({
    action: 'menu_item_created',
    entityType: 'menu_item',
    entityId: menuItemId,
    details,
  });
};

export const logMenuItemUpdated = (menuItemId, changes = {}) => {
  return logActivity({
    action: 'menu_item_updated',
    entityType: 'menu_item',
    entityId: menuItemId,
    details: { changes },
  });
};

export const logMenuItemDeleted = (menuItemId, details = {}) => {
  return logActivity({
    action: 'menu_item_deleted',
    entityType: 'menu_item',
    entityId: menuItemId,
    details,
  });
};

// Order actions
export const logOrderStatusChanged = (orderId, oldStatus, newStatus) => {
  return logActivity({
    action: 'order_status_changed',
    entityType: 'order',
    entityId: orderId,
    details: { old_status: oldStatus, new_status: newStatus },
  });
};

export const logOrderCancelled = (orderId, reason = '') => {
  return logActivity({
    action: 'order_cancelled',
    entityType: 'order',
    entityId: orderId,
    details: { reason },
  });
};

// User/Staff actions
export const logUserCreated = (userId, userDetails = {}) => {
  return logActivity({
    action: 'user_created',
    entityType: 'user',
    entityId: userId,
    details: userDetails,
  });
};

export const logUserUpdated = (userId, changes = {}) => {
  return logActivity({
    action: 'user_updated',
    entityType: 'user',
    entityId: userId,
    details: { changes },
  });
};

export const logUserDeactivated = (userId, reason = '') => {
  return logActivity({
    action: 'user_deactivated',
    entityType: 'user',
    entityId: userId,
    details: { reason },
  });
};

export const logUserLogin = (userId) => {
  return logActivity({
    action: 'user_login',
    entityType: 'user',
    entityId: userId,
    details: {},
  });
};

export const logUserLogout = (userId) => {
  return logActivity({
    action: 'user_logout',
    entityType: 'user',
    entityId: userId,
    details: {},
  });
};

// Offer actions
export const logOfferCreated = (offerId, details = {}) => {
  return logActivity({
    action: 'offer_created',
    entityType: 'offer',
    entityId: offerId,
    details,
  });
};

export const logOfferUpdated = (offerId, changes = {}) => {
  return logActivity({
    action: 'offer_updated',
    entityType: 'offer',
    entityId: offerId,
    details: { changes },
  });
};

export const logOfferDeleted = (offerId, details = {}) => {
  return logActivity({
    action: 'offer_deleted',
    entityType: 'offer',
    entityId: offerId,
    details,
  });
};

// Settings actions
export const logSettingsUpdated = (settingKey, oldValue, newValue) => {
  return logActivity({
    action: 'settings_updated',
    entityType: 'settings',
    entityId: null,
    details: {
      setting: settingKey,
      old_value: oldValue,
      new_value: newValue,
    },
  });
};

// Export actions
export const logDataExported = (dataType, format, recordCount) => {
  return logActivity({
    action: 'data_exported',
    entityType: dataType,
    entityId: null,
    details: {
      format,
      record_count: recordCount,
    },
  });
};

/**
 * Get activity logs with filters
 */
export const getActivityLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('auth_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.entityType) {
      // entity_type stored in metadata
      query = query.contains('metadata', { entity_type: filters.entityType });
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    const normalized = (data || []).map((log) => ({
      ...log,
      entity_type: log.metadata?.entity_type || null,
      entity_id: log.metadata?.entity_id || null,
      details: log.metadata?.details || log.metadata || {},
    }));
    return { data: normalized, error: null };
  } catch (error) {
    console.error('Get activity logs error:', error);
    return { data: null, error };
  }
};

/**
 * Get activity log statistics
 */
export const getActivityStats = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('auth_activity_logs')
      .select('action, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Count by action type
    const actionCounts = data.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    // Count by date
    const dateCounts = data.reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      data: {
        total: data.length,
        actionCounts,
        dateCounts,
      },
      error: null,
    };
  } catch (error) {
    console.error('Get activity stats error:', error);
    return { data: null, error };
  }
};
