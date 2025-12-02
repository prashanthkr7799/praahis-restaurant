/**
 * Razorpay Payment Helper for Praahis Unified Subscription
 * Handles ₹35,000 monthly subscription + ₹5,000 setup fee
 */

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const MONTHLY_PRICE = 35000; // ₹35,000
const SETUP_FEE = 5000; // ₹5,000

/**
 * Load Razorpay script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order for subscription payment
 * @param {Object} params - Payment parameters
 * @param {string} params.restaurantId - Restaurant ID
 * @param {string} params.paymentType - 'monthly_subscription' | 'setup_fee' | 'renewal'
 * @param {string} params.restaurantName - Restaurant name for receipt
 * @param {string} params.email - Customer email
 * @param {string} params.phone - Customer phone
 * @returns {Promise<Object>} Razorpay order details
 */
export const createSubscriptionOrder = async ({
  restaurantId,
  paymentType,
  restaurantName,
  email,
  phone
}) => {
  try {
    // Determine amount based on payment type
    const amount = paymentType === 'setup_fee' ? SETUP_FEE : MONTHLY_PRICE;

    // Create order via your backend API
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `${paymentType}_${restaurantId}_${Date.now()}`,
        notes: {
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          payment_type: paymentType,
          email,
          phone
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    const order = await response.json();
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Open Razorpay checkout
 * @param {Object} params - Checkout parameters
 * @param {Object} params.order - Razorpay order object
 * @param {string} params.restaurantName - Restaurant name
 * @param {string} params.email - Customer email
 * @param {string} params.phone - Customer phone
 * @param {Function} params.onSuccess - Success callback
 * @param {Function} params.onFailure - Failure callback
 */
export const openRazorpayCheckout = async ({
  order,
  restaurantName,
  email,
  phone,
  onSuccess,
  onFailure
}) => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available');
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Praahis',
      description: `${order.notes.payment_type === 'setup_fee' ? 'Setup Fee' : 'Monthly Subscription'} - ${restaurantName}`,
      order_id: order.id,
      prefill: {
        name: restaurantName,
        email: email,
        contact: phone
      },
      theme: {
        color: '#EA580C' // Orange-600
      },
      modal: {
        ondismiss: () => {
          if (onFailure) {
            onFailure(new Error('Payment cancelled by user'));
          }
        }
      },
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              restaurant_id: order.notes.restaurant_id,
              payment_type: order.notes.payment_type,
              amount: order.amount / 100 // Convert back to rupees
            })
          });

          if (!verifyResponse.ok) {
            throw new Error('Payment verification failed');
          }

          const verifyData = await verifyResponse.json();

          if (onSuccess) {
            onSuccess(verifyData);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          if (onFailure) {
            onFailure(error);
          }
        }
      }
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    if (onFailure) {
      onFailure(error);
    }
  }
};

/**
 * Process subscription payment (all-in-one function)
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Payment result
 */
export const processSubscriptionPayment = ({
  restaurantId,
  restaurantName,
  email,
  phone,
  paymentType = 'monthly_subscription'
}) => {
  return new Promise((resolve, reject) => {
    // Create order
    createSubscriptionOrder({
      restaurantId,
      paymentType,
      restaurantName,
      email,
      phone
    })
      .then(order => {
        // Open checkout
        return openRazorpayCheckout({
          order,
          restaurantName,
          email,
          phone,
          onSuccess: (data) => {
            resolve({
              success: true,
              payment_id: data.payment_id,
              order_id: data.order_id,
              subscription_id: data.subscription_id,
              new_end_date: data.new_end_date
            });
          },
          onFailure: (error) => {
            reject(error);
          }
        });
      })
      .catch(error => {
        reject(error);
      });
  });
};

/**
 * Get payment amount based on type
 */
export const getPaymentAmount = (paymentType) => {
  return paymentType === 'setup_fee' ? SETUP_FEE : MONTHLY_PRICE;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default {
  loadRazorpayScript,
  createSubscriptionOrder,
  openRazorpayCheckout,
  processSubscriptionPayment,
  getPaymentAmount,
  formatCurrency,
  MONTHLY_PRICE,
  SETUP_FEE
};
