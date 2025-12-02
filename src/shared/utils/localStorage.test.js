/**
 * LocalStorage Helper Functions Tests
 * Comprehensive tests for cart management and session storage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveSession,
  getSession,
  clearSession,
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
} from './localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    keys: () => Object.keys(store),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Session Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveSession', () => {
    it('should save session ID for a table', () => {
      const result = saveSession('table-1', 'session-123');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'praahis_session_table-1',
        'session-123'
      );
    });

    it('should return true on successful save', () => {
      expect(saveSession('table-2', 'session-456')).toBe(true);
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      
      const result = saveSession('table-1', 'session-123');
      expect(result).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return session ID for a table', () => {
      localStorageMock.store['praahis_session_table-1'] = 'session-abc';
      
      const result = getSession('table-1');
      expect(result).toBe('session-abc');
    });

    it('should return null for non-existent session', () => {
      const result = getSession('non-existent');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Read error');
      });
      
      const result = getSession('table-1');
      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear session for a table', () => {
      localStorageMock.store['praahis_session_table-1'] = 'session-xyz';
      
      const result = clearSession('table-1');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_session_table-1');
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove error');
      });
      
      const result = clearSession('table-1');
      expect(result).toBe(false);
    });
  });
});

describe('Cart Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveCart', () => {
    it('should save cart items for a table', () => {
      const cartItems = [{ id: 1, name: 'Burger', price: 100, quantity: 2 }];
      
      const result = saveCart('table-1', cartItems);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'praahis_cart_table-1',
        JSON.stringify(cartItems)
      );
    });

    it('should save empty cart', () => {
      const result = saveCart('table-1', []);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = saveCart('table-1', []);
      expect(result).toBe(false);
    });
  });

  describe('getCart', () => {
    it('should return cart items for a table', () => {
      const cartItems = [{ id: 1, name: 'Pizza', price: 200 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(cartItems);
      
      const result = getCart('table-1');
      expect(result).toEqual(cartItems);
    });

    it('should return empty array for non-existent cart', () => {
      const result = getCart('new-table');
      expect(result).toEqual([]);
    });

    it('should handle parse errors gracefully', () => {
      localStorageMock.store['praahis_cart_table-1'] = 'invalid json';
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      
      // Should handle parse error
      const result = getCart('table-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('clearCart', () => {
    it('should clear cart for a table', () => {
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([{ id: 1 }]);
      
      const result = clearCart('table-1');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_cart_table-1');
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Error');
      });
      
      const result = clearCart('table-1');
      expect(result).toBe(false);
    });
  });

  describe('getCartItemCount', () => {
    it('should return total quantity of items', () => {
      const cartItems = [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 3 },
      ];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(cartItems);
      
      const result = getCartItemCount('table-1');
      expect(result).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([]);
      
      const result = getCartItemCount('table-1');
      expect(result).toBe(0);
    });

    it('should return 0 for non-existent cart', () => {
      const result = getCartItemCount('new-table');
      expect(result).toBe(0);
    });
  });

  describe('getCartTotal', () => {
    it('should calculate total price', () => {
      const cartItems = [
        { id: 1, price: 100, quantity: 2 }, // 200
        { id: 2, price: 50, quantity: 3 },   // 150
      ];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(cartItems);
      
      const result = getCartTotal('table-1');
      expect(result).toBe(350);
    });

    it('should return 0 for empty cart', () => {
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([]);
      
      const result = getCartTotal('table-1');
      expect(result).toBe(0);
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', () => {
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([]);
      
      const newItem = { id: 1, name: 'Burger', price: 150 };
      const result = addToCart('table-1', newItem);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].name).toBe('Burger');
    });

    it('should update quantity for existing item', () => {
      const existingCart = [{ id: 1, name: 'Burger', price: 150, quantity: 1 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const newItem = { id: 1, name: 'Burger', price: 150, quantity: 2 };
      const result = addToCart('table-1', newItem);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3); // 1 + 2
    });

    it('should add item with custom quantity', () => {
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([]);
      
      const newItem = { id: 1, name: 'Pizza', price: 200, quantity: 5 };
      const result = addToCart('table-1', newItem);
      
      expect(result[0].quantity).toBe(5);
    });

    it('should update notes for existing item', () => {
      const existingCart = [{ id: 1, name: 'Burger', price: 150, quantity: 1 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const newItem = { id: 1, notes: 'No onions' };
      addToCart('table-1', newItem);
      
      // Cart should be updated with notes
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('updateCartItem', () => {
    it('should update item properties', () => {
      const existingCart = [{ id: 1, name: 'Burger', price: 150, quantity: 2 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = updateCartItem('table-1', 1, { notes: 'Extra cheese' });
      
      expect(result[0].notes).toBe('Extra cheese');
    });

    it('should not modify cart if item not found', () => {
      const existingCart = [{ id: 1, name: 'Burger', price: 150 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = updateCartItem('table-1', 999, { notes: 'Test' });
      
      expect(result).toHaveLength(1);
      expect(result[0].notes).toBeUndefined();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', () => {
      const existingCart = [
        { id: 1, name: 'Burger' },
        { id: 2, name: 'Pizza' },
      ];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = removeFromCart('table-1', 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should return empty array when removing last item', () => {
      const existingCart = [{ id: 1, name: 'Burger' }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = removeFromCart('table-1', 1);
      
      expect(result).toEqual([]);
    });

    it('should handle non-existent item', () => {
      const existingCart = [{ id: 1, name: 'Burger' }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = removeFromCart('table-1', 999);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const existingCart = [{ id: 1, name: 'Burger', quantity: 2 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = updateQuantity('table-1', 1, 5);
      
      expect(result[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      const existingCart = [
        { id: 1, name: 'Burger', quantity: 2 },
        { id: 2, name: 'Pizza', quantity: 1 },
      ];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = updateQuantity('table-1', 1, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should remove item when quantity is negative', () => {
      const existingCart = [{ id: 1, name: 'Burger', quantity: 2 }];
      localStorageMock.store['praahis_cart_table-1'] = JSON.stringify(existingCart);
      
      const result = updateQuantity('table-1', 1, -1);
      
      expect(result).toEqual([]);
    });
  });
});

describe('Recent Order Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveRecentOrder', () => {
    it('should save recent order info', () => {
      const orderInfo = { orderId: 123, total: 500, status: 'pending' };
      
      const result = saveRecentOrder(orderInfo);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'praahis_recent_order',
        JSON.stringify(orderInfo)
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Error');
      });
      
      const result = saveRecentOrder({});
      expect(result).toBe(false);
    });
  });

  describe('getRecentOrder', () => {
    it('should return recent order info', () => {
      const orderInfo = { orderId: 456, total: 1000 };
      localStorageMock.store['praahis_recent_order'] = JSON.stringify(orderInfo);
      
      const result = getRecentOrder();
      expect(result).toEqual(orderInfo);
    });

    it('should return null for no recent order', () => {
      const result = getRecentOrder();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully and return null', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage read error');
      });
      
      const result = getRecentOrder();
      expect(result).toBeNull();
    });
  });

  describe('clearRecentOrder', () => {
    it('should clear recent order', () => {
      localStorageMock.store['praahis_recent_order'] = JSON.stringify({ id: 1 });
      
      const result = clearRecentOrder();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_recent_order');
    });

    it('should handle errors gracefully and return false', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = clearRecentOrder();
      expect(result).toBe(false);
    });
  });
});

describe('Chef Authentication', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveChefAuth', () => {
    it('should save chef authentication data', () => {
      const authData = { userId: 'chef-1', isAuthenticated: true };
      
      const result = saveChefAuth(authData);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'praahis_chef_auth',
        JSON.stringify(authData)
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Error');
      });
      
      const result = saveChefAuth({});
      expect(result).toBe(false);
    });
  });

  describe('getChefAuth', () => {
    it('should return chef auth data', () => {
      const authData = { userId: 'chef-1', isAuthenticated: true };
      localStorageMock.store['praahis_chef_auth'] = JSON.stringify(authData);
      
      const result = getChefAuth();
      expect(result).toEqual(authData);
    });

    it('should return null for no auth', () => {
      const result = getChefAuth();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully and return null', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage read error');
      });
      
      const result = getChefAuth();
      expect(result).toBeNull();
    });
  });

  describe('clearChefAuth', () => {
    it('should clear chef authentication', () => {
      localStorageMock.store['praahis_chef_auth'] = JSON.stringify({ id: 1 });
      
      const result = clearChefAuth();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_chef_auth');
    });

    it('should handle errors gracefully and return false', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = clearChefAuth();
      expect(result).toBe(false);
    });
  });

  describe('isChefAuthenticated', () => {
    it('should return true when authenticated', () => {
      localStorageMock.store['praahis_chef_auth'] = JSON.stringify({ isAuthenticated: true });
      
      expect(isChefAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      localStorageMock.store['praahis_chef_auth'] = JSON.stringify({ isAuthenticated: false });
      
      expect(isChefAuthenticated()).toBe(false);
    });

    it('should return false when no auth data', () => {
      expect(isChefAuthenticated()).toBeFalsy();
    });
  });
});

describe('Waiter Authentication', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveWaiterAuth', () => {
    it('should save waiter authentication data', () => {
      const authData = { userId: 'waiter-1', isAuthenticated: true };
      
      const result = saveWaiterAuth(authData);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'praahis_waiter_auth',
        JSON.stringify(authData)
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Error');
      });
      
      const result = saveWaiterAuth({});
      expect(result).toBe(false);
    });
  });

  describe('getWaiterAuth', () => {
    it('should return waiter auth data', () => {
      const authData = { userId: 'waiter-1', isAuthenticated: true };
      localStorageMock.store['praahis_waiter_auth'] = JSON.stringify(authData);
      
      const result = getWaiterAuth();
      expect(result).toEqual(authData);
    });

    it('should return null for no auth', () => {
      const result = getWaiterAuth();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully and return null', () => {
      // Mock getItem to throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage read error');
      });
      
      const result = getWaiterAuth();
      expect(result).toBeNull();
    });
  });

  describe('clearWaiterAuth', () => {
    it('should clear waiter authentication', () => {
      localStorageMock.store['praahis_waiter_auth'] = JSON.stringify({ id: 1 });
      
      const result = clearWaiterAuth();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_waiter_auth');
    });

    it('should handle errors gracefully and return false', () => {
      // Mock removeItem to throw an error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = clearWaiterAuth();
      expect(result).toBe(false);
    });
  });

  describe('isWaiterAuthenticated', () => {
    it('should return true when authenticated', () => {
      localStorageMock.store['praahis_waiter_auth'] = JSON.stringify({ isAuthenticated: true });
      
      expect(isWaiterAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      localStorageMock.store['praahis_waiter_auth'] = JSON.stringify({ isAuthenticated: false });
      
      expect(isWaiterAuthenticated()).toBe(false);
    });

    it('should return false when no auth data', () => {
      expect(isWaiterAuthenticated()).toBeFalsy();
    });
  });
});

describe('clearAllData', () => {
  let originalKeys;
  
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Mock Object.keys to work with our localStorage mock
    originalKeys = Object.keys;
    Object.keys = (obj) => {
      if (obj === localStorage) {
        return Object.getOwnPropertyNames(localStorageMock.store);
      }
      return originalKeys(obj);
    };
  });
  
  afterEach(() => {
    Object.keys = originalKeys;
  });

  it('should clear all app data', () => {
    // Setup some data
    localStorageMock.store['praahis_cart_table-1'] = JSON.stringify([]);
    localStorageMock.store['praahis_cart_table-2'] = JSON.stringify([]);
    localStorageMock.store['praahis_recent_order'] = JSON.stringify({});
    localStorageMock.store['praahis_chef_auth'] = JSON.stringify({});
    localStorageMock.store['praahis_waiter_auth'] = JSON.stringify({});
    
    const result = clearAllData();
    
    expect(result).toBe(true);
    // Verify cart keys were removed
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_cart_table-1');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_cart_table-2');
  });

  it('should only remove cart keys that start with cart prefix', () => {
    // Setup mixed data
    localStorageMock.store['praahis_cart_table-5'] = JSON.stringify([{ id: 1 }]);
    localStorageMock.store['praahis_other_data'] = 'some data';
    localStorageMock.store['unrelated_key'] = 'value';
    
    const result = clearAllData();
    
    expect(result).toBe(true);
    // Cart keys should be removed
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_cart_table-5');
  });

  it('should handle errors gracefully', () => {
    // Mock Object.keys to throw
    Object.keys = vi.fn(() => {
      throw new Error('Error');
    });
    
    const result = clearAllData();
    expect(result).toBe(false);
  });
});
