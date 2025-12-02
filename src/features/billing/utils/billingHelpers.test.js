/**
 * Billing Utilities Tests
 * Comprehensive tests for billing calculations and data processing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatINR,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  getDateRangeFilter,
  filterByDate,
  filterByAmount,
  filterByMethod,
  filterByStatus,
  calculateRevenueStats,
  exportPaymentsToCSV,
} from './billingUtils';

describe('formatINR', () => {
  it('should format zero correctly', () => {
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('should format positive integer', () => {
    const result = formatINR(1000);
    expect(result).toContain('1,000');
    expect(result).toContain('₹');
  });

  it('should format decimal values', () => {
    const result = formatINR(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('should format large numbers with Indian comma style', () => {
    const result = formatINR(100000);
    expect(result).toContain('1,00,000');
  });

  it('should handle null', () => {
    expect(formatINR(null)).toBe('₹0.00');
  });

  it('should handle undefined', () => {
    expect(formatINR(undefined)).toBe('₹0.00');
  });

  it('should format negative numbers', () => {
    const result = formatINR(-500);
    expect(result).toContain('500');
  });
});

describe('calculateTax', () => {
  it('should calculate 5% tax on positive amount', () => {
    expect(calculateTax(100)).toBe(5);
  });

  it('should calculate tax on large amount', () => {
    expect(calculateTax(1000)).toBe(50);
  });

  it('should return 0 for zero subtotal', () => {
    expect(calculateTax(0)).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(calculateTax(null)).toBe(0);
  });

  it('should return 0 for undefined', () => {
    expect(calculateTax(undefined)).toBe(0);
  });

  it('should return 0 for negative subtotal', () => {
    expect(calculateTax(-100)).toBe(0);
  });

  it('should handle decimal amounts', () => {
    expect(calculateTax(99.99)).toBeCloseTo(4.9995, 2);
  });
});

describe('calculateDiscount', () => {
  it('should return discount from order', () => {
    expect(calculateDiscount({ discount: 50 })).toBe(50);
  });

  it('should return 0 if no discount', () => {
    expect(calculateDiscount({})).toBe(0);
  });

  it('should return 0 for null order', () => {
    expect(calculateDiscount(null)).toBe(0);
  });

  it('should return 0 for undefined order', () => {
    expect(calculateDiscount(undefined)).toBe(0);
  });

  it('should handle zero discount', () => {
    expect(calculateDiscount({ discount: 0 })).toBe(0);
  });
});

describe('calculateTotal', () => {
  it('should calculate correct totals for order with items', () => {
    const order = {
      items: [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 },
      ],
      discount: 0,
    };
    
    const result = calculateTotal(order);
    
    expect(result.subtotal).toBe(250); // 200 + 50
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(12.5); // 5% of 250
    expect(result.total).toBe(262.5); // 250 + 12.5
  });

  it('should apply discount correctly', () => {
    const order = {
      items: [
        { price: 100, quantity: 2 },
      ],
      discount: 20,
    };
    
    const result = calculateTotal(order);
    
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(20);
    expect(result.tax).toBe(9); // 5% of (200 - 20)
    expect(result.total).toBe(189); // 180 + 9
  });

  it('should return zeros for null order', () => {
    const result = calculateTotal(null);
    
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should return zeros for order without items', () => {
    const result = calculateTotal({});
    
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should handle empty items array', () => {
    const result = calculateTotal({ items: [] });
    
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should handle single item', () => {
    const order = {
      items: [{ price: 500, quantity: 1 }],
    };
    
    const result = calculateTotal(order);
    
    expect(result.subtotal).toBe(500);
    expect(result.tax).toBe(25);
    expect(result.total).toBe(525);
  });
});

describe('getDateRangeFilter', () => {
  beforeEach(() => {
    // Mock current date to 2024-06-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return today range', () => {
    const range = getDateRangeFilter('today');
    
    expect(range.start.getDate()).toBe(15);
    expect(range.start.getMonth()).toBe(5); // June
    expect(range.start.getHours()).toBe(0);
    expect(range.end.getHours()).toBe(23);
  });

  it('should return yesterday range', () => {
    const range = getDateRangeFilter('yesterday');
    
    expect(range.start.getDate()).toBe(14);
    expect(range.end.getDate()).toBe(14);
  });

  it('should return week range', () => {
    const range = getDateRangeFilter('week');
    
    expect(range.start.getDate()).toBe(8); // 7 days ago
    expect(range.end.getDate()).toBe(15);
  });

  it('should return month range', () => {
    const range = getDateRangeFilter('month');
    
    // 30 days ago from June 15 is May 16
    expect(range.start.getMonth()).toBe(4); // May
    expect(range.start.getDate()).toBe(16);
  });

  it('should return null dates for unknown range', () => {
    const range = getDateRangeFilter('unknown');
    
    expect(range.start).toBeNull();
    expect(range.end).toBeNull();
  });

  it('should return null dates for empty string', () => {
    const range = getDateRangeFilter('');
    
    expect(range.start).toBeNull();
    expect(range.end).toBeNull();
  });
});

describe('filterByDate', () => {
  const payments = [
    { id: 1, created_at: '2024-06-15T10:00:00', amount: 100 },
    { id: 2, created_at: '2024-06-14T10:00:00', amount: 200 },
    { id: 3, created_at: '2024-06-10T10:00:00', amount: 300 },
    { id: 4, created_at: '2024-05-15T10:00:00', amount: 400 },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should filter by today', () => {
    const filtered = filterByDate(payments, 'today');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });

  it('should filter by week', () => {
    const filtered = filterByDate(payments, 'week');
    expect(filtered).toHaveLength(3);
  });

  it('should filter by date range object', () => {
    const range = {
      start: new Date('2024-06-10'),
      end: new Date('2024-06-15T23:59:59'),
    };
    const filtered = filterByDate(payments, range);
    expect(filtered).toHaveLength(3);
  });

  it('should return empty array for empty payments', () => {
    const filtered = filterByDate([], 'today');
    expect(filtered).toEqual([]);
  });

  it('should return empty array for null payments', () => {
    const filtered = filterByDate(null, 'today');
    expect(filtered).toEqual([]);
  });

  it('should return all payments if range has no start/end', () => {
    const range = { start: null, end: null };
    const filtered = filterByDate(payments, range);
    expect(filtered).toHaveLength(4);
  });
});

describe('filterByAmount', () => {
  const payments = [
    { id: 1, amount: 100 },
    { id: 2, amount: 200 },
    { id: 3, amount: 500 },
    { id: 4, amount: 1000 },
  ];

  it('should filter by minimum amount', () => {
    const filtered = filterByAmount(payments, 200, null);
    expect(filtered).toHaveLength(3);
    expect(filtered.map(p => p.id)).toEqual([2, 3, 4]);
  });

  it('should filter by maximum amount', () => {
    const filtered = filterByAmount(payments, null, 500);
    expect(filtered).toHaveLength(3);
    expect(filtered.map(p => p.id)).toEqual([1, 2, 3]);
  });

  it('should filter by range', () => {
    const filtered = filterByAmount(payments, 200, 500);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(p => p.id)).toEqual([2, 3]);
  });

  it('should return all if no min/max specified', () => {
    const filtered = filterByAmount(payments, null, null);
    expect(filtered).toHaveLength(4);
  });

  it('should return empty for null payments', () => {
    const filtered = filterByAmount(null, 100, 500);
    expect(filtered).toEqual([]);
  });

  it('should return empty for empty array', () => {
    const filtered = filterByAmount([], 100, 500);
    expect(filtered).toEqual([]);
  });

  it('should handle payments with no amount', () => {
    const paymentsWithMissing = [
      { id: 1, amount: 100 },
      { id: 2 }, // no amount
    ];
    const filtered = filterByAmount(paymentsWithMissing, 50, 150);
    // Payment without amount is filtered out (amount must be defined and within range)
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });
});

describe('filterByMethod', () => {
  const payments = [
    { id: 1, payment_method: 'cash' },
    { id: 2, payment_method: 'online' },
    { id: 3, payment_method: 'Cash' }, // different case
    { id: 4, payment_method: 'split' },
  ];

  it('should filter by cash method', () => {
    const filtered = filterByMethod(payments, 'cash');
    expect(filtered).toHaveLength(2);
  });

  it('should filter by online method', () => {
    const filtered = filterByMethod(payments, 'online');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(2);
  });

  it('should be case insensitive', () => {
    const filtered = filterByMethod(payments, 'CASH');
    expect(filtered).toHaveLength(2);
  });

  it('should return all for "all" method', () => {
    const filtered = filterByMethod(payments, 'all');
    expect(filtered).toHaveLength(4);
  });

  it('should return all for empty method', () => {
    const filtered = filterByMethod(payments, '');
    expect(filtered).toHaveLength(4);
  });

  it('should return all for null method', () => {
    const filtered = filterByMethod(payments, null);
    expect(filtered).toHaveLength(4);
  });

  it('should return empty for null payments', () => {
    const filtered = filterByMethod(null, 'cash');
    expect(filtered).toEqual([]);
  });
});

describe('filterByStatus', () => {
  const payments = [
    { id: 1, status: 'paid' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'Paid' }, // different case
    { id: 4, status: 'failed' },
    { id: 5 }, // no status
  ];

  it('should filter by paid status', () => {
    const filtered = filterByStatus(payments, 'paid');
    expect(filtered).toHaveLength(2);
  });

  it('should filter by pending status', () => {
    const filtered = filterByStatus(payments, 'pending');
    expect(filtered).toHaveLength(2); // includes one with no status (defaults to pending)
  });

  it('should be case insensitive', () => {
    const filtered = filterByStatus(payments, 'PAID');
    expect(filtered).toHaveLength(2);
  });

  it('should return all for "all" status', () => {
    const filtered = filterByStatus(payments, 'all');
    expect(filtered).toHaveLength(5);
  });

  it('should return all for null status', () => {
    const filtered = filterByStatus(payments, null);
    expect(filtered).toHaveLength(5);
  });

  it('should return empty for null payments', () => {
    const filtered = filterByStatus(null, 'paid');
    expect(filtered).toEqual([]);
  });
});

describe('calculateRevenueStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return zeros for empty payments', () => {
    const stats = calculateRevenueStats([]);
    
    expect(stats.todayRevenue).toBe(0);
    expect(stats.weekRevenue).toBe(0);
    expect(stats.monthRevenue).toBe(0);
    expect(stats.totalTransactions).toBe(0);
  });

  it('should return zeros for null payments', () => {
    const stats = calculateRevenueStats(null);
    
    expect(stats.todayRevenue).toBe(0);
    expect(stats.weekRevenue).toBe(0);
  });

  it('should calculate today revenue correctly', () => {
    const payments = [
      { created_at: '2024-06-15T10:00:00', amount: 100, status: 'paid' },
      { created_at: '2024-06-15T11:00:00', amount: 200, status: 'paid' },
      { created_at: '2024-06-14T10:00:00', amount: 500, status: 'paid' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.todayRevenue).toBe(300);
  });

  it('should only count paid/completed/success payments', () => {
    const payments = [
      { created_at: '2024-06-15T10:00:00', amount: 100, status: 'paid' },
      { created_at: '2024-06-15T11:00:00', amount: 200, status: 'pending' },
      { created_at: '2024-06-15T12:00:00', amount: 300, status: 'completed' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.todayRevenue).toBe(400); // only paid + completed
  });

  it('should calculate week and month revenue', () => {
    const payments = [
      { created_at: '2024-06-15T10:00:00', amount: 100, status: 'paid' },
      { created_at: '2024-06-10T10:00:00', amount: 200, status: 'paid' },
      { created_at: '2024-05-20T10:00:00', amount: 500, status: 'paid' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.todayRevenue).toBe(100);
    expect(stats.weekRevenue).toBe(300); // today + week
    expect(stats.monthRevenue).toBe(800); // all within 30 days
  });

  it('should calculate cashRevenue from cash payments', () => {
    const payments = [
      { created_at: new Date().toISOString(), amount: 100, status: 'paid', payment_method: 'cash' },
      { created_at: new Date().toISOString(), amount: 200, status: 'paid', payment_method: 'Cash' },
      { created_at: new Date().toISOString(), amount: 300, status: 'paid', payment_method: 'online' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.cashRevenue).toBe(300); // 100 + 200 cash payments
  });

  it('should calculate onlineRevenue from online payments', () => {
    const payments = [
      { created_at: new Date().toISOString(), amount: 100, status: 'paid', payment_method: 'online' },
      { created_at: new Date().toISOString(), amount: 200, status: 'paid', payment_method: 'Online' },
      { created_at: new Date().toISOString(), amount: 300, status: 'paid', payment_method: 'cash' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.onlineRevenue).toBe(300); // 100 + 200 online payments
  });

  it('should calculate both cash and online revenue together', () => {
    const payments = [
      { created_at: new Date().toISOString(), amount: 100, status: 'paid', payment_method: 'cash' },
      { created_at: new Date().toISOString(), amount: 200, status: 'paid', payment_method: 'online' },
      { created_at: new Date().toISOString(), amount: 150, status: 'completed', payment_method: 'cash' },
      { created_at: new Date().toISOString(), amount: 250, status: 'success', payment_method: 'online' },
      { created_at: new Date().toISOString(), amount: 500, status: 'pending', payment_method: 'cash' },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.cashRevenue).toBe(250); // 100 + 150 (paid cash)
    expect(stats.onlineRevenue).toBe(450); // 200 + 250 (paid online)
    expect(stats.pendingPayments).toBe(1);
  });

  it('should handle payments without payment_method', () => {
    const payments = [
      { created_at: new Date().toISOString(), amount: 100, status: 'paid' },
      { created_at: new Date().toISOString(), amount: 200, status: 'paid', payment_method: null },
    ];
    
    const stats = calculateRevenueStats(payments);
    
    expect(stats.cashRevenue).toBe(0);
    expect(stats.onlineRevenue).toBe(0);
    expect(stats.totalTransactions).toBe(2);
  });
});

// Import additional functions for testing
import {
  getPaymentMethodDistribution,
  formatRelativeTime,
} from './billingUtils';

describe('getPaymentMethodDistribution', () => {
  it('should return empty array for empty payments', () => {
    expect(getPaymentMethodDistribution([])).toEqual([]);
  });

  it('should return empty array for null payments', () => {
    expect(getPaymentMethodDistribution(null)).toEqual([]);
  });

  it('should return empty array for undefined payments', () => {
    expect(getPaymentMethodDistribution(undefined)).toEqual([]);
  });

  it('should count cash payments', () => {
    const payments = [
      { status: 'paid', payment_method: 'cash' },
      { status: 'paid', payment_method: 'cash' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    const cash = distribution.find(d => d.name === 'Cash');
    expect(cash.value).toBe(2);
  });

  it('should count online payments', () => {
    const payments = [
      { status: 'paid', payment_method: 'online' },
      { status: 'completed', payment_method: 'online' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    const online = distribution.find(d => d.name === 'Online');
    expect(online.value).toBe(2);
  });

  it('should count split payments', () => {
    const payments = [
      { status: 'success', payment_method: 'split' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    const split = distribution.find(d => d.name === 'Split');
    expect(split.value).toBe(1);
  });

  it('should only count paid/completed/success payments', () => {
    const payments = [
      { status: 'paid', payment_method: 'cash' },
      { status: 'pending', payment_method: 'cash' },
      { status: 'failed', payment_method: 'cash' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    const cash = distribution.find(d => d.name === 'Cash');
    expect(cash.value).toBe(1);
  });

  it('should filter out zero value methods', () => {
    const payments = [
      { status: 'paid', payment_method: 'cash' },
      { status: 'paid', payment_method: 'cash' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    expect(distribution).toHaveLength(1); // Only cash, no online or split
    expect(distribution[0].name).toBe('Cash');
  });

  it('should include colors in distribution', () => {
    const payments = [
      { status: 'paid', payment_method: 'cash' },
      { status: 'paid', payment_method: 'online' },
      { status: 'paid', payment_method: 'split' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    
    const cash = distribution.find(d => d.name === 'Cash');
    const online = distribution.find(d => d.name === 'Online');
    const split = distribution.find(d => d.name === 'Split');
    
    expect(cash.color).toBe('#10b981');
    expect(online.color).toBe('#8b5cf6');
    expect(split.color).toBe('#f59e0b');
  });

  it('should handle mixed payment methods', () => {
    const payments = [
      { status: 'paid', payment_method: 'cash' },
      { status: 'paid', payment_method: 'cash' },
      { status: 'paid', payment_method: 'online' },
      { status: 'paid', payment_method: 'split' },
      { status: 'paid', payment_method: 'split' },
      { status: 'paid', payment_method: 'split' },
    ];
    const distribution = getPaymentMethodDistribution(payments);
    
    expect(distribution).toHaveLength(3);
    expect(distribution.find(d => d.name === 'Cash').value).toBe(2);
    expect(distribution.find(d => d.name === 'Online').value).toBe(1);
    expect(distribution.find(d => d.name === 'Split').value).toBe(3);
  });
});

describe('formatRelativeTime', () => {
  it('should return N/A for null date', () => {
    expect(formatRelativeTime(null)).toBe('N/A');
  });

  it('should return N/A for undefined date', () => {
    expect(formatRelativeTime(undefined)).toBe('N/A');
  });

  it('should return "Just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('should return minutes ago for times within an hour', () => {
    const past = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    expect(formatRelativeTime(past)).toBe('15 mins ago');
  });

  it('should return singular minute', () => {
    const past = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
    expect(formatRelativeTime(past)).toBe('1 min ago');
  });

  it('should return hours ago for times within a day', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    expect(formatRelativeTime(past)).toBe('3 hours ago');
  });

  it('should return singular hour', () => {
    const past = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    expect(formatRelativeTime(past)).toBe('1 hour ago');
  });

  it('should return days ago for times within a week', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    expect(formatRelativeTime(past)).toBe('3 days ago');
  });

  it('should return singular day', () => {
    const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    expect(formatRelativeTime(past)).toBe('1 day ago');
  });

  it('should return formatted date for older times', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const result = formatRelativeTime(past);
    // Should be a formatted date, not "X days ago"
    expect(result).not.toContain('ago');
  });

  it('should handle string dates', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });
});

// Import and test get7DayRevenueData
import { get7DayRevenueData } from './billingUtils';

describe('get7DayRevenueData', () => {
  it('should return 7 days of data', () => {
    const payments = [];
    const data = get7DayRevenueData(payments);
    expect(data).toHaveLength(7);
  });

  it('should return zero revenue for empty payments', () => {
    const data = get7DayRevenueData([]);
    data.forEach(day => {
      expect(day.revenue).toBe(0);
    });
  });

  it('should calculate revenue for today', () => {
    const today = new Date();
    const payments = [
      { created_at: today.toISOString(), amount: 100, status: 'paid' },
      { created_at: today.toISOString(), amount: 200, status: 'paid' },
    ];
    const data = get7DayRevenueData(payments);
    // Last element should be today
    expect(data[6].revenue).toBe(300);
  });

  it('should only count paid/completed/success payments', () => {
    const today = new Date();
    const payments = [
      { created_at: today.toISOString(), amount: 100, status: 'paid' },
      { created_at: today.toISOString(), amount: 200, status: 'pending' },
      { created_at: today.toISOString(), amount: 300, status: 'completed' },
      { created_at: today.toISOString(), amount: 400, status: 'failed' },
    ];
    const data = get7DayRevenueData(payments);
    expect(data[6].revenue).toBe(400); // 100 + 300
  });

  it('should include date labels', () => {
    const data = get7DayRevenueData([]);
    data.forEach(day => {
      expect(day.date).toBeDefined();
      expect(typeof day.date).toBe('string');
    });
  });

  it('should handle missing amounts', () => {
    const today = new Date();
    const payments = [
      { created_at: today.toISOString(), status: 'paid' }, // no amount
      { created_at: today.toISOString(), amount: 200, status: 'paid' },
    ];
    const data = get7DayRevenueData(payments);
    expect(data[6].revenue).toBe(200);
  });

  it('should distribute payments across correct days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const payments = [
      { created_at: today.toISOString(), amount: 100, status: 'paid' },
      { created_at: yesterday.toISOString(), amount: 200, status: 'paid' },
    ];
    const data = get7DayRevenueData(payments);
    
    expect(data[6].revenue).toBe(100); // today
    expect(data[5].revenue).toBe(200); // yesterday
  });
});

describe('exportPaymentsToCSV', () => {
  let mockCreateElement;
  let mockAppendChild;
  let mockRemoveChild;
  let mockCreateObjectURL;
  let mockLink;
  let originalAlert;

  beforeEach(() => {
    // Save original alert
    originalAlert = globalThis.alert;
    globalThis.alert = vi.fn();
    
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };
    mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
  });

  afterEach(() => {
    // Restore original alert
    globalThis.alert = originalAlert;
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    mockCreateObjectURL.mockRestore();
  });

  it('should alert when payments array is empty', () => {
    exportPaymentsToCSV([]);
    expect(globalThis.alert).toHaveBeenCalledWith('No payments to export');
  });

  it('should alert when payments is null', () => {
    exportPaymentsToCSV(null);
    expect(globalThis.alert).toHaveBeenCalledWith('No payments to export');
  });

  it('should alert when payments is undefined', () => {
    exportPaymentsToCSV(undefined);
    expect(globalThis.alert).toHaveBeenCalledWith('No payments to export');
  });

  it('should create CSV with correct headers', () => {
    const payments = [
      { 
        id: 'pay-123', 
        order_number: 'ORD001',
        table_number: '5',
        payment_method: 'cash',
        amount: 500,
        status: 'paid',
        created_at: '2024-06-15T10:30:00'
      }
    ];
    
    exportPaymentsToCSV(payments);
    
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should use default filename when not provided', () => {
    const payments = [
      { id: 'pay-123', created_at: '2024-06-15T10:30:00' }
    ];
    
    exportPaymentsToCSV(payments);
    
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('payments-export'));
  });

  it('should use custom filename when provided', () => {
    const payments = [
      { id: 'pay-123', created_at: '2024-06-15T10:30:00' }
    ];
    
    exportPaymentsToCSV(payments, 'custom-export');
    
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('custom-export'));
  });

  it('should handle payments with missing fields', () => {
    const payments = [
      { created_at: '2024-06-15T10:30:00' } // minimal payment
    ];
    
    expect(() => exportPaymentsToCSV(payments)).not.toThrow();
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should handle payments with nested order data', () => {
    const payments = [
      { 
        id: 'pay-123',
        order: { order_number: 'ORD001', table_number: '3' },
        created_at: '2024-06-15T10:30:00'
      }
    ];
    
    expect(() => exportPaymentsToCSV(payments)).not.toThrow();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should set link visibility to hidden', () => {
    const payments = [
      { id: 'pay-123', created_at: '2024-06-15T10:30:00' }
    ];
    
    exportPaymentsToCSV(payments);
    
    expect(mockLink.style.visibility).toBe('hidden');
  });

  it('should append and remove link from document body', () => {
    const payments = [
      { id: 'pay-123', created_at: '2024-06-15T10:30:00' }
    ];
    
    exportPaymentsToCSV(payments);
    
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });
});
