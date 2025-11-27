/**
 * NOTIFICATION SYSTEM - QUICK START GUIDE
 * 
 * This file contains practical examples of how to use the notification system
 * in different parts of your application.
 */

// ============================================================================
// EXAMPLE 1: Customer Calls Waiter (Customer-facing component)
// ============================================================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { notifyWaiterCall } from '@/domains/notifications/utils/notificationTriggers';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { useAuth } from '@/shared/hooks/useAuth';
import toast from 'react-hot-toast';

export const CustomerMenuExample = () => {
  const { restaurantId } = useRestaurant();
  const { user } = useAuth();
  const [tableNumber, setTableNumber] = React.useState(5);

  const handleCallWaiter = async () => {
    const result = await notifyWaiterCall({
      restaurantId,
      tableNumber,
      customerId: user.id,
    });

    if (!result.error) {
      toast.success('Waiter has been called!');
    }
  };

  return (
    <Button onClick={handleCallWaiter}>
      🙋 Call Waiter
    </Button>
  );
};

// ============================================================================
// EXAMPLE 2: Kitchen Order Status Update (Chef/Kitchen component)
// ============================================================================

import { notifyOrderStatusChange } from '@/domains/notifications/utils/notificationTriggers';
import { supabase } from '@/shared/utils/api/supabaseClient';

export const KitchenOrderCardExample = ({ order }) => {
  const markAsReady = async () => {
    // Update order in database
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'ready' })
      .eq('id', order.id);

    if (!error) {
      // Notify waiters that order is ready
      await notifyOrderStatusChange({
        restaurantId: order.restaurant_id,
        orderId: order.id,
        orderNumber: order.order_number,
        oldStatus: 'preparing',
        newStatus: 'ready',
        tableNumber: order.table_number,
      });

      toast.success('Order marked as ready! Waiters have been notified.');
    }
  };

  return (
    <Button onClick={markAsReady}>
      ✅ Mark as Ready
    </Button>
  );
};

// ============================================================================
// EXAMPLE 3: Takeaway Order Ready (Manager component)
// ============================================================================

import { notifyTakeawayReady } from '@/domains/notifications/utils/notificationTriggers';

export const TakeawayOrdersExample = ({ order }) => {
  const handleMarkReady = async () => {
    // Update order status
    await supabase
      .from('orders')
      .update({ order_status: 'ready' })
      .eq('id', order.id);

    // Notify managers to call customer
    await notifyTakeawayReady({
      restaurantId: order.restaurant_id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerPhone: order.customer_phone,
    });

    toast.success('Customer will be called shortly!');
  };

  return (
    <Button onClick={handleMarkReady}>
      📞 Mark Ready & Notify
    </Button>
  );
};

// ============================================================================
// EXAMPLE 4: Customer Feedback/Complaint (Feedback form)
// ============================================================================

import { notifyComplaint } from '@/domains/notifications/utils/notificationTriggers';

export const FeedbackFormExample = () => {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert({
        restaurant_id: restaurantId,
        order_id: orderId,
        rating,
        comment,
      })
      .select()
      .single();

    if (!error) {
      // If rating is poor (≤2), notify managers immediately
      if (rating <= 2) {
        await notifyComplaint({
          restaurantId,
          feedbackId: feedback.id,
          orderId: feedback.order_id,
          orderNumber: order.order_number,
          rating,
          comment,
          tableNumber: order.table_number,
        });
      }

      toast.success('Thank you for your feedback!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating stars */}
      {/* Comment textarea */}
      <Button type="submit">Submit Feedback</Button>
    </form>
  );
};

// ============================================================================
// EXAMPLE 5: Menu Item Stock Management (Manager component)
// ============================================================================

import { notifyOutOfStock } from '@/domains/notifications/utils/notificationTriggers';

export const MenuItemToggleExample = ({ item }) => {
  const { user, restaurantId } = useRestaurant();

  const toggleStock = async () => {
    const newStockStatus = !item.out_of_stock;

    // Update item
    await supabase
      .from('menu_items')
      .update({ out_of_stock: newStockStatus })
      .eq('id', item.id);

    // If marking as out of stock, notify managers
    if (newStockStatus) {
      await notifyOutOfStock({
        restaurantId,
        itemName: item.name,
        itemId: item.id,
        changedBy: user.id,
      });
    }

    toast.success(
      newStockStatus
        ? `${item.name} marked as out of stock`
        : `${item.name} is now available`
    );
  };

  return (
    <Button onClick={toggleStock}>
      {item.out_of_stock ? '✅ Mark Available' : '🚫 Mark Out of Stock'}
    </Button>
  );
};

// ============================================================================
// EXAMPLE 6: Payment Monitoring (Scheduled job or useEffect)
// ============================================================================

import { notifyUnpaidOrder } from '@/domains/notifications/utils/notificationTriggers';

export const useUnpaidOrderMonitor = (orders) => {
  React.useEffect(() => {
    const checkUnpaidOrders = async () => {
      const now = Date.now();

      for (const order of orders) {
        // Check if order is served but not paid
        if (order.order_status === 'served' && !order.is_paid) {
          const servedTime = new Date(order.updated_at).getTime();
          const minutesElapsed = Math.floor((now - servedTime) / 60000);

          // If more than 10 minutes, notify managers
          if (minutesElapsed > 10) {
            await notifyUnpaidOrder({
              restaurantId: order.restaurant_id,
              orderId: order.id,
              orderNumber: order.order_number,
              tableNumber: order.table_number,
              amount: order.total,
              minutesElapsed,
            });
          }
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkUnpaidOrders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [orders]);
};

// ============================================================================
// EXAMPLE 7: Staff Management (Manager component)
// ============================================================================

import { notifyNewStaffMember } from '@/domains/notifications/utils/notificationTriggers';

export const AddStaffFormExample = () => {
  const { restaurantId } = useRestaurant();

  const handleAddStaff = async (formData) => {
    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        restaurant_id: restaurantId,
        full_name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
      })
      .select()
      .single();

    if (!error) {
      // Notify other managers
      await notifyNewStaffMember({
        restaurantId,
        staffName: newUser.full_name,
        staffRole: newUser.role,
        staffId: newUser.id,
      });

      toast.success(`${newUser.full_name} has been added!`);
    }
  };

  return <form onSubmit={handleAddStaff}>{/* Form fields */}</form>;
};

// ============================================================================
// EXAMPLE 8: Payment Success (Payment gateway callback)
// ============================================================================

import { notifyPaymentCompleted } from '@/domains/notifications/utils/notificationTriggers';

export const handlePaymentSuccess = async (paymentData) => {
  // Update order
  await supabase
    .from('orders')
    .update({
      is_paid: true,
      payment_method: paymentData.method,
      payment_id: paymentData.razorpay_payment_id,
    })
    .eq('id', paymentData.order_id);

  // Notify managers
  await notifyPaymentCompleted({
    restaurantId: paymentData.restaurant_id,
    orderId: paymentData.order_id,
    orderNumber: paymentData.order_number,
    amount: paymentData.amount,
    paymentMethod: paymentData.method,
    tableNumber: paymentData.table_number,
  });

  return { success: true };
};

// ============================================================================
// EXAMPLE 9: Custom Notification (Generic use case)
// ============================================================================

import { createNotification, getRestaurantManagers } from '@/domains/notifications/utils/notificationTriggers';

export const sendCustomNotification = async ({ restaurantId, title, body }) => {
  // Get all managers
  const managerIds = await getRestaurantManagers(restaurantId);

  // Send to all managers
  for (const managerId of managerIds) {
    await createNotification({
      restaurantId,
      userId: managerId,
      type: 'system',
      title,
      body,
      data: {
        priority: 'info',
        custom: true,
      },
    });
  }
};

// Usage:
// await sendCustomNotification({
//   restaurantId: 'uuid',
//   title: 'System Maintenance',
//   body: 'The system will be down for maintenance at 2 AM tonight.'
// });

// ============================================================================
// EXAMPLE 10: Broadcast to Specific Roles
// ============================================================================

import { 
  getRestaurantStaffByRole, 
  createBulkNotifications 
} from '@/domains/notifications/utils/notificationTriggers';

export const broadcastToChefs = async ({ restaurantId, message }) => {
  // Get all chef IDs
  const chefIds = await getRestaurantStaffByRole(restaurantId, ['chef']);

  if (chefIds.length === 0) {
    return toast.error('No chefs found');
  }

  // Send notification to all chefs
  await createBulkNotifications({
    restaurantId,
    userIds: chefIds,
    type: 'staff',
    title: '👨‍🍳 Message for Chefs',
    body: message,
    data: {
      priority: 'attention',
      broadcast: true,
      target_role: 'chef',
    },
  });

  toast.success(`Message sent to ${chefIds.length} chefs`);
};

// Usage:
// await broadcastToChefs({
//   restaurantId: 'uuid',
//   message: 'Please prioritize orders from Table 8 - VIP customer'
// });
