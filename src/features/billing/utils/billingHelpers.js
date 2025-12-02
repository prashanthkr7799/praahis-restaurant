/**
 * BILLING UTILITIES
 * Helper functions for billing calculations, formatting, and data processing
 */

/**
 * Format amount as Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount (₹1,234.56)
 */
export const formatINR = (amount) => {
  if (!amount && amount !== 0) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate tax amount (5% GST)
 * @param {number} subtotal - Subtotal before tax
 * @returns {number} Tax amount
 */
export const calculateTax = (subtotal) => {
  if (!subtotal || subtotal <= 0) return 0;
  return subtotal * 0.05; // 5% tax
};

/**
 * Calculate discount from order
 * @param {object} order - Order object
 * @returns {number} Discount amount
 */
export const calculateDiscount = (order) => {
  if (!order) return 0;
  return order.discount || 0;
};

/**
 * Calculate total with tax and discount
 * @param {object} order - Order object with items
 * @returns {object} Breakdown of subtotal, tax, discount, total
 */
export const calculateTotal = (order) => {
  if (!order || !order.items) {
    return {
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    };
  }

  // Calculate subtotal from items
  const subtotal = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const discount = calculateDiscount(order);
  const subtotalAfterDiscount = subtotal - discount;
  const tax = calculateTax(subtotalAfterDiscount);
  const total = subtotalAfterDiscount + tax;

  return {
    subtotal,
    tax,
    discount,
    total,
  };
};

/**
 * Get date range for filtering
 * @param {string} rangeName - 'today', 'yesterday', 'week', 'month'
 * @returns {object} { start: Date, end: Date }
 */
export const getDateRangeFilter = (rangeName) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (rangeName) {
    case 'today': {
      return {
        start: today,
        end: endOfToday,
      };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return {
        start: yesterday,
        end: endOfYesterday,
      };
    }

    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        start: weekAgo,
        end: endOfToday,
      };
    }

    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return {
        start: monthAgo,
        end: endOfToday,
      };
    }

    default: {
      return {
        start: null,
        end: null,
      };
    }
  }
};

/**
 * Filter payments by date range
 * @param {Array} payments - Array of payment objects
 * @param {object} range - { start: Date, end: Date } or rangeName string
 * @returns {Array} Filtered payments
 */
export const filterByDate = (payments, range) => {
  if (!payments || payments.length === 0) return [];
  
  let dateRange = range;
  
  // If range is a string, convert it
  if (typeof range === 'string') {
    dateRange = getDateRangeFilter(range);
  }

  if (!dateRange.start || !dateRange.end) return payments;

  return payments.filter((payment) => {
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
  });
};

/**
 * Filter payments by amount range
 * @param {Array} payments - Array of payment objects
 * @param {number} min - Minimum amount
 * @param {number} max - Maximum amount
 * @returns {Array} Filtered payments
 */
export const filterByAmount = (payments, min, max) => {
  if (!payments || payments.length === 0) return [];

  return payments.filter((payment) => {
    const amount = payment.amount || 0;
    const meetsMin = min !== null && min !== undefined ? amount >= min : true;
    const meetsMax = max !== null && max !== undefined ? amount <= max : true;
    return meetsMin && meetsMax;
  });
};

/**
 * Filter payments by payment method
 * @param {Array} payments - Array of payment objects
 * @param {string} method - 'cash', 'online', 'split', or 'all'
 * @returns {Array} Filtered payments
 */
export const filterByMethod = (payments, method) => {
  if (!payments || payments.length === 0) return [];
  if (!method || method === 'all') return payments;

  return payments.filter((payment) => {
    return payment.payment_method?.toLowerCase() === method.toLowerCase();
  });
};

/**
 * Filter payments by status
 * @param {Array} payments - Array of payment objects
 * @param {string} status - 'paid', 'pending', 'failed', or 'all'
 * @returns {Array} Filtered payments
 */
export const filterByStatus = (payments, status) => {
  if (!payments || payments.length === 0) return [];
  if (!status || status === 'all') return payments;

  return payments.filter((payment) => {
    const paymentStatus = payment.status?.toLowerCase() || 'pending';
    return paymentStatus === status.toLowerCase();
  });
};

/**
 * Export payments to CSV
 * @param {Array} payments - Array of payment objects
 * @param {string} filename - Filename for download
 */
export const exportPaymentsToCSV = (payments, filename = 'payments-export') => {
  if (!payments || payments.length === 0) {
    alert('No payments to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Payment ID',
    'Order Number',
    'Table Number',
    'Payment Method',
    'Amount (INR)',
    'Status',
    'Date',
    'Time',
  ];

  // Convert payments to CSV rows
  const rows = payments.map((payment) => {
    const date = new Date(payment.created_at);
    return [
      payment.id || '',
      payment.order_number || payment.order?.order_number || 'N/A',
      payment.table_number || payment.order?.table_number || 'N/A',
      payment.payment_method || 'N/A',
      payment.amount || 0,
      payment.status || 'pending',
      date.toLocaleDateString('en-IN'),
      date.toLocaleTimeString('en-IN'),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Calculate revenue statistics from payments
 * @param {Array} payments - Array of payment objects
 * @returns {object} Revenue stats
 */
export const calculateRevenueStats = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      pendingPayments: 0,
      totalTransactions: 0,
      cashRevenue: 0,
      onlineRevenue: 0,
    };
  }

  const todayPayments = filterByDate(payments, 'today');
  const weekPayments = filterByDate(payments, 'week');
  const monthPayments = filterByDate(payments, 'month');

  // Only count paid/completed payments for revenue
  const paidPayments = payments.filter(
    (p) => p.status === 'paid' || p.status === 'completed' || p.status === 'success'
  );

  const todayRevenue = todayPayments
    .filter((p) => p.status === 'paid' || p.status === 'completed' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const weekRevenue = weekPayments
    .filter((p) => p.status === 'paid' || p.status === 'completed' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const monthRevenue = monthPayments
    .filter((p) => p.status === 'paid' || p.status === 'completed' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments.filter(
    (p) => p.status === 'pending' || !p.status
  ).length;

  const cashRevenue = paidPayments
    .filter((p) => p.payment_method?.toLowerCase() === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const onlineRevenue = paidPayments
    .filter((p) => p.payment_method?.toLowerCase() === 'online')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    pendingPayments,
    totalTransactions: paidPayments.length,
    cashRevenue,
    onlineRevenue,
  };
};

/**
 * Get 7-day revenue data for chart
 * @param {Array} payments - Array of payment objects
 * @returns {Array} Array of { date, revenue } for last 7 days
 */
export const get7DayRevenueData = (payments) => {
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.created_at);
      return (
        paymentDate >= date &&
        paymentDate < nextDate &&
        (payment.status === 'paid' || payment.status === 'completed' || payment.status === 'success')
      );
    });

    const revenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    data.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue,
    });
  }

  return data;
};

/**
 * Get payment method distribution for pie chart
 * @param {Array} payments - Array of payment objects
 * @returns {Array} Array of { name, value } for each payment method
 */
export const getPaymentMethodDistribution = (payments) => {
  if (!payments || payments.length === 0) {
    return [];
  }

  const paidPayments = payments.filter(
    (p) => p.status === 'paid' || p.status === 'completed' || p.status === 'success'
  );

  const cash = paidPayments.filter(
    (p) => p.payment_method?.toLowerCase() === 'cash'
  ).length;

  const online = paidPayments.filter(
    (p) => p.payment_method?.toLowerCase() === 'online'
  ).length;

  const split = paidPayments.filter(
    (p) => p.payment_method?.toLowerCase() === 'split'
  ).length;

  return [
    { name: 'Cash', value: cash, color: '#10b981' },
    { name: 'Online', value: online, color: '#8b5cf6' },
    { name: 'Split', value: split, color: '#f59e0b' },
  ].filter((item) => item.value > 0);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return past.toLocaleDateString('en-IN');
};
