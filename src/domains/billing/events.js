/**
 * Billing Domain Events
 * 
 * Event definitions for the billing domain.
 * These events are emitted when billing-related actions occur.
 */

export const BILLING_EVENTS = {
  // Invoice events
  INVOICE_GENERATED: 'billing:invoice_generated',
  INVOICE_SENT: 'billing:invoice_sent',
  INVOICE_PAID: 'billing:invoice_paid',
  INVOICE_OVERDUE: 'billing:invoice_overdue',
  INVOICE_CANCELLED: 'billing:invoice_cancelled',
  
  // Payment events
  PAYMENT_INITIATED: 'billing:payment_initiated',
  PAYMENT_RECEIVED: 'billing:payment_received',
  PAYMENT_FAILED: 'billing:payment_failed',
  PAYMENT_REFUNDED: 'billing:payment_refunded',
  
  // Subscription events
  SUBSCRIPTION_CREATED: 'billing:subscription_created',
  SUBSCRIPTION_UPGRADED: 'billing:subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'billing:subscription_downgraded',
  SUBSCRIPTION_RENEWED: 'billing:subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'billing:subscription_cancelled',
  SUBSCRIPTION_SUSPENDED: 'billing:subscription_suspended',
  SUBSCRIPTION_REACTIVATED: 'billing:subscription_reactivated',
  
  // Trial events
  TRIAL_STARTED: 'billing:trial_started',
  TRIAL_EXPIRING: 'billing:trial_expiring',
  TRIAL_EXPIRED: 'billing:trial_expired',
  TRIAL_EXTENDED: 'billing:trial_extended',
  TRIAL_CONVERTED: 'billing:trial_converted',
};
