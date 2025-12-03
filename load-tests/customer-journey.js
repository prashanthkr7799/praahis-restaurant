/* global __ENV, __VU */
/**
 * K6 Load Test - Customer Order Journey
 * Simulates complete customer flow: Browse → Add to Cart → Checkout → Payment
 *
 * Run: k6 run load-tests/customer-journey.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// =====================================================
// CONFIGURATION
// =====================================================

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const RESTAURANT_ID = __ENV.RESTAURANT_ID || 'test-restaurant-id';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

// Custom metrics
const journeyCompletionRate = new Rate('journey_completed');
const journeyDuration = new Trend('journey_duration');
const cartAddTime = new Trend('cart_add_time');
const checkoutTime = new Trend('checkout_time');
const customersServed = new Counter('customers_served');

// =====================================================
// TEST OPTIONS
// =====================================================

export const options = {
  scenarios: {
    // Lunch rush simulation
    lunch_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 }, // Ramp up (pre-lunch)
        { duration: '5m', target: 80 }, // Peak lunch (12-1pm simulation)
        { duration: '3m', target: 50 }, // Post-lunch
        { duration: '2m', target: 10 }, // Cool down
      ],
      gracefulRampDown: '30s',
    },
  },

  thresholds: {
    journey_completed: ['rate>0.90'], // 90% of journeys should complete
    journey_duration: ['p(95)<60000'], // 95% complete in < 60s
    http_req_duration: ['p(95)<800'], // API calls < 800ms
    http_req_failed: ['rate<0.02'], // < 2% failure rate
  },
};

// =====================================================
// API HELPERS
// =====================================================

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

function supabaseGet(endpoint) {
  return http.get(`${SUPABASE_URL}/rest/v1/${endpoint}`, { headers });
}

function supabasePost(endpoint, data) {
  return http.post(`${SUPABASE_URL}/rest/v1/${endpoint}`, JSON.stringify(data), {
    headers: { ...headers, Prefer: 'return=representation' },
  });
}

// =====================================================
// CUSTOMER JOURNEY SIMULATION
// =====================================================

export default function () {
  const journeyStart = Date.now();
  let journeyCompleted = false;
  let orderCreated = null;

  try {
    // -----------------------------------------------
    // STEP 1: Customer scans QR and loads table page
    // -----------------------------------------------
    group('1. Scan QR & Load Table', () => {
      // Load restaurant info
      const restaurantRes = supabaseGet(
        `restaurants?id=eq.${RESTAURANT_ID}&select=id,name,slug,settings`
      );
      check(restaurantRes, { 'restaurant loaded': (r) => r.status === 200 });

      // Load table info
      const tableRes = supabaseGet(
        `tables?restaurant_id=eq.${RESTAURANT_ID}&is_active=eq.true&limit=1`
      );
      check(tableRes, { 'table loaded': (r) => r.status === 200 });

      // Simulate page render time
      sleep(randomIntBetween(1, 3));
    });

    // -----------------------------------------------
    // STEP 2: Browse menu and categories
    // -----------------------------------------------
    let menuItems = [];
    group('2. Browse Menu', () => {
      // Load categories
      const catRes = supabaseGet(
        `categories?restaurant_id=eq.${RESTAURANT_ID}&is_active=eq.true&order=display_order`
      );
      check(catRes, { 'categories loaded': (r) => r.status === 200 });

      // Load menu items
      const menuRes = supabaseGet(
        `menu_items?restaurant_id=eq.${RESTAURANT_ID}&is_available=eq.true&select=*`
      );
      check(menuRes, { 'menu loaded': (r) => r.status === 200 });

      try {
        menuItems = JSON.parse(menuRes.body) || [];
      } catch {
        menuItems = [];
      }

      // Customer browses menu (variable time)
      sleep(randomIntBetween(5, 15));
    });

    // -----------------------------------------------
    // STEP 3: Add items to cart
    // -----------------------------------------------
    let cartItems = [];
    group('3. Add to Cart', () => {
      const addStart = Date.now();

      // Customer adds 2-5 items
      const itemCount = randomIntBetween(2, 5);

      for (let i = 0; i < itemCount && i < menuItems.length; i++) {
        const item = menuItems[i] || { id: `item-${i}`, name: `Item ${i}`, price: 100 + i * 50 };
        const quantity = randomIntBetween(1, 3);

        cartItems.push({
          menu_item_id: item.id,
          name: item.name || `Item ${i}`,
          quantity: quantity,
          price: item.price || 100,
          total: (item.price || 100) * quantity,
        });

        // Brief pause between adding items
        sleep(randomIntBetween(1, 3));
      }

      cartAddTime.add(Date.now() - addStart);

      check(cartItems, { 'cart has items': (items) => items.length > 0 });
    });

    // -----------------------------------------------
    // STEP 4: Review cart and proceed to checkout
    // -----------------------------------------------
    let orderTotal = 0;
    group('4. Review Cart', () => {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
      const tax = Math.round(subtotal * 0.05); // 5% tax
      orderTotal = subtotal + tax;

      // Customer reviews cart
      sleep(randomIntBetween(2, 5));
    });

    // -----------------------------------------------
    // STEP 5: Create order (checkout)
    // -----------------------------------------------
    group('5. Checkout - Create Order', () => {
      const checkoutStart = Date.now();

      const orderData = {
        restaurant_id: RESTAURANT_ID,
        order_type: 'dine_in',
        order_status: 'pending_payment',
        payment_status: 'pending',
        items: JSON.stringify(cartItems),
        subtotal: orderTotal - Math.round(orderTotal * 0.05),
        tax: Math.round(orderTotal * 0.05),
        total: orderTotal,
        order_number: `K6-${Date.now()}-${__VU}`,
        customer_name: `Test Customer ${__VU}`,
      };

      const orderRes = supabasePost('orders', orderData);

      const orderCheck = check(orderRes, {
        'order created': (r) => r.status === 201,
      });

      if (orderCheck) {
        try {
          const created = JSON.parse(orderRes.body);
          orderCreated = created[0];
        } catch {
          // Ignore parse errors
        }
      }

      checkoutTime.add(Date.now() - checkoutStart);
    });

    // -----------------------------------------------
    // STEP 6: Payment (simulated)
    // -----------------------------------------------
    group('6. Payment', () => {
      if (!orderCreated) {
        return;
      }

      // Simulate payment processing time
      sleep(randomIntBetween(2, 5));

      // Create payment record
      const paymentData = {
        order_id: orderCreated.id,
        restaurant_id: RESTAURANT_ID,
        amount: orderTotal,
        payment_method: randomItem(['razorpay', 'upi', 'card']),
        status: 'paid',
        transaction_id: `K6-TXN-${Date.now()}`,
      };

      const paymentRes = supabasePost('payments', paymentData);
      check(paymentRes, { 'payment recorded': (r) => r.status === 201 || r.status === 200 });

      // Update order status
      const updateRes = http.patch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderCreated.id}`,
        JSON.stringify({
          order_status: 'received',
          payment_status: 'paid',
        }),
        { headers: { ...headers, Prefer: 'return=representation' } }
      );

      check(updateRes, { 'order updated': (r) => r.status === 200 });

      journeyCompleted = true;
      customersServed.add(1);
    });

    // -----------------------------------------------
    // STEP 7: Order tracking (brief check)
    // -----------------------------------------------
    group('7. Order Tracking', () => {
      if (!orderCreated) return;

      // Customer checks order status
      const statusRes = supabaseGet(`orders?id=eq.${orderCreated.id}&select=*`);
      check(statusRes, { 'order status checked': (r) => r.status === 200 });

      sleep(randomIntBetween(1, 3));
    });
  } catch (error) {
    console.error(`Journey failed: ${error.message}`);
  } finally {
    // Record journey metrics
    journeyCompletionRate.add(journeyCompleted);
    journeyDuration.add(Date.now() - journeyStart);

    // Cleanup: Delete test order to avoid polluting database
    if (orderCreated?.id) {
      try {
        http.del(`${SUPABASE_URL}/rest/v1/payments?order_id=eq.${orderCreated.id}`, null, {
          headers,
        });
        http.del(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderCreated.id}`, null, { headers });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // Think time before next journey
  sleep(randomIntBetween(5, 15));
}

// =====================================================
// LIFECYCLE HOOKS
// =====================================================

export function setup() {
  console.log('🍽️  Starting Praahis Customer Journey Load Test');
  console.log(`📍 API: ${SUPABASE_URL}`);
  console.log(`🏪 Restaurant: ${RESTAURANT_ID}`);
  console.log('🚀 Simulating lunch rush traffic pattern');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = ((Date.now() - data.startTime) / 1000 / 60).toFixed(2);
  console.log(`\n🏁 Customer journey test completed in ${duration} minutes`);
}
