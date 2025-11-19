// Order Helper Functions

// Generate unique order number
export const generateOrderNumber = () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

// Generate order token for customer tracking
export const generateOrderToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Calculate tax (5% default)
export const calculateTax = (subtotal, taxRate = 0.05) => {
  return parseFloat((subtotal * taxRate).toFixed(2));
};

// Calculate total
export const calculateTotal = (subtotal, tax = 0, discount = 0) => {
  return parseFloat((subtotal + tax - discount).toFixed(2));
};

// Calculate subtotal from items
export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
};

// Format currency (Indian Rupees)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format timestamp
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

// Format time only
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get relative time (e.g., "5 minutes ago")
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / 60000);
  
  if (diffInMins < 1) return 'Just now';
  if (diffInMins === 1) return '1 minute ago';
  if (diffInMins < 60) return `${diffInMins} minutes ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  return formatTimestamp(timestamp);
};

// Get order status color
export const getOrderStatusColor = (status) => {
  const colors = {
    received: 'bg-blue-100 text-blue-800 border-blue-300',
    preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ready: 'bg-green-100 text-green-800 border-green-300',
    served: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get order status display text
export const getOrderStatusText = (status) => {
  const texts = {
    received: 'Order Received',
    preparing: 'Preparing',
    ready: 'Ready to Serve',
    served: 'Served',
    cancelled: 'Cancelled',
  };
  return texts[status] || status;
};

// Get payment status display text
export const getPaymentStatusText = (status) => {
  const texts = {
    pending: 'Payment Pending',
    paid: 'Paid',
    failed: 'Payment Failed',
  };
  return texts[status] || status;
};

// Validate order data
export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.items || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (!orderData.table_id && !orderData.table_number) {
    errors.push('Table information is required');
  }

  if (orderData.subtotal <= 0) {
    errors.push('Order subtotal must be greater than zero');
  }

  if (orderData.total <= 0) {
    errors.push('Order total must be greater than zero');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Prepare order data for submission
export const prepareOrderData = (cartItems, tableInfo, restaurantId) => {
  // Validate inputs
  if (!tableInfo || !tableInfo.id) {
    throw new Error('Table information is missing or invalid. Please reload the page.');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  if (!restaurantId) {
    throw new Error('Restaurant ID is missing.');
  }

  const items = cartItems.map(item => ({
    menu_item_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes || '',
    is_veg: item.is_vegetarian || false,
    // Per-item status tracking (optional, used by client UI and future chef actions)
    item_status: 'queued', // queued until payment -> received; then kitchen moves to preparing/ready/served
    started_at: null,
    ready_at: null,
    served_at: null,
  }));

  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  return {
    restaurant_id: restaurantId,
    table_id: tableInfo.id,
    table_number: tableInfo.table_number,
    order_number: generateOrderNumber(),
    order_token: generateOrderToken(),
    items: items,
    subtotal,
    tax,
    discount: 0,
    total,
    payment_status: 'pending',
    order_status: 'pending_payment', // Changed from 'received' - only show in chef dashboard after payment
    created_at: new Date().toISOString(),
  };
};

// Get estimated preparation time
export const getEstimatedTime = (items) => {
  if (!items || items.length === 0) return 15;
  
  // Get max preparation time from items
  const maxTime = Math.max(...items.map(item => item.preparation_time || 15));
  
  // Add 5 minutes buffer
  return maxTime + 5;
};

// Check if order is recent (within last 30 minutes)
export const isRecentOrder = (timestamp) => {
  const now = new Date();
  const orderTime = new Date(timestamp);
  const diffInMs = now - orderTime;
  const diffInMins = diffInMs / 60000;
  return diffInMins <= 30;
};

// Group menu items by category
export const groupByCategory = (menuItems) => {
  return menuItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
};

// Get unique categories
export const getCategories = (menuItems) => {
  const categories = [...new Set(menuItems.map(item => item.category))];
  return categories.sort();
};

export default {
  generateOrderNumber,
  generateOrderToken,
  calculateTax,
  calculateTotal,
  calculateSubtotal,
  formatCurrency,
  formatTimestamp,
  formatTime,
  getRelativeTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  getOrderStatusText,
  getPaymentStatusText,
  validateOrderData,
  prepareOrderData,
  getEstimatedTime,
  isRecentOrder,
  groupByCategory,
  getCategories,
};
