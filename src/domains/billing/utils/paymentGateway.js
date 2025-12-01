/**
 * Payment Gateway Abstraction Layer
 * 
 * Supports multiple payment providers:
 * - Razorpay (default)
 * - PhonePe
 * - Paytm
 * 
 * Each restaurant can configure their preferred gateway.
 */

import { supabase } from '@/shared/utils/api/supabaseClient';

// Gateway provider constants
export const PAYMENT_PROVIDERS = {
  RAZORPAY: 'razorpay',
  PHONEPE: 'phonepe',
  PAYTM: 'paytm',
};

// Gateway display info
export const GATEWAY_INFO = {
  [PAYMENT_PROVIDERS.RAZORPAY]: {
    name: 'Razorpay',
    logo: '/images/razorpay-logo.svg',
    description: 'Accept cards, UPI, netbanking, wallets',
    features: ['Cards', 'UPI', 'Netbanking', 'Wallets', 'EMI'],
    checkoutType: 'popup', // Opens in popup/modal
    website: 'https://razorpay.com',
  },
  [PAYMENT_PROVIDERS.PHONEPE]: {
    name: 'PhonePe',
    logo: '/images/phonepe-logo.svg',
    description: 'PhonePe Payment Gateway',
    features: ['UPI', 'Cards', 'Netbanking', 'Wallets'],
    checkoutType: 'redirect', // Redirects to PhonePe
    website: 'https://phonepe.com/business',
  },
  [PAYMENT_PROVIDERS.PAYTM]: {
    name: 'Paytm',
    logo: '/images/paytm-logo.svg',
    description: 'Paytm Payment Gateway',
    features: ['UPI', 'Cards', 'Netbanking', 'Paytm Wallet'],
    checkoutType: 'redirect', // Redirects to Paytm
    website: 'https://business.paytm.com',
  },
};

/**
 * Get restaurant's payment configuration
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Payment configuration
 */
export const getRestaurantPaymentConfig = async (restaurantId) => {
  if (!restaurantId) {
    throw new Error('Restaurant ID is required');
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      is_active,
      payment_gateway_enabled,
      payment_provider,
      payment_settings,
      razorpay_key_id,
      phonepe_merchant_id,
      paytm_merchant_id
    `)
    .eq('id', restaurantId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Restaurant not found');
  if (!data.is_active) throw new Error('Restaurant is inactive');

  const provider = data.payment_provider || PAYMENT_PROVIDERS.RAZORPAY;
  const settings = data.payment_settings || {};

  return {
    restaurantId: data.id,
    restaurantName: data.name,
    provider,
    providerInfo: GATEWAY_INFO[provider],
    isEnabled: data.payment_gateway_enabled,
    settings: {
      currency: settings.currency || 'INR',
      ...settings,
    },
    credentials: {
      // Only expose public keys to frontend
      razorpay_key_id: data.razorpay_key_id || settings.razorpay_key_id,
      phonepe_merchant_id: data.phonepe_merchant_id || settings.phonepe_merchant_id,
      paytm_merchant_id: data.paytm_merchant_id || settings.paytm_merchant_id,
    },
  };
};

/**
 * Payment Gateway Factory
 * Creates the appropriate gateway instance based on provider
 */
export class PaymentGatewayFactory {
  static async create(restaurantId) {
    const config = await getRestaurantPaymentConfig(restaurantId);
    
    if (!config.isEnabled) {
      throw new Error('Payment gateway is not enabled for this restaurant');
    }

    switch (config.provider) {
      case PAYMENT_PROVIDERS.RAZORPAY:
        return new RazorpayGateway(config);
      case PAYMENT_PROVIDERS.PHONEPE:
        return new PhonePeGateway(config);
      case PAYMENT_PROVIDERS.PAYTM:
        return new PaytmGateway(config);
      default:
        throw new Error(`Unknown payment provider: ${config.provider}`);
    }
  }
}

/**
 * Base Payment Gateway Interface
 * All gateway implementations must extend this class
 */
class BasePaymentGateway {
  constructor(config) {
    this.config = config;
    this.provider = config.provider;
    this.restaurantId = config.restaurantId;
    this.restaurantName = config.restaurantName;
  }

  /**
   * Create a payment order
   * @param {Object} _orderData - Order details
   * @returns {Promise<Object>} Gateway-specific order data
   */
  async createOrder(_orderData) {
    throw new Error('createOrder must be implemented by gateway');
  }

  /**
   * Initialize payment checkout
   * @param {Object} _orderData - Order and gateway order data
   * @param {Object} _callbacks - Success, failure, dismiss callbacks
   */
  async initiatePayment(_orderData, _callbacks) {
    throw new Error('initiatePayment must be implemented by gateway');
  }

  /**
   * Verify payment after completion
   * @param {Object} _paymentData - Payment response data
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(_paymentData) {
    throw new Error('verifyPayment must be implemented by gateway');
  }

  /**
   * Get checkout type (popup or redirect)
   */
  getCheckoutType() {
    return GATEWAY_INFO[this.provider]?.checkoutType || 'redirect';
  }
}

/**
 * Razorpay Gateway Implementation
 */
class RazorpayGateway extends BasePaymentGateway {
  constructor(config) {
    super(config);
    this.keyId = config.credentials.razorpay_key_id;
  }

  async loadScript() {
    if (window.Razorpay) return true;
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async createOrder(orderData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.RAZORPAY,
          restaurantId: this.restaurantId,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          amount: orderData.amount,
          currency: this.config.settings.currency,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create order');
    return data;
  }

  async initiatePayment(orderData, callbacks = {}) {
    const { onSuccess, onFailure, onDismiss } = callbacks;

    const loaded = await this.loadScript();
    if (!loaded) throw new Error('Failed to load Razorpay SDK');

    // Create Razorpay order first
    const gatewayOrder = await this.createOrder(orderData);

    const options = {
      key: this.keyId || gatewayOrder.key_id,
      amount: Math.round(orderData.amount * 100),
      currency: this.config.settings.currency,
      name: this.restaurantName,
      description: `Order #${orderData.orderNumber}`,
      order_id: gatewayOrder.gateway_order_id,
      prefill: {
        name: orderData.customerName || '',
        email: orderData.customerEmail || '',
        contact: orderData.customerPhone || '',
      },
      notes: {
        order_id: orderData.orderId,
        restaurant_id: this.restaurantId,
      },
      theme: {
        color: '#F97316', // Orange theme
      },
      handler: (response) => {
        onSuccess?.({
          provider: PAYMENT_PROVIDERS.RAZORPAY,
          gateway_order_id: gatewayOrder.gateway_order_id,
          gateway_payment_id: response.razorpay_payment_id,
          gateway_signature: response.razorpay_signature,
          raw_response: response,
        });
      },
      modal: {
        ondismiss: () => onDismiss?.(),
        escape: true,
        confirm_close: true,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      onFailure?.({
        provider: PAYMENT_PROVIDERS.RAZORPAY,
        error: response.error,
      });
    });
    rzp.open();
  }

  async verifyPayment(paymentData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.RAZORPAY,
          restaurantId: this.restaurantId,
          orderId: paymentData.orderId,
          gateway_order_id: paymentData.gateway_order_id,
          gateway_payment_id: paymentData.gateway_payment_id,
          gateway_signature: paymentData.gateway_signature,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  }
}

/**
 * PhonePe Gateway Implementation
 */
class PhonePeGateway extends BasePaymentGateway {
  constructor(config) {
    super(config);
    this.merchantId = config.credentials.phonepe_merchant_id;
  }

  async createOrder(orderData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.PHONEPE,
          restaurantId: this.restaurantId,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          amount: orderData.amount,
          currency: this.config.settings.currency,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          callbackUrl: `${window.location.origin}/payment-callback`,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create PhonePe order');
    return data;
  }

  async initiatePayment(orderData, callbacks = {}) {
    const { onFailure } = callbacks;

    try {
      // Create PhonePe order
      const gatewayOrder = await this.createOrder(orderData);

      // Store callback info in sessionStorage for redirect return
      sessionStorage.setItem('payment_pending', JSON.stringify({
        provider: PAYMENT_PROVIDERS.PHONEPE,
        orderId: orderData.orderId,
        gatewayOrderId: gatewayOrder.gateway_order_id,
        timestamp: Date.now(),
      }));

      // Redirect to PhonePe payment page
      if (gatewayOrder.redirect_url) {
        window.location.href = gatewayOrder.redirect_url;
      } else {
        throw new Error('No redirect URL received from PhonePe');
      }
    } catch (error) {
      onFailure?.({
        provider: PAYMENT_PROVIDERS.PHONEPE,
        error: { description: error.message },
      });
    }
  }

  async verifyPayment(paymentData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.PHONEPE,
          restaurantId: this.restaurantId,
          orderId: paymentData.orderId,
          gateway_order_id: paymentData.gateway_order_id,
          transactionId: paymentData.transactionId,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  }
}

/**
 * Paytm Gateway Implementation
 */
class PaytmGateway extends BasePaymentGateway {
  constructor(config) {
    super(config);
    this.merchantId = config.credentials.paytm_merchant_id;
  }

  async createOrder(orderData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.PAYTM,
          restaurantId: this.restaurantId,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          amount: orderData.amount,
          currency: this.config.settings.currency,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          callbackUrl: `${window.location.origin}/payment-callback`,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create Paytm order');
    return data;
  }

  async initiatePayment(orderData, callbacks = {}) {
    const { onFailure } = callbacks;

    try {
      // Create Paytm order
      const gatewayOrder = await this.createOrder(orderData);

      // Store callback info in sessionStorage for redirect return
      sessionStorage.setItem('payment_pending', JSON.stringify({
        provider: PAYMENT_PROVIDERS.PAYTM,
        orderId: orderData.orderId,
        gatewayOrderId: gatewayOrder.gateway_order_id,
        timestamp: Date.now(),
      }));

      // Redirect to Paytm payment page
      if (gatewayOrder.redirect_url) {
        window.location.href = gatewayOrder.redirect_url;
      } else {
        throw new Error('No redirect URL received from Paytm');
      }
    } catch (error) {
      onFailure?.({
        provider: PAYMENT_PROVIDERS.PAYTM,
        error: { description: error.message },
      });
    }
  }

  async verifyPayment(paymentData) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: PAYMENT_PROVIDERS.PAYTM,
          restaurantId: this.restaurantId,
          orderId: paymentData.orderId,
          gateway_order_id: paymentData.gateway_order_id,
          transactionId: paymentData.transactionId,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  }
}

/**
 * Helper function to handle payment callback from redirect-based gateways
 * Call this on the /payment-callback page
 */
export const handlePaymentCallback = async (queryParams) => {
  const pendingPayment = sessionStorage.getItem('payment_pending');
  if (!pendingPayment) {
    throw new Error('No pending payment found');
  }

  const { orderId, gatewayOrderId } = JSON.parse(pendingPayment);
  sessionStorage.removeItem('payment_pending');

  // Get restaurant ID from order
  const { data: order } = await supabase
    .from('orders')
    .select('restaurant_id')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  const gateway = await PaymentGatewayFactory.create(order.restaurant_id);
  
  return gateway.verifyPayment({
    orderId,
    gateway_order_id: gatewayOrderId,
    transactionId: queryParams.get('transactionId') || queryParams.get('TXNID'),
    ...Object.fromEntries(queryParams),
  });
};

export default PaymentGatewayFactory;
