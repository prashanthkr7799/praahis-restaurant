/* global __ENV */
/**
 * K6 Load Test - API Endpoints
 * Tests the main Supabase API endpoints under load
 *
 * Run: k6 run load-tests/api-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// =====================================================
// CONFIGURATION
// =====================================================

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const RESTAURANT_ID = __ENV.RESTAURANT_ID || 'test-restaurant-id';

// Custom metrics
const errorRate = new Rate('errors');
const menuLoadTime = new Trend('menu_load_time');
const ordersLoadTime = new Trend('orders_load_time');
const tablesLoadTime = new Trend('tables_load_time');
const orderCreationTime = new Trend('order_creation_time');
const apiCalls = new Counter('api_calls');

// =====================================================
// TEST SCENARIOS
// =====================================================

export const options = {
  // Stages for ramping up/down virtual users
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users (steady state)
    { duration: '1m', target: 50 }, // Ramp down to 50 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],

  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.05'], // Custom error rate < 5%
    menu_load_time: ['p(95)<300'], // Menu loads in < 300ms
    orders_load_time: ['p(95)<400'], // Orders load in < 400ms
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

function supabaseGet(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  return http.get(url, { headers });
}

function supabasePost(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  return http.post(url, JSON.stringify(data), {
    headers: { ...headers, Prefer: 'return=representation' },
  });
}

// =====================================================
// TEST SCENARIOS
// =====================================================

export default function () {
  // -----------------------------------------------
  // 1. MENU ITEMS (Most frequent - customer browsing)
  // -----------------------------------------------
  group('Menu Loading', () => {
    const startTime = Date.now();

    const menuRes = supabaseGet(
      'menu_items',
      `?restaurant_id=eq.${RESTAURANT_ID}&is_available=eq.true&select=*,categories(name)`
    );

    const duration = Date.now() - startTime;
    menuLoadTime.add(duration);
    apiCalls.add(1);

    const menuCheck = check(menuRes, {
      'menu status is 200': (r) => r.status === 200,
      'menu has items': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length >= 0;
        } catch {
          return false;
        }
      },
      'menu loads under 500ms': () => duration < 500,
    });

    errorRate.add(!menuCheck);
  });

  sleep(0.5); // Brief pause between requests

  // -----------------------------------------------
  // 2. CATEGORIES
  // -----------------------------------------------
  group('Categories Loading', () => {
    const categoriesRes = supabaseGet(
      'categories',
      `?restaurant_id=eq.${RESTAURANT_ID}&is_active=eq.true&order=display_order`
    );

    apiCalls.add(1);

    const catCheck = check(categoriesRes, {
      'categories status is 200': (r) => r.status === 200,
      'categories is array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!catCheck);
  });

  sleep(0.3);

  // -----------------------------------------------
  // 3. TABLES STATUS (Staff dashboards)
  // -----------------------------------------------
  group('Tables Status', () => {
    const startTime = Date.now();

    const tablesRes = supabaseGet(
      'tables',
      `?restaurant_id=eq.${RESTAURANT_ID}&is_active=eq.true&select=*`
    );

    const duration = Date.now() - startTime;
    tablesLoadTime.add(duration);
    apiCalls.add(1);

    const tableCheck = check(tablesRes, {
      'tables status is 200': (r) => r.status === 200,
      'tables loads under 300ms': () => duration < 300,
    });

    errorRate.add(!tableCheck);
  });

  sleep(0.3);

  // -----------------------------------------------
  // 4. ACTIVE ORDERS (Kitchen/Waiter dashboards)
  // -----------------------------------------------
  group('Active Orders', () => {
    const startTime = Date.now();

    const ordersRes = supabaseGet(
      'orders',
      `?restaurant_id=eq.${RESTAURANT_ID}&order_status=in.(received,preparing,ready)&order=created_at.desc&limit=50`
    );

    const duration = Date.now() - startTime;
    ordersLoadTime.add(duration);
    apiCalls.add(1);

    const ordersCheck = check(ordersRes, {
      'orders status is 200': (r) => r.status === 200,
      'orders loads under 500ms': () => duration < 500,
    });

    errorRate.add(!ordersCheck);
  });

  sleep(0.5);

  // -----------------------------------------------
  // 5. RESTAURANT INFO (Cached, but still test)
  // -----------------------------------------------
  group('Restaurant Info', () => {
    const restaurantRes = supabaseGet('restaurants', `?id=eq.${RESTAURANT_ID}&select=*`);

    apiCalls.add(1);

    const restCheck = check(restaurantRes, {
      'restaurant status is 200': (r) => r.status === 200,
    });

    errorRate.add(!restCheck);
  });

  sleep(0.3);

  // -----------------------------------------------
  // 6. SIMULATE ORDER CREATION (10% of requests)
  // -----------------------------------------------
  if (Math.random() < 0.1) {
    group('Order Creation', () => {
      const startTime = Date.now();

      const orderData = {
        restaurant_id: RESTAURANT_ID,
        order_type: 'dine_in',
        order_status: 'pending_payment',
        payment_status: 'pending',
        items: JSON.stringify([
          { menu_item_id: 'test-item-1', quantity: 2, price: 150 },
          { menu_item_id: 'test-item-2', quantity: 1, price: 200 },
        ]),
        subtotal: 500,
        tax: 25,
        total: 525,
        order_number: `TEST-${Date.now()}`,
      };

      const orderRes = supabasePost('orders', orderData);

      const duration = Date.now() - startTime;
      orderCreationTime.add(duration);
      apiCalls.add(1);

      const orderCheck = check(orderRes, {
        'order creation status is 201': (r) => r.status === 201,
        'order created under 1s': () => duration < 1000,
      });

      errorRate.add(!orderCheck);

      // Cleanup: Delete test order
      if (orderRes.status === 201) {
        try {
          const created = JSON.parse(orderRes.body);
          if (created[0]?.id) {
            http.del(`${SUPABASE_URL}/rest/v1/orders?id=eq.${created[0].id}`, null, { headers });
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  }

  // Random sleep to simulate real user behavior
  sleep(Math.random() * 2 + 0.5);
}

// =====================================================
// LIFECYCLE HOOKS
// =====================================================

export function setup() {
  console.log('🚀 Starting Praahis API Load Test');
  console.log(`📍 Target: ${SUPABASE_URL}`);
  console.log(`🏪 Restaurant ID: ${RESTAURANT_ID}`);

  // Verify connectivity
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, { headers });
  if (healthCheck.status !== 200) {
    console.error('❌ Failed to connect to Supabase');
  } else {
    console.log('✅ Supabase connection verified');
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n🏁 Load test completed in ${duration.toFixed(2)}s`);
  console.log('📊 Check the summary above for detailed metrics');
}

// =====================================================
// CUSTOM SUMMARY
// =====================================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'],
      http_req_duration_p99: data.metrics.http_req_duration?.values?.['p(99)'],
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate,
      error_rate: data.metrics.errors?.values?.rate,
      total_requests: data.metrics.http_reqs?.values?.count,
      vus_max: data.metrics.vus_max?.values?.max,
    },
    thresholds_passed: Object.entries(data.thresholds || {})
      .filter(([, v]) => v.ok)
      .map(([k]) => k),
    thresholds_failed: Object.entries(data.thresholds || {})
      .filter(([, v]) => !v.ok)
      .map(([k]) => k),
  };

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load-tests/results/summary.json': JSON.stringify(summary, null, 2),
  };
}

// Text summary helper (k6 built-in)
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
