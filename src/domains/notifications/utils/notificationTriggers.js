/**
 * Notification Creation Helpers
 * Helper functions to create notifications for various events
 * Uses existing notifications table with no SQL changes
 */

import { supabase } from '@/shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Create a notification
 * @param {Object} params - Notification parameters
 * @param {string} params.restaurantId - Restaurant ID
 * @param {string} params.userId - User ID to notify
 * @param {string} params.type - Notification type (order, payment, alert, staff, system)
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {Object} params.data - Additional data (priority, action_type, etc.)
 * @returns {Promise<Object>} Created notification or error
 */
export const createNotification = async ({
  restaurantId,
  userId,
  type = 'system',
  title,
  body,
  data = {},
}) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        type,
        title,
        body,
        data,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: notification, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

/**
 * Create notifications for multiple users
 * @param {Object} params - Notification parameters
 * @param {string} params.restaurantId - Restaurant ID
 * @param {Array<string>} params.userIds - Array of user IDs to notify
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {Object} params.data - Additional data
 * @returns {Promise<Object>} Created notifications or error
 */
export const createBulkNotifications = async ({
  restaurantId,
  userIds,
  type = 'system',
  title,
  body,
  data = {},
}) => {
  try {
    const notifications = userIds.map((userId) => ({
      restaurant_id: restaurantId,
      user_id: userId,
      type,
      title,
      body,
      data,
      is_read: false,
    }));

    const { data: created, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return { data: created, error: null };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { data: null, error };
  }
};

/**
 * Get all manager/admin users for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} Array of manager user IDs
 */
export const getRestaurantManagers = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .in('role', ['manager', 'admin'])
      .eq('is_active', true);

    if (error) throw error;

    return data?.map((user) => user.id) || [];
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
};

/**
 * Get all staff of a specific role for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {Array<string>} roles - Array of roles to filter
 * @returns {Promise<Array>} Array of staff user IDs
 */
export const getRestaurantStaffByRole = async (restaurantId, roles = []) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .in('role', roles)
      .eq('is_active', true);

    if (error) throw error;

    return data?.map((user) => user.id) || [];
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
};

// =============================================================================
// SPECIFIC NOTIFICATION TRIGGERS
// =============================================================================

/**
 * 1. Notify when customer calls waiter
 * Call this when customer presses "Call Waiter" button
 */
export const notifyWaiterCall = async ({ restaurantId, tableNumber, customerId }) => {
  try {
    // Get all waiters and managers
    const waiterIds = await getRestaurantStaffByRole(restaurantId, ['waiter']);
    const managerIds = await getRestaurantManagers(restaurantId);
    const allStaffIds = [...new Set([...waiterIds, ...managerIds])];

    if (allStaffIds.length === 0) {
      console.warn('No staff found to notify');
      return { error: 'No staff found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: allStaffIds,
      type: 'alert',
      title: `🙋 Table ${tableNumber} needs assistance`,
      body: `Customer at Table ${tableNumber} is calling for a waiter`,
      data: {
        priority: 'urgent',
        action_type: 'alert_waiter',
        table_number: tableNumber,
        customer_id: customerId,
      },
    });

    if (!result.error) {
      toast.success('Waiter has been notified!');
    }

    return result;
  } catch (error) {
    console.error('Error notifying waiter call:', error);
    return { error };
  }
};

/**
 * 2. Notify when takeaway order is ready
 * Call this when chef marks takeaway order as "Ready"
 */
export const notifyTakeawayReady = async ({
  restaurantId,
  orderNumber,
  customerId,
  customerPhone,
}) => {
  try {
    // Notify managers to call customer
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      console.warn('No managers found to notify');
      return { error: 'No managers found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'order',
      title: `📦 Takeaway Order #${orderNumber} Ready`,
      body: `Please call customer to pick up their order`,
      data: {
        priority: 'attention',
        action_type: 'call_customer',
        order_number: orderNumber,
        phone: customerPhone,
        customer_id: customerId,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying takeaway ready:', error);
    return { error };
  }
};

/**
 * 3. Notify when order served but unpaid for >10 minutes
 * Call this from a scheduled check or timer
 */
export const notifyUnpaidOrder = async ({
  restaurantId,
  orderId,
  orderNumber,
  tableNumber,
  amount,
  minutesElapsed,
}) => {
  try {
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      return { error: 'No managers found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'payment',
      title: `💰 Unpaid Order at Table ${tableNumber}`,
      body: `Order #${orderNumber} (₹${amount}) has been served for ${minutesElapsed} minutes but not paid`,
      data: {
        priority: 'attention',
        action_type: 'view_order',
        order_id: orderId,
        order_number: orderNumber,
        table_number: tableNumber,
        amount,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying unpaid order:', error);
    return { error };
  }
};

/**
 * 4. Notify when menu item marked out of stock
 * Call this when item stock status changes
 */
export const notifyOutOfStock = async ({
  restaurantId,
  itemName,
  itemId,
  changedBy,
}) => {
  try {
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      return { error: 'No managers found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'system',
      title: `🚫 Menu Item Out of Stock`,
      body: `"${itemName}" has been marked as out of stock`,
      data: {
        priority: 'update',
        action_type: 'view_menu',
        item_name: itemName,
        item_id: itemId,
        changed_by: changedBy,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying out of stock:', error);
    return { error };
  }
};

/**
 * 5. Notify when complaint/feedback is filed
 * Call this when customer submits negative feedback
 */
export const notifyComplaint = async ({
  restaurantId,
  feedbackId,
  orderId,
  orderNumber,
  rating,
  comment,
  tableNumber,
}) => {
  try {
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      return { error: 'No managers found' };
    }

    // Determine priority based on rating
    const priority = rating <= 2 ? 'urgent' : 'attention';

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'alert',
      title: `${rating <= 2 ? '⚠️' : '📝'} ${rating <= 2 ? 'Urgent' : 'New'} Feedback from Table ${tableNumber || 'Customer'}`,
      body: `Rating: ${'⭐'.repeat(rating)} - "${comment?.substring(0, 50)}${comment?.length > 50 ? '...' : ''}"`,
      data: {
        priority,
        action_type: 'view_complaint',
        feedback_id: feedbackId,
        order_id: orderId,
        order_number: orderNumber,
        rating,
        table_number: tableNumber,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying complaint:', error);
    return { error };
  }
};

/**
 * 6. Notify when order status changes
 * Call this when order moves through workflow (placed → preparing → ready → served)
 */
export const notifyOrderStatusChange = async ({
  restaurantId,
  orderId,
  orderNumber,
  oldStatus,
  newStatus,
  tableNumber,
}) => {
  try {
    let targetRoles = [];
    let title = '';
    let body = '';
    let priority = 'info';
    let actionType = 'view_order';

    // Determine who to notify based on status change
    switch (newStatus) {
      case 'placed':
        targetRoles = ['chef', 'manager'];
        title = `🔔 New Order #${orderNumber}`;
        body = `Table ${tableNumber || 'Takeaway'} placed a new order`;
        priority = 'attention';
        break;

      case 'preparing':
        targetRoles = ['waiter', 'manager'];
        title = `👨‍🍳 Order #${orderNumber} is being prepared`;
        body = `Chef started preparing order for Table ${tableNumber}`;
        priority = 'info';
        break;

      case 'ready':
        targetRoles = ['waiter', 'manager'];
        title = `✅ Order #${orderNumber} is ready`;
        body = `Table ${tableNumber} order is ready for serving`;
        priority = 'attention';
        break;

      case 'served':
        targetRoles = ['manager'];
        title = `🍽️ Order #${orderNumber} served`;
        body = `Table ${tableNumber} order has been served`;
        priority = 'info';
        break;

      default:
        return { error: 'Unknown status' };
    }

    const staffIds = await getRestaurantStaffByRole(restaurantId, targetRoles);

    if (staffIds.length === 0) {
      return { error: 'No staff found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: staffIds,
      type: 'order',
      title,
      body,
      data: {
        priority,
        action_type: actionType,
        order_id: orderId,
        order_number: orderNumber,
        table_number: tableNumber,
        old_status: oldStatus,
        new_status: newStatus,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying order status change:', error);
    return { error };
  }
};

/**
 * 7. Notify when new staff member joins
 * Call this when manager adds new staff
 */
export const notifyNewStaffMember = async ({
  restaurantId,
  staffName,
  staffRole,
  staffId,
}) => {
  try {
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      return { error: 'No managers found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'staff',
      title: `👋 New ${staffRole} joined`,
      body: `${staffName} has been added to your team`,
      data: {
        priority: 'update',
        staff_id: staffId,
        staff_name: staffName,
        staff_role: staffRole,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying new staff:', error);
    return { error };
  }
};

/**
 * 8. Notify when payment is completed
 * Call this after successful payment
 */
export const notifyPaymentCompleted = async ({
  restaurantId,
  orderId,
  orderNumber,
  amount,
  paymentMethod,
  tableNumber,
}) => {
  try {
    const managerIds = await getRestaurantManagers(restaurantId);

    if (managerIds.length === 0) {
      return { error: 'No managers found' };
    }

    const result = await createBulkNotifications({
      restaurantId,
      userIds: managerIds,
      type: 'payment',
      title: `✅ Payment Received - ₹${amount}`,
      body: `Order #${orderNumber} ${tableNumber ? `(Table ${tableNumber})` : ''} paid via ${paymentMethod}`,
      data: {
        priority: 'info',
        action_type: 'view_order',
        order_id: orderId,
        order_number: orderNumber,
        amount,
        payment_method: paymentMethod,
        table_number: tableNumber,
      },
    });

    return result;
  } catch (error) {
    console.error('Error notifying payment:', error);
    return { error };
  }
};

export default {
  createNotification,
  createBulkNotifications,
  getRestaurantManagers,
  getRestaurantStaffByRole,
  notifyWaiterCall,
  notifyTakeawayReady,
  notifyUnpaidOrder,
  notifyOutOfStock,
  notifyComplaint,
  notifyOrderStatusChange,
  notifyNewStaffMember,
  notifyPaymentCompleted,
};
