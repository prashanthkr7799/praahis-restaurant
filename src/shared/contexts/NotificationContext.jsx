import { useState, useEffect, useCallback } from 'react';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import { NOTIFICATION_TYPES, NotificationContext } from './notificationTypes';

/**
 * Notification Provider
 * Manages all notification state and actions
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Generate notifications from restaurant/billing data
  const generateNotificationsFromData = useCallback(async () => {
    try {
      const generatedNotifications = [];
      const now = new Date();

      // Get restaurants with expiring trials
      const { data: restaurants } = await supabaseOwner
        .from('restaurants')
        .select(`
          id, 
          name, 
          trial_ends_at, 
          is_active,
          subscriptions (
            status,
            trial_ends_at,
            current_period_end
          )
        `)
        .eq('is_active', true);

      if (restaurants) {
        restaurants.forEach(restaurant => {
          const subscription = Array.isArray(restaurant.subscriptions) 
            ? restaurant.subscriptions[0] 
            : restaurant.subscriptions;

          const trialEnd = subscription?.trial_ends_at || restaurant.trial_ends_at;
          
          if (trialEnd) {
            const trialEndDate = new Date(trialEnd);
            const daysUntilExpiry = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 0) {
              generatedNotifications.push({
                id: `trial-expired-${restaurant.id}`,
                type: NOTIFICATION_TYPES.TRIAL_EXPIRED,
                title: 'Trial Expired',
                message: `${restaurant.name}'s trial has expired`,
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                severity: 'warning',
                read: false,
                created_at: trialEnd,
                action_url: `/superadmin/restaurants/${restaurant.id}`
              });
            } else if (daysUntilExpiry <= 7) {
              generatedNotifications.push({
                id: `trial-expiring-${restaurant.id}`,
                type: NOTIFICATION_TYPES.TRIAL_EXPIRING,
                title: 'Trial Expiring Soon',
                message: `${restaurant.name}'s trial expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                severity: 'info',
                read: false,
                created_at: now.toISOString(),
                action_url: `/superadmin/restaurants/${restaurant.id}`
              });
            }
          }
        });
      }

      // Get overdue bills
      const { data: bills } = await supabaseOwner
        .from('billing')
        .select(`
          id,
          restaurant_id,
          total_amount,
          due_date,
          status,
          billing_month,
          billing_year,
          restaurants (name)
        `)
        .in('status', ['pending', 'overdue']);

      if (bills) {
        bills.forEach(bill => {
          const dueDate = new Date(bill.due_date);
          const isOverdue = dueDate < now && bill.status !== 'paid';
          const restaurantName = bill.restaurants?.name || 'Restaurant';

          if (isOverdue || bill.status === 'overdue') {
            generatedNotifications.push({
              id: `payment-overdue-${bill.id}`,
              type: NOTIFICATION_TYPES.PAYMENT_OVERDUE,
              title: 'Payment Overdue',
              message: `₹${bill.total_amount.toLocaleString('en-IN')} overdue from ${restaurantName}`,
              restaurant_id: bill.restaurant_id,
              restaurant_name: restaurantName,
              bill_id: bill.id,
              amount: bill.total_amount,
              severity: 'error',
              read: false,
              created_at: bill.due_date,
              action_url: `/superadmin/billing`
            });
          } else {
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 5 && daysUntilDue > 0) {
              generatedNotifications.push({
                id: `payment-due-${bill.id}`,
                type: NOTIFICATION_TYPES.PAYMENT_DUE,
                title: 'Payment Due Soon',
                message: `₹${bill.total_amount.toLocaleString('en-IN')} due from ${restaurantName} in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
                restaurant_id: bill.restaurant_id,
                restaurant_name: restaurantName,
                bill_id: bill.id,
                amount: bill.total_amount,
                severity: 'warning',
                read: false,
                created_at: now.toISOString(),
                action_url: `/superadmin/billing`
              });
            }
          }
        });
      }

      // Sort by created_at descending
      generatedNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      return generatedNotifications;
    } catch (error) {
      console.error('Error generating notifications:', error);
      return [];
    }
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to get from superadmin_notifications table
      const { data, error } = await supabaseOwner
        .from('superadmin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If table doesn't exist, generate notifications from data
        const generated = await generateNotificationsFromData();
        setNotifications(generated);
        setUnreadCount(generated.filter(n => !n.read).length);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fall back to generated notifications
      const generated = await generateNotificationsFromData();
      setNotifications(generated);
      setUnreadCount(generated.filter(n => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, [generateNotificationsFromData]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Update in database if using real notifications
      await supabaseOwner
        .from('superadmin_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch {
      // Ignore if table doesn't exist
    }

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await supabaseOwner
        .from('superadmin_notifications')
        .update({ read: true })
        .eq('read', false);
    } catch {
      // Ignore if table doesn't exist
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await supabaseOwner
        .from('superadmin_notifications')
        .delete()
        .eq('id', notificationId);
    } catch {
      // Ignore if table doesn't exist
    }

    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await supabaseOwner
        .from('superadmin_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    } catch {
      // Ignore if table doesn't exist
    }

    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Add new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `${notification.type}-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
