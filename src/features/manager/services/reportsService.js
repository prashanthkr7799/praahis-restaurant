/**
 * ⚠️ REPORTS UTILS — PHASE 8 ANALYTICS
 * 
 * RULES:
 * - NO SQL queries or migrations
 * - ONLY client-side computation on fetched data
 * - USE ONLY existing tables: orders, order_items, menu_items, table_sessions, payments, users, feedbacks
 * - All analytics computed in JavaScript
 */

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(orders, startDate, endDate) {
  if (!orders || !Array.isArray(orders)) return [];
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return orders.filter(order => {
    const orderDate = new Date(order.created_at);
    if (start && orderDate < start) return false;
    if (end && orderDate > end) return false;
    return true;
  });
}

/**
 * Filter items by date range (using created_at from related orders)
 */
export function filterItemsByDateRange(items, orders, startDate, endDate) {
  if (!items || !orders) return [];
  
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);
  const orderIds = new Set(filteredOrders.map(o => o.id));
  
  return items.filter(item => orderIds.has(item.order_id));
}

/**
 * Filter payments by date range
 */
export function filterPaymentsByDateRange(payments, startDate, endDate) {
  if (!payments || !Array.isArray(payments)) return [];
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return payments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    if (start && paymentDate < start) return false;
    if (end && paymentDate > end) return false;
    return true;
  });
}

/**
 * Filter table sessions by date range
 */
export function filterSessionsByDateRange(sessions, startDate, endDate) {
  if (!sessions || !Array.isArray(sessions)) return [];
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return sessions.filter(session => {
    const sessionDate = new Date(session.created_at);
    if (start && sessionDate < start) return false;
    if (end && sessionDate > end) return false;
    return true;
  });
}

/**
 * Group orders by date
 */
export function groupOrdersByDate(orders) {
  if (!orders || !Array.isArray(orders)) return {};
  
  const grouped = {};
  
  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(order);
  });
  
  return grouped;
}

/**
 * Group orders by hour (0-23)
 */
export function groupOrdersByHour(orders) {
  if (!orders || !Array.isArray(orders)) return {};
  
  const grouped = {};
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    grouped[i] = [];
  }
  
  orders.forEach(order => {
    const hour = new Date(order.created_at).getHours();
    grouped[hour].push(order);
  });
  
  return grouped;
}

/**
 * Group orders by day of week (0=Sunday, 6=Saturday)
 */
export function groupOrdersByDayOfWeek(orders) {
  if (!orders || !Array.isArray(orders)) return {};
  
  const grouped = {};
  
  // Initialize all days
  for (let i = 0; i < 7; i++) {
    grouped[i] = [];
  }
  
  orders.forEach(order => {
    const day = new Date(order.created_at).getDay();
    grouped[day].push(order);
  });
  
  return grouped;
}

/**
 * Calculate total revenue from orders
 */
export function calculateRevenue(orders) {
  if (!orders || !Array.isArray(orders)) return 0;
  
  return orders.reduce((sum, order) => {
    return sum + (parseFloat(order.total_amount) || 0);
  }, 0);
}

/**
 * Calculate average order value
 */
export function calculateAverageOrderValue(orders) {
  if (!orders || orders.length === 0) return 0;
  
  const total = calculateRevenue(orders);
  return total / orders.length;
}

/**
 * Calculate payment method statistics
 */
export function calculatePaymentMethodStats(payments) {
  if (!payments || !Array.isArray(payments)) {
    return {
      cash: 0,
      online: 0,
      split: 0,
      total: 0
    };
  }
  
  const stats = {
    cash: 0,
    online: 0,
    split: 0,
    total: payments.length
  };
  
  payments.forEach(payment => {
    const method = payment.payment_method?.toLowerCase() || 'cash';
    const amount = parseFloat(payment.amount) || 0;
    
    if (method.includes('cash')) {
      stats.cash += amount;
    } else if (method.includes('online') || method.includes('razorpay') || method.includes('card')) {
      stats.online += amount;
    } else {
      stats.split += amount;
    }
  });
  
  return stats;
}

/**
 * Calculate category performance
 */
export function calculateCategoryPerformance(orderItems, menuItems, orders) {
  if (!orderItems || !menuItems || !orders) return [];
  
  // Create order status map for filtering
  const paidOrders = new Set(
    orders.filter(o => o.status === 'completed' || o.status === 'paid').map(o => o.id)
  );
  
  // Create menu item lookup
  const menuLookup = {};
  menuItems.forEach(item => {
    menuLookup[item.id] = item;
  });
  
  // Group by category
  const categoryMap = {};
  
  orderItems.forEach(orderItem => {
    // Only count items from paid orders
    if (!paidOrders.has(orderItem.order_id)) return;
    
    const menuItem = menuLookup[orderItem.menu_item_id];
    if (!menuItem) return;
    
    const category = menuItem.category || 'Uncategorized';
    
    if (!categoryMap[category]) {
      categoryMap[category] = {
        category,
        quantity: 0,
        revenue: 0,
        itemCount: 0
      };
    }
    
    const quantity = parseInt(orderItem.quantity) || 0;
    const price = parseFloat(orderItem.price) || 0;
    
    categoryMap[category].quantity += quantity;
    categoryMap[category].revenue += quantity * price;
    categoryMap[category].itemCount++;
  });
  
  // Convert to array and calculate averages
  return Object.values(categoryMap).map(cat => ({
    ...cat,
    avgPrice: cat.quantity > 0 ? cat.revenue / cat.quantity : 0
  }));
}

/**
 * Calculate item performance
 */
export function calculateItemPerformance(orderItems, menuItems, orders) {
  if (!orderItems || !menuItems || !orders) return [];
  
  // Create order status map for filtering
  const paidOrders = new Set(
    orders.filter(o => o.status === 'completed' || o.status === 'paid').map(o => o.id)
  );
  
  // Create menu item lookup
  const menuLookup = {};
  menuItems.forEach(item => {
    menuLookup[item.id] = item;
  });
  
  // Group by item
  const itemMap = {};
  
  orderItems.forEach(orderItem => {
    // Only count items from paid orders
    if (!paidOrders.has(orderItem.order_id)) return;
    
    const menuItem = menuLookup[orderItem.menu_item_id];
    if (!menuItem) return;
    
    const itemId = orderItem.menu_item_id;
    
    if (!itemMap[itemId]) {
      itemMap[itemId] = {
        id: itemId,
        name: menuItem.name || 'Unknown Item',
        category: menuItem.category || 'Uncategorized',
        quantity: 0,
        revenue: 0,
        orderCount: 0,
        inStock: !menuItem.out_of_stock,
        price: parseFloat(menuItem.price) || 0
      };
    }
    
    const quantity = parseInt(orderItem.quantity) || 0;
    const price = parseFloat(orderItem.price) || 0;
    
    itemMap[itemId].quantity += quantity;
    itemMap[itemId].revenue += quantity * price;
    itemMap[itemId].orderCount++;
  });
  
  // Convert to array and calculate averages
  return Object.values(itemMap).map(item => ({
    ...item,
    avgPrice: item.quantity > 0 ? item.revenue / item.quantity : item.price
  }));
}

/**
 * Calculate staff performance
 */
export function calculateStaffPerformance(orders, orderItems, users, feedbacks) {
  if (!orders || !users) return [];
  
  // Create user lookup
  const userLookup = {};
  users.forEach(user => {
    userLookup[user.id] = user;
  });
  
  // Create feedback lookup by staff
  const feedbackMap = {};
  if (feedbacks && Array.isArray(feedbacks)) {
    feedbacks.forEach(feedback => {
      if (feedback.staff_id) {
        if (!feedbackMap[feedback.staff_id]) {
          feedbackMap[feedback.staff_id] = [];
        }
        feedbackMap[feedback.staff_id].push(feedback);
      }
    });
  }
  
  // Group by staff
  const staffMap = {};
  
  orders.forEach(order => {
    // Try to find staff from order (waiter_id, chef_id, or assigned_to)
    const staffId = order.waiter_id || order.assigned_to || order.chef_id;
    if (!staffId) return;
    
    const user = userLookup[staffId];
    if (!user) return;
    
    if (!staffMap[staffId]) {
      staffMap[staffId] = {
        id: staffId,
        name: user.full_name || user.email || 'Unknown',
        role: user.role || 'staff',
        ordersServed: 0,
        revenue: 0,
        totalTime: 0,
        feedbacks: feedbackMap[staffId] || []
      };
    }
    
    staffMap[staffId].ordersServed++;
    staffMap[staffId].revenue += parseFloat(order.total_amount) || 0;
    
    // Calculate completion time if available
    if (order.created_at && order.updated_at) {
      const created = new Date(order.created_at);
      const updated = new Date(order.updated_at);
      const timeDiff = (updated - created) / 1000 / 60; // minutes
      if (timeDiff > 0) {
        staffMap[staffId].totalTime += timeDiff;
      }
    }
  });
  
  // Convert to array and calculate averages
  return Object.values(staffMap).map(staff => {
    const avgTime = staff.ordersServed > 0 ? staff.totalTime / staff.ordersServed : 0;
    const avgRating = staff.feedbacks.length > 0
      ? staff.feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / staff.feedbacks.length
      : 0;
    
    return {
      ...staff,
      avgCompletionTime: avgTime,
      avgRating,
      feedbackCount: staff.feedbacks.length
    };
  });
}

/**
 * Calculate customer flow metrics
 */
export function calculateCustomerFlow(tableSessions, orders) {
  if (!tableSessions) return {
    totalSessions: 0,
    avgDuration: 0,
    peakHour: null,
    busiestDay: null,
    sessionsPerHour: {},
    sessionsPerDay: {}
  };
  
  const sessionsPerHour = groupOrdersByHour(tableSessions);
  const sessionsPerDay = groupOrdersByDayOfWeek(tableSessions);
  
  // Calculate average duration
  let totalDuration = 0;
  let sessionsWithDuration = 0;
  
  tableSessions.forEach(session => {
    if (session.created_at && session.ended_at) {
      const start = new Date(session.created_at);
      const end = new Date(session.ended_at);
      const duration = (end - start) / 1000 / 60; // minutes
      if (duration > 0) {
        totalDuration += duration;
        sessionsWithDuration++;
      }
    }
  });
  
  const avgDuration = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;
  
  // Find peak hour
  let peakHour = 0;
  let maxSessions = 0;
  Object.entries(sessionsPerHour).forEach(([hour, sessions]) => {
    if (sessions.length > maxSessions) {
      maxSessions = sessions.length;
      peakHour = parseInt(hour);
    }
  });
  
  // Find busiest day
  let busiestDay = 0;
  let maxDaySessions = 0;
  Object.entries(sessionsPerDay).forEach(([day, sessions]) => {
    if (sessions.length > maxDaySessions) {
      maxDaySessions = sessions.length;
      busiestDay = parseInt(day);
    }
  });
  
  // Calculate returning customers
  const userIds = new Set();
  const returningUsers = new Set();
  
  if (orders && Array.isArray(orders)) {
    orders.forEach(order => {
      if (order.user_id) {
        if (userIds.has(order.user_id)) {
          returningUsers.add(order.user_id);
        } else {
          userIds.add(order.user_id);
        }
      }
    });
  }
  
  const returningCustomersPercent = userIds.size > 0
    ? (returningUsers.size / userIds.size) * 100
    : 0;
  
  return {
    totalSessions: tableSessions.length,
    avgDuration,
    peakHour,
    busiestDay,
    sessionsPerHour,
    sessionsPerDay,
    returningCustomersPercent
  };
}

/**
 * Calculate peak hours analytics
 */
export function calculatePeakHours(orders) {
  if (!orders || !Array.isArray(orders)) return [];
  
  const hourlyData = groupOrdersByHour(orders);
  
  return Object.entries(hourlyData).map(([hour, hourOrders]) => {
    const hourNum = parseInt(hour);
    const revenue = calculateRevenue(hourOrders);
    const avgPrepTime = calculateAveragePreparationTime(hourOrders);
    
    return {
      hour: hourNum,
      hourLabel: formatHourLabel(hourNum),
      orderCount: hourOrders.length,
      revenue,
      avgRevenue: hourOrders.length > 0 ? revenue / hourOrders.length : 0,
      avgPrepTime
    };
  }).sort((a, b) => a.hour - b.hour);
}

/**
 * Calculate average preparation time
 */
function calculateAveragePreparationTime(orders) {
  if (!orders || orders.length === 0) return 0;
  
  let totalTime = 0;
  let count = 0;
  
  orders.forEach(order => {
    if (order.created_at && order.updated_at) {
      const created = new Date(order.created_at);
      const updated = new Date(order.updated_at);
      const timeDiff = (updated - created) / 1000 / 60; // minutes
      if (timeDiff > 0) {
        totalTime += timeDiff;
        count++;
      }
    }
  });
  
  return count > 0 ? totalTime / count : 0;
}

/**
 * Format hour label (e.g., "12 AM", "1 PM")
 */
function formatHourLabel(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
}

/**
 * Sort array in descending order by field
 */
export function sortDescending(array, field) {
  if (!array || !Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = typeof a[field] === 'number' ? a[field] : 0;
    const bVal = typeof b[field] === 'number' ? b[field] : 0;
    return bVal - aVal;
  });
}

/**
 * Sort array in ascending order by field
 */
export function sortAscending(array, field) {
  if (!array || !Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = typeof a[field] === 'number' ? a[field] : 0;
    const bVal = typeof b[field] === 'number' ? b[field] : 0;
    return aVal - bVal;
  });
}

/**
 * Get top N items from array
 */
export function getTopN(array, field, n = 10) {
  const sorted = sortDescending(array, field);
  return sorted.slice(0, n);
}

/**
 * Get bottom N items from array
 */
export function getBottomN(array, field, n = 10) {
  const sorted = sortAscending(array, field);
  return sorted.slice(0, n);
}

/**
 * Calculate date-wise breakdown
 */
export function calculateDatewiseBreakdown(orders, payments) {
  if (!orders || !Array.isArray(orders)) return [];
  
  const grouped = groupOrdersByDate(orders);
  const paymentsByDate = payments ? groupPaymentsByDate(payments) : {};
  
  return Object.entries(grouped).map(([date, dayOrders]) => {
    const revenue = calculateRevenue(dayOrders);
    const dayPayments = paymentsByDate[date] || [];
    
    const totalDiscount = dayOrders.reduce((sum, o) => 
      sum + (parseFloat(o.discount_amount) || 0), 0
    );
    
    const totalTax = dayOrders.reduce((sum, o) => 
      sum + (parseFloat(o.tax_amount) || 0), 0
    );
    
    return {
      date,
      orderCount: dayOrders.length,
      revenue,
      avgOrder: dayOrders.length > 0 ? revenue / dayOrders.length : 0,
      discounts: totalDiscount,
      tax: totalTax,
      paymentCount: dayPayments.length
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Group payments by date
 */
function groupPaymentsByDate(payments) {
  if (!payments || !Array.isArray(payments)) return {};
  
  const grouped = {};
  
  payments.forEach(payment => {
    const date = new Date(payment.created_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(payment);
  });
  
  return grouped;
}

/**
 * Calculate trend percentage change
 */
export function calculateTrend(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return `₹${parseFloat(amount || 0).toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value) {
  return `${parseFloat(value || 0).toFixed(1)}%`;
}

/**
 * Format duration (minutes to human readable)
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Get day name from day number (0-6)
 */
export function getDayName(day) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data, filename = 'report.csv') {
  if (!data || data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculate returning customers percentage
 */
export function calculateReturningCustomers(orders) {
  if (!orders || !Array.isArray(orders) || orders.length === 0) return 0;
  
  const userIds = new Set();
  const returningUsers = new Set();
  
  orders.forEach(order => {
    if (order.user_id) {
      if (userIds.has(order.user_id)) {
        returningUsers.add(order.user_id);
      } else {
        userIds.add(order.user_id);
      }
    }
  });
  
  return userIds.size > 0 ? (returningUsers.size / userIds.size) * 100 : 0;
}
