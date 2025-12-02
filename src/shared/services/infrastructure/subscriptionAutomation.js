import { supabaseOwner } from '@shared/services/api/ownerApi';

/**
 * Subscription Automation Service
 * Handles auto-suspension, grace periods, and renewal reminders
 */

// Constants
const GRACE_PERIOD_DAYS = 7; // Default grace period after payment due
const REMINDER_DAYS = [7, 3, 1]; // Days before expiry to send reminders

/**
 * Check and process all subscriptions for automation
 * Should be called periodically (e.g., daily via cron job or on dashboard load)
 */
export const processSubscriptionAutomation = async () => {
  const results = {
    checked: 0,
    suspended: 0,
    graceStarted: 0,
    reminders: 0,
    errors: []
  };

  try {
    const now = new Date();

    // Get all active restaurants with their subscriptions
    const { data: restaurants, error: fetchError } = await supabaseOwner
      .from('restaurants')
      .select(`
        id,
        name,
        email,
        is_active,
        trial_ends_at,
        subscriptions (
          id,
          status,
          trial_ends_at,
          current_period_end,
          end_date,
          plan_name,
          grace_period_end
        ),
        billing (
          id,
          status,
          due_date,
          grace_end_date,
          total_amount,
          billing_month,
          billing_year
        )
      `)
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    for (const restaurant of restaurants || []) {
      results.checked++;
      
      try {
        const subscription = Array.isArray(restaurant.subscriptions) 
          ? restaurant.subscriptions[0] 
          : restaurant.subscriptions;

        const pendingBills = (restaurant.billing || [])
          .filter(b => b.status === 'pending' || b.status === 'overdue');

        // Check for expired trial
        const trialEnd = subscription?.trial_ends_at || restaurant.trial_ends_at;
        if (trialEnd && subscription?.status === 'trial') {
          const trialEndDate = new Date(trialEnd);
          if (trialEndDate < now) {
            // Trial has expired - check if there's a paid subscription
            const hasActivePlan = subscription?.plan_name && subscription.plan_name !== 'trial';
            
            if (!hasActivePlan) {
              // Suspend the restaurant
              await suspendRestaurant(restaurant.id, 'Trial expired without upgrade');
              results.suspended++;
              continue;
            }
          }
        }

        // Check for overdue payments
        for (const bill of pendingBills) {
          const dueDate = new Date(bill.due_date);
          
          if (dueDate < now) {
            // Payment is overdue
            const gracePeriodEnd = bill.grace_end_date 
              ? new Date(bill.grace_end_date)
              : addDays(dueDate, GRACE_PERIOD_DAYS);

            if (!bill.grace_end_date) {
              // Start grace period
              await startGracePeriod(bill.id, gracePeriodEnd);
              results.graceStarted++;
            } else if (gracePeriodEnd < now) {
              // Grace period expired - suspend
              await suspendRestaurant(restaurant.id, 'Payment overdue - grace period expired');
              results.suspended++;
              break;
            }
          }
        }

        // Check for upcoming subscription renewals
        const periodEnd = subscription?.current_period_end || subscription?.end_date;
        if (periodEnd && subscription?.status === 'active') {
          const endDate = new Date(periodEnd);
          const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

          if (REMINDER_DAYS.includes(daysUntilExpiry)) {
            // Send renewal reminder
            await sendRenewalReminder(restaurant, daysUntilExpiry);
            results.reminders++;
          }
        }

      } catch (restaurantError) {
        results.errors.push({
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          error: restaurantError.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing subscription automation:', error);
    throw error;
  }
};

/**
 * Suspend a restaurant due to payment issues
 */
export const suspendRestaurant = async (restaurantId, reason) => {
  try {
    // Update restaurant status
    const { error: restaurantError } = await supabaseOwner
      .from('restaurants')
      .update({
        is_active: false,
        accepting_orders: false,
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId);

    if (restaurantError) throw restaurantError;

    // Update subscription status
    const { error: subError } = await supabaseOwner
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', restaurantId);

    if (subError) throw subError;

    // Log the suspension
    await logActivity(restaurantId, 'subscription_suspended', reason);

    // Create notification
    await createNotification({
      type: 'subscription_suspended',
      restaurant_id: restaurantId,
      title: 'Restaurant Suspended',
      message: `Restaurant suspended: ${reason}`,
      severity: 'error'
    });

    return true;
  } catch (error) {
    console.error('Error suspending restaurant:', error);
    throw error;
  }
};

/**
 * Reactivate a suspended restaurant
 */
export const reactivateRestaurant = async (restaurantId) => {
  try {
    // Update restaurant status
    const { error: restaurantError } = await supabaseOwner
      .from('restaurants')
      .update({
        is_active: true,
        accepting_orders: true,
        suspended_at: null,
        suspension_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId);

    if (restaurantError) throw restaurantError;

    // Update subscription status
    const { error: subError } = await supabaseOwner
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', restaurantId);

    if (subError) throw subError;

    // Log the reactivation
    await logActivity(restaurantId, 'subscription_reactivated', 'Restaurant reactivated');

    return true;
  } catch (error) {
    console.error('Error reactivating restaurant:', error);
    throw error;
  }
};

/**
 * Start grace period for an overdue bill
 */
export const startGracePeriod = async (billingId, graceEndDate) => {
  try {
    const { error } = await supabaseOwner
      .from('billing')
      .update({
        status: 'overdue',
        grace_end_date: graceEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error starting grace period:', error);
    throw error;
  }
};

/**
 * Send renewal reminder notification
 */
export const sendRenewalReminder = async (restaurant, daysUntilExpiry) => {
  try {
    await createNotification({
      type: 'subscription_expiring',
      restaurant_id: restaurant.id,
      title: 'Subscription Expiring Soon',
      message: `${restaurant.name}'s subscription expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
      severity: 'warning'
    });

    // Here you could also integrate with email service
    // await sendEmail(restaurant.email, 'Subscription Renewal Reminder', ...);

    return true;
  } catch (error) {
    console.error('Error sending renewal reminder:', error);
    throw error;
  }
};

/**
 * Check if a restaurant should be auto-suspended
 */
export const checkAutoSuspension = async (restaurantId) => {
  try {
    const { data: bills, error } = await supabaseOwner
      .from('billing')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'overdue');

    if (error) throw error;

    const now = new Date();
    
    for (const bill of bills || []) {
      if (bill.grace_end_date) {
        const graceEnd = new Date(bill.grace_end_date);
        if (graceEnd < now) {
          return {
            shouldSuspend: true,
            reason: `Overdue payment for ${getMonthName(bill.billing_month)} ${bill.billing_year}`,
            bill
          };
        }
      }
    }

    return { shouldSuspend: false };
  } catch (error) {
    console.error('Error checking auto suspension:', error);
    throw error;
  }
};

/**
 * Process payment and update subscription
 */
export const processPaymentAndUpdateSubscription = async (billingId, paymentDetails) => {
  try {
    // Update billing status
    const { data: bill, error: billError } = await supabaseOwner
      .from('billing')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentDetails.method || 'manual',
        transaction_id: paymentDetails.transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId)
      .select('restaurant_id, total_amount')
      .single();

    if (billError) throw billError;

    // Check if restaurant was suspended and should be reactivated
    const { data: restaurant } = await supabaseOwner
      .from('restaurants')
      .select('is_active, suspended_at')
      .eq('id', bill.restaurant_id)
      .single();

    if (restaurant && !restaurant.is_active && restaurant.suspended_at) {
      // Check if all pending bills are now paid
      const { data: pendingBills } = await supabaseOwner
        .from('billing')
        .select('id')
        .eq('restaurant_id', bill.restaurant_id)
        .in('status', ['pending', 'overdue']);

      if (!pendingBills || pendingBills.length === 0) {
        // Reactivate the restaurant
        await reactivateRestaurant(bill.restaurant_id);
      }
    }

    // Log the payment
    await logActivity(bill.restaurant_id, 'payment_received', `Payment of ₹${bill.total_amount} received`);

    // Create notification
    await createNotification({
      type: 'payment_received',
      restaurant_id: bill.restaurant_id,
      title: 'Payment Received',
      message: `Payment of ₹${bill.total_amount.toLocaleString('en-IN')} received`,
      severity: 'success'
    });

    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Get subscription status for a restaurant
 */
export const getSubscriptionStatus = async (restaurantId) => {
  try {
    const { data, error } = await supabaseOwner
      .from('restaurants')
      .select(`
        id,
        name,
        is_active,
        trial_ends_at,
        suspended_at,
        suspension_reason,
        subscriptions (
          id,
          status,
          plan_name,
          trial_ends_at,
          current_period_start,
          current_period_end,
          grace_period_end
        ),
        billing (
          id,
          status,
          due_date,
          grace_end_date,
          total_amount,
          billing_month,
          billing_year
        )
      `)
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    const subscription = Array.isArray(data.subscriptions) 
      ? data.subscriptions[0] 
      : data.subscriptions;

    const pendingBills = (data.billing || [])
      .filter(b => b.status === 'pending' || b.status === 'overdue');

    const overdueBills = pendingBills.filter(b => {
      const dueDate = new Date(b.due_date);
      return dueDate < new Date();
    });

    const now = new Date();
    const trialEnd = subscription?.trial_ends_at || data.trial_ends_at;
    const trialDaysRemaining = trialEnd 
      ? Math.max(0, Math.ceil((new Date(trialEnd) - now) / (1000 * 60 * 60 * 24)))
      : null;

    const periodEnd = subscription?.current_period_end;
    const subscriptionDaysRemaining = periodEnd
      ? Math.max(0, Math.ceil((new Date(periodEnd) - now) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      restaurant: {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
        isSuspended: !!data.suspended_at,
        suspensionReason: data.suspension_reason
      },
      subscription: {
        status: subscription?.status || 'none',
        plan: subscription?.plan_name || 'none',
        trialDaysRemaining,
        subscriptionDaysRemaining,
        inGracePeriod: subscription?.grace_period_end && new Date(subscription.grace_period_end) > now
      },
      billing: {
        pendingCount: pendingBills.length,
        overdueCount: overdueBills.length,
        totalPending: pendingBills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0),
        totalOverdue: overdueBills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0)
      }
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

// Helper functions
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

const logActivity = async (restaurantId, action, description) => {
  try {
    await supabaseOwner
      .from('audit_trail')
      .insert({
        entity_type: 'subscription',
        entity_id: restaurantId,
        action,
        description,
        severity: 'info',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const createNotification = async (notification) => {
  try {
    await supabaseOwner
      .from('superadmin_notifications')
      .insert({
        ...notification,
        read: false,
        created_at: new Date().toISOString()
      });
  } catch {
    // Ignore if table doesn't exist - expected in some environments
  }
};

export default {
  processSubscriptionAutomation,
  suspendRestaurant,
  reactivateRestaurant,
  startGracePeriod,
  sendRenewalReminder,
  checkAutoSuspension,
  processPaymentAndUpdateSubscription,
  getSubscriptionStatus
};
