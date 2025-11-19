// Razorpay Integration Helper - Multi-Tenant Support
// Each restaurant has its own Razorpay credentials

import { supabase } from '@/shared/utils/api/supabaseClient';

// Fallback to env variable for backward compatibility
const FALLBACK_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

/**
 * Fetch restaurant-specific Razorpay configuration from payment_settings JSONB
 * @param {string} restaurantId - The restaurant UUID
 * @returns {Promise<Object>} Payment configuration including key_id and settings
 */
export const getRestaurantPaymentConfig = async (restaurantId) => {
  if (!restaurantId) {
    throw new Error('Restaurant ID is required to fetch payment configuration');
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('payment_settings, payment_gateway_enabled, name, is_active, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('Error fetching restaurant payment config:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Restaurant not found');
    }

    if (!data.is_active) {
      throw new Error('This restaurant is currently inactive');
    }

    // Extract payment settings from JSONB column
    const paymentSettings = data.payment_settings || {};
    
    // Check if payment gateway is enabled
    if (!data.payment_gateway_enabled && !paymentSettings.razorpay_key_id) {
      // Using fallback platform key (demo/test mode)
      if (!FALLBACK_RAZORPAY_KEY_ID) {
        throw new Error('Payment gateway is not enabled for this restaurant. Please contact restaurant management.');
      }
      
      return {
        razorpay_key_id: FALLBACK_RAZORPAY_KEY_ID,
        payment_settings: {
          currency: 'INR',
          accepted_methods: ['card', 'netbanking', 'wallet', 'upi'],
        },
        restaurant_name: data.name,
        is_fallback: true,
      };
    }

  // Use restaurant-specific keys from payment_settings JSONB, else fallback to top-level columns
  const razorpayKeyId = paymentSettings.razorpay_key_id || data.razorpay_key_id;
    
    if (!razorpayKeyId) {
      // If payment_gateway_enabled but no key, use fallback
      if (FALLBACK_RAZORPAY_KEY_ID) {
        console.warn(`Restaurant ${restaurantId} has payment enabled but no key configured, using fallback`);
        return {
          razorpay_key_id: FALLBACK_RAZORPAY_KEY_ID,
          payment_settings: {
            currency: paymentSettings.currency || 'INR',
            accepted_methods: paymentSettings.accepted_methods || ['card', 'netbanking', 'wallet', 'upi'],
          },
          restaurant_name: data.name,
          is_fallback: true,
        };
      }
      throw new Error('Payment credentials not configured for this restaurant');
    }

    return {
      razorpay_key_id: razorpayKeyId,
      // Prefer JSONB secrets if present, else top-level columns (server-side only usage)
      razorpay_key_secret: paymentSettings.razorpay_key_secret || data.razorpay_key_secret,
      razorpay_webhook_secret: paymentSettings.razorpay_webhook_secret || data.razorpay_webhook_secret,
      payment_settings: {
        currency: paymentSettings.currency || 'INR',
        accepted_methods: paymentSettings.accepted_methods || ['card', 'netbanking', 'wallet', 'upi'],
        auto_capture: paymentSettings.auto_capture !== false, // Default true
        retry_enabled: paymentSettings.retry_enabled || false,
      },
      restaurant_name: data.name,
      is_fallback: false,
    };
  } catch (err) {
    console.error('Error fetching payment config:', err);
    throw err;
  }
};

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if script already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment with restaurant-specific credentials
 * @param {Object} orderData - Order details including restaurantId
 * @param {Object} callbacks - Success, failure, and dismiss handlers
 */
export const initializeRazorpayPayment = async (orderData, callbacks = {}) => {
  const { onSuccess, onFailure, onDismiss } = callbacks;

  try {
    // Validate required data
    if (!orderData.restaurantId) {
      throw new Error('Restaurant ID is required for payment processing');
    }

    // Fetch restaurant-specific payment configuration
    const paymentConfig = await getRestaurantPaymentConfig(orderData.restaurantId);

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Payment gateway failed to load. Please check your internet connection.');
    }

    // Validate amount (paise) to avoid Razorpay 400s
    const amountPaise = Math.round(Number(orderData.total) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new Error('Invalid payment amount. Amount must be at least ₹1.00');
    }

    console.log('💳 Initializing Razorpay Payment:', {
      key: paymentConfig.razorpay_key_id,
      amount: amountPaise,
      amountINR: orderData.total,
      currency: paymentConfig.payment_settings?.currency || 'INR',
      restaurant: paymentConfig.restaurant_name,
      isFallback: paymentConfig.is_fallback,
    });

    // Create Razorpay order server-side for proper payment flow
    // NOTE: Skipping server-side order creation for now - using direct payment
    // This works in Razorpay test mode without pre-created order_id
    let razorpayOrderId = null;
    
    // TEMPORARY: Comment out Edge Function call to test direct payment
    /*
    try {
      console.log('📝 Creating Razorpay order server-side...');
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          restaurantId: orderData.restaurantId,
          amount: orderData.total,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          currency: paymentConfig.payment_settings?.currency || 'INR',
        },
      });

      if (orderError) {
        console.error('Failed to create Razorpay order:', orderError);
      } else if (orderResponse?.razorpay_order_id) {
        razorpayOrderId = orderResponse.razorpay_order_id;
        console.log('✅ Razorpay order created:', razorpayOrderId);
      }
    } catch (orderErr) {
      console.warn('Order creation failed:', orderErr);
    }
    */
    
    console.log('Using direct payment (no server-side order) - works in test mode');

    // Razorpay options with restaurant-specific key
    const options = {
      key: paymentConfig.razorpay_key_id,
      amount: amountPaise, // Convert to paise
      currency: paymentConfig.payment_settings?.currency || 'INR',
      name: paymentConfig.restaurant_name || orderData.restaurantName || 'Restaurant',
      description: `Order #${orderData.orderNumber || orderData.orderId}`,
      ...(razorpayOrderId && { order_id: razorpayOrderId }), // Add order_id if created
      prefill: {
        name: orderData.customerName || '',
        email: orderData.customerEmail || '',
        contact: orderData.customerPhone || '',
      },
      notes: {
        order_id: orderData.orderId,
        table_number: orderData.tableNumber,
        restaurant_id: orderData.restaurantId,
      },
      theme: {
        color: '#f97316', // Orange color matching your theme
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: function (response) {
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        }
      },
    };

    // Add payment method preferences if specified
    if (paymentConfig.payment_settings?.accepted_methods) {
      // Razorpay will show only these methods
      // Note: This requires specific Razorpay plan
    }

  const razorpayInstance = new window.Razorpay(options);

    razorpayInstance.on('payment.failed', function (response) {
      const err = response?.error || {};
      
      // Log everything for debugging
      console.error('❌ Razorpay Payment Failed - FULL DETAILS:', {
        code: err.code,
        description: err.description,
        reason: err.reason,
        source: err.source,
        step: err.step,
        metadata: err.metadata,
        fullResponse: JSON.stringify(response, null, 2),
      });
      
      // Show alert on mobile for debugging
      if (typeof window !== 'undefined' && window.alert) {
        alert(`Payment Failed!\nCode: ${err.code}\nReason: ${err.reason || err.description}\nStep: ${err.step}`);
      }
      
      // Provide clearer message to UI
      const friendly = err.description || err.reason || 'Payment failed. Please try another method or test card.';
      if (onFailure) {
        onFailure({
          code: err.code,
          description: friendly,
          source: err.source,
          step: err.step,
          reason: err.reason,
          metadata: err.metadata,
          fullError: err,
        });
      }
    });

    console.log('🚀 Opening Razorpay checkout modal...');
    try {
      razorpayInstance.open();
      console.log('✅ Razorpay modal opened successfully');
    } catch (openErr) {
      console.error('❌ Failed to open Razorpay modal:', openErr);
      alert(`Failed to open payment modal: ${openErr.message}`);
      throw openErr;
    }
  } catch (err) {
    console.error('❌ Error initializing payment:', err);
    alert(`Payment initialization error: ${err.message}`);
    if (onFailure) {
      onFailure(err);
    } else {
      throw err;
    }
  }
};

// Verify payment signature (this should be done on server, but for demo we'll show the logic)
export const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  // In production, this verification MUST happen on the server
  // This is just for demonstration
  // Never expose your Razorpay secret key in frontend!
  
  
  return {
    isValid: true, // In real app, verify using HMAC SHA256
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  };
};

/**
 * Extract Razorpay payment keys from restaurant's payment_settings
 * Utility function for server-side/webhook use
 * @param {string} restaurantId - The restaurant UUID
 * @returns {Promise<Object>} Payment keys (key_id, key_secret, webhook_secret)
 */
export const getRestaurantPaymentKeys = async (restaurantId) => {
  if (!restaurantId) {
    throw new Error('Restaurant ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('payment_settings, payment_gateway_enabled')
      .eq('id', restaurantId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Restaurant not found');

    const settings = data.payment_settings || {};

    return {
      razorpay_key_id: settings.razorpay_key_id || null,
      razorpay_key_secret: settings.razorpay_key_secret || null,
      razorpay_webhook_secret: settings.razorpay_webhook_secret || null,
      payment_gateway_enabled: data.payment_gateway_enabled || false,
    };
  } catch (err) {
    console.error('Error fetching payment keys:', err);
    throw err;
  }
};

// Format amount for display
export const formatRazorpayAmount = (amountInPaise) => {
  return (amountInPaise / 100).toFixed(2);
};

// Test card details for Razorpay test mode
export const getTestCardDetails = () => {
  return {
    cards: [
      {
        number: '4111 1111 1111 1111',
        name: 'Visa (India) - Success',
        cvv: '123',
        expiry: '12/25',
        description: 'Indian domestic Visa test card (use OTP 123456).',
      },
      {
        number: '5104 0600 0000 0008',
        name: 'MasterCard (India) - Success',
        cvv: '123',
        expiry: '12/25',
        description: 'Indian domestic MasterCard test card (use OTP 123456).',
      },
      {
        number: '4000 0000 0000 0002',
        name: 'Failure Card (simulate decline)',
        cvv: '123',
        expiry: '12/25',
        description: 'Always fails. Use to test error handling.',
      },
    ],
    upi: {
      id: 'success@razorpay',
      description: 'Use this UPI ID for successful test payments',
    },
    netbanking: {
      bank: 'HDFC Bank',
      description: 'Select HDFC Bank for successful test payments',
    },
  };
};

export default {
  getRestaurantPaymentConfig,
  getRestaurantPaymentKeys,
  loadRazorpayScript,
  initializeRazorpayPayment,
  verifyPaymentSignature,
  formatRazorpayAmount,
  getTestCardDetails,
};
