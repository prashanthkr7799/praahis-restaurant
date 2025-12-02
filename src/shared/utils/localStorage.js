// LocalStorage Helper Functions for Cart Management

const CART_PREFIX = 'praahis_cart_';
const SESSION_PREFIX = 'praahis_session_';
const RECENT_ORDER_KEY = 'praahis_recent_order';
const CHEF_AUTH_KEY = 'praahis_chef_auth';
const WAITER_AUTH_KEY = 'praahis_waiter_auth';

// =============================================
// Session Management
// =============================================

// Save session ID for specific table
export const saveSession = (tableId, sessionId) => {
  try {
    const key = `${SESSION_PREFIX}${tableId}`;
    localStorage.setItem(key, sessionId);
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

// Get session ID for specific table
export const getSession = (tableId) => {
  try {
    const key = `${SESSION_PREFIX}${tableId}`;
    const sessionId = localStorage.getItem(key);
    return sessionId || null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

// Clear session for specific table
export const clearSession = (tableId) => {
  try {
    const key = `${SESSION_PREFIX}${tableId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing session:', error);
    return false;
  }
};

// =============================================
// Cart Management
// =============================================

// Save cart for specific table
export const saveCart = (tableId, cartItems) => {
  try {
    const key = `${CART_PREFIX}${tableId}`;
    localStorage.setItem(key, JSON.stringify(cartItems));
    return true;
  } catch (error) {
    console.error('Error saving cart:', error);
    return false;
  }
};

// Get cart for specific table
export const getCart = (tableId) => {
  try {
    const key = `${CART_PREFIX}${tableId}`;
    const cartData = localStorage.getItem(key);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error loading cart:', error);
    return [];
  }
};

// Clear cart for specific table
export const clearCart = (tableId) => {
  try {
    const key = `${CART_PREFIX}${tableId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// Get cart item count
export const getCartItemCount = (tableId) => {
  const cart = getCart(tableId);
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};

// Get cart total
export const getCartTotal = (tableId) => {
  const cart = getCart(tableId);
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Add item to cart
export const addToCart = (tableId, item) => {
  const cart = getCart(tableId);
  const existingItemIndex = cart.findIndex(
    cartItem => cartItem.id === item.id
  );

  if (existingItemIndex > -1) {
    // Item exists, update quantity
    cart[existingItemIndex].quantity += item.quantity || 1;
    if (item.notes) {
      cart[existingItemIndex].notes = item.notes;
    }
  } else {
    // New item, add to cart
    cart.push({
      ...item,
      quantity: item.quantity || 1,
    });
  }

  saveCart(tableId, cart);
  return cart;
};

// Update cart item
export const updateCartItem = (tableId, itemId, updates) => {
  const cart = getCart(tableId);
  const itemIndex = cart.findIndex(item => item.id === itemId);

  if (itemIndex > -1) {
    cart[itemIndex] = { ...cart[itemIndex], ...updates };
    saveCart(tableId, cart);
  }

  return cart;
};

// Remove item from cart
export const removeFromCart = (tableId, itemId) => {
  const cart = getCart(tableId);
  const filteredCart = cart.filter(item => item.id !== itemId);
  saveCart(tableId, filteredCart);
  return filteredCart;
};

// Update item quantity
export const updateQuantity = (tableId, itemId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(tableId, itemId);
  }

  const cart = getCart(tableId);
  const itemIndex = cart.findIndex(item => item.id === itemId);

  if (itemIndex > -1) {
    cart[itemIndex].quantity = quantity;
    saveCart(tableId, cart);
  }

  return cart;
};

// Save recent order info (for tracking)
export const saveRecentOrder = (orderInfo) => {
  try {
    localStorage.setItem(RECENT_ORDER_KEY, JSON.stringify(orderInfo));
    return true;
  } catch (error) {
    console.error('Error saving recent order:', error);
    return false;
  }
};

// Get recent order
export const getRecentOrder = () => {
  try {
    const orderData = localStorage.getItem(RECENT_ORDER_KEY);
    return orderData ? JSON.parse(orderData) : null;
  } catch (error) {
    console.error('Error loading recent order:', error);
    return null;
  }
};

// Clear recent order
export const clearRecentOrder = () => {
  try {
    localStorage.removeItem(RECENT_ORDER_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing recent order:', error);
    return false;
  }
};

// Chef authentication
export const saveChefAuth = (authData) => {
  try {
    localStorage.setItem(CHEF_AUTH_KEY, JSON.stringify(authData));
    return true;
  } catch (error) {
    console.error('Error saving chef auth:', error);
    return false;
  }
};

export const getChefAuth = () => {
  try {
    const authData = localStorage.getItem(CHEF_AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error loading chef auth:', error);
    return null;
  }
};

export const clearChefAuth = () => {
  try {
    localStorage.removeItem(CHEF_AUTH_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing chef auth:', error);
    return false;
  }
};

export const isChefAuthenticated = () => {
  const auth = getChefAuth();
  return auth && auth.isAuthenticated === true;
};

// Waiter authentication
export const saveWaiterAuth = (authData) => {
  try {
    localStorage.setItem(WAITER_AUTH_KEY, JSON.stringify(authData));
    return true;
  } catch (error) {
    console.error('Error saving waiter auth:', error);
    return false;
  }
};

export const getWaiterAuth = () => {
  try {
    const authData = localStorage.getItem(WAITER_AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error loading waiter auth:', error);
    return null;
  }
};

export const clearWaiterAuth = () => {
  try {
    localStorage.removeItem(WAITER_AUTH_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing waiter auth:', error);
    return false;
  }
};

export const isWaiterAuthenticated = () => {
  const auth = getWaiterAuth();
  return auth && auth.isAuthenticated === true;
};

// Clear all app data
export const clearAllData = () => {
  try {
    // Clear all cart data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CART_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear other data
    clearRecentOrder();
    clearChefAuth();
    clearWaiterAuth();
    
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

export default {
  saveCart,
  getCart,
  clearCart,
  getCartItemCount,
  getCartTotal,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateQuantity,
  saveRecentOrder,
  getRecentOrder,
  clearRecentOrder,
  saveChefAuth,
  getChefAuth,
  clearChefAuth,
  isChefAuthenticated,
  saveWaiterAuth,
  getWaiterAuth,
  clearWaiterAuth,
  isWaiterAuthenticated,
  clearAllData,
};
