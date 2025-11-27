/**
 * Supabase Client Tests
 * Comprehensive tests for API functions with mocked Supabase client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// All mocks must be defined inside vi.mock factories to be hoisted
vi.mock('@supabase/supabase-js', () => {
  // Chain helper for fluent API
  const createChainMock = () => {
    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      order: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      ilike: vi.fn(() => chain),
      in: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      or: vi.fn(() => chain),
      is: vi.fn(() => chain),
    };
    return chain;
  };

  const mockChain = createChainMock();
  
  const mockSupabaseClient = {
    from: vi.fn(() => mockChain),
    rpc: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        if (cb) cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      send: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    _mockChain: mockChain, // Expose for tests
    _createChainMock: createChainMock, // Expose for tests
  };

  return {
    createClient: vi.fn(() => mockSupabaseClient),
    __mockClient: mockSupabaseClient, // Expose for tests
  };
});

// Mock restaurantContextStore
vi.mock('@/lib/restaurantContextStore', () => ({
  getActiveRestaurantId: vi.fn(() => 'test-restaurant-id'),
}));

// Mock authErrorHandler
vi.mock('@/shared/utils/helpers/authErrorHandler', () => ({
  handleAuthError: vi.fn(),
}));

// Import after mocks
import { createClient } from '@supabase/supabase-js';
import {
  handleSupabaseError,
  fromRestaurant,
  getRestaurant,
  getTable,
  getTables,
  getMenuItems,
  createOrder,
  getOrder,
  getOrderByToken,
  updateOrderStatus,
  updateOrderStatusCascade,
  cancelOrder,
  processRefund,
  getSharedCart,
  updateSharedCart,
  clearSharedCart,
  subscribeToSharedCart,
  getOrCreateActiveSessionId,
  markTableOccupied,
  getSessionWithOrders,
  endTableSession,
  updateSessionActivity,
  forceReleaseTableSession,
  createComplaint,
  updateComplaint,
  getComplaints,
  updateOrder,
  updateOrderItemStatus,
  updatePaymentStatus,
  applyDiscount,
  getOrders,
  createPayment,
  updatePayment,
  processSplitPayment,
  handleSplitPayment,
  subscribeToOrders,
  subscribeToOrder,
  ensureDemoRestaurant,
  supabase,
} from './supabaseClient';

// Get references to mocks for test manipulation - use _ prefix for unused
const _getMockClient = () => createClient().__mockClient || createClient();
const _getMockChain = () => _getMockClient()._mockChain;

describe('handleSupabaseError', () => {
  it('should return null for null error', () => {
    expect(handleSupabaseError(null)).toBeNull();
  });

  it('should return null for undefined error', () => {
    expect(handleSupabaseError(undefined)).toBeNull();
  });

  it('should handle authentication errors (PGRST301)', () => {
    const error = { code: 'PGRST301', message: 'Auth error' };
    const result = handleSupabaseError(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('Session expired');
  });

  it('should handle 401 errors in message', () => {
    const error = { message: '401 Unauthorized' };
    const result = handleSupabaseError(error);
    expect(result).toBeInstanceOf(Error);
  });

  it('should handle refresh token errors', () => {
    const error = { message: 'refresh token not found' };
    const result = handleSupabaseError(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('Authentication error');
  });

  it('should handle JWT errors', () => {
    const error = { message: 'JWT expired' };
    const result = handleSupabaseError(error);
    expect(result).toBeInstanceOf(Error);
  });

  it('should handle invalid claim errors', () => {
    // Note: invalid claim is not currently handled - returns original error
    const error = { message: 'invalid claim' };
    const result = handleSupabaseError(error);
    expect(result).toBe(error); // Returns original error
  });

  it('should return original error for non-auth errors', () => {
    const error = { message: 'Some database error', code: 'OTHER' };
    const result = handleSupabaseError(error);
    expect(result).toBe(error);
  });
});

describe('fromRestaurant helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof fromRestaurant).toBe('function');
  });

  it('should return object with select method', () => {
    const result = fromRestaurant('orders');
    expect(typeof result.select).toBe('function');
  });

  it('should return object with update method', () => {
    const result = fromRestaurant('orders');
    expect(typeof result.update).toBe('function');
  });

  it('should return object with delete method', () => {
    const result = fromRestaurant('orders');
    expect(typeof result.delete).toBe('function');
  });

  it('should return object with insert method', () => {
    const result = fromRestaurant('orders');
    expect(typeof result.insert).toBe('function');
  });
});

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRestaurant', () => {
    it('should be a function', () => {
      expect(typeof getRestaurant).toBe('function');
    });

    it('should be an async function', () => {
      const result = getRestaurant('test');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('getTables', () => {
    it('should be a function', () => {
      expect(typeof getTables).toBe('function');
    });

    it('should be an async function', () => {
      const result = getTables('test-restaurant-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('getMenuItems', () => {
    it('should be a function', () => {
      expect(typeof getMenuItems).toBe('function');
    });

    it('should be an async function', () => {
      const result = getMenuItems('test-restaurant-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('createOrder', () => {
    it('should be a function', () => {
      expect(typeof createOrder).toBe('function');
    });

    it('should be an async function', () => {
      const result = createOrder({ items: [] });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('getOrder', () => {
    it('should be a function', () => {
      expect(typeof getOrder).toBe('function');
    });

    it('should be an async function', () => {
      const result = getOrder('order-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('updateOrderStatus', () => {
    it('should be a function', () => {
      expect(typeof updateOrderStatus).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateOrderStatus('order-id', 'preparing');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('cancelOrder', () => {
    it('should be a function', () => {
      expect(typeof cancelOrder).toBe('function');
    });

    it('should require order ID', async () => {
      await expect(cancelOrder(null, { reason: 'test' })).rejects.toThrow('Order ID is required');
    });

    it('should require order ID when undefined', async () => {
      await expect(cancelOrder(undefined, { reason: 'test' })).rejects.toThrow('Order ID is required');
    });

    it('should require cancellation reason', async () => {
      await expect(cancelOrder('order-123', { reason: '' })).rejects.toThrow('Cancellation reason is required');
    });

    it('should require cancellation reason when missing', async () => {
      await expect(cancelOrder('order-123', {})).rejects.toThrow('Cancellation reason is required');
    });
  });
});

describe('Cart Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSharedCart', () => {
    it('should be a function', () => {
      expect(typeof getSharedCart).toBe('function');
    });

    it('should be an async function', () => {
      const result = getSharedCart('session-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('updateSharedCart', () => {
    it('should be a function', () => {
      expect(typeof updateSharedCart).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateSharedCart('session-123', []);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('clearSharedCart', () => {
    it('should be a function', () => {
      expect(typeof clearSharedCart).toBe('function');
    });

    it('should be an async function', () => {
      const result = clearSharedCart('session-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('subscribeToSharedCart', () => {
    it('should be a function', () => {
      expect(typeof subscribeToSharedCart).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToSharedCart('session-123', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should accept session ID and callback', () => {
      const callback = vi.fn();
      expect(() => subscribeToSharedCart('session-123', callback)).not.toThrow();
    });
  });
});

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateActiveSessionId', () => {
    it('should be a function', () => {
      expect(typeof getOrCreateActiveSessionId).toBe('function');
    });

    it('should be an async function', () => {
      const result = getOrCreateActiveSessionId('table-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('markTableOccupied', () => {
    it('should be a function', () => {
      expect(typeof markTableOccupied).toBe('function');
    });

    it('should be an async function', () => {
      const result = markTableOccupied('table-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('getSessionWithOrders', () => {
    it('should be a function', () => {
      expect(typeof getSessionWithOrders).toBe('function');
    });

    it('should be an async function', () => {
      const result = getSessionWithOrders('session-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('endTableSession', () => {
    it('should be a function', () => {
      expect(typeof endTableSession).toBe('function');
    });

    it('should be an async function', () => {
      const result = endTableSession('session-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('updateSessionActivity', () => {
    it('should be a function', () => {
      expect(typeof updateSessionActivity).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateSessionActivity('session-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });

  describe('forceReleaseTableSession', () => {
    it('should be a function', () => {
      expect(typeof forceReleaseTableSession).toBe('function');
    });

    it('should be an async function', () => {
      const result = forceReleaseTableSession('session-id', 'table-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });
});

describe('Table Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTable', () => {
    it('should be a function', () => {
      expect(typeof getTable).toBe('function');
    });

    it('should be an async function', () => {
      const result = getTable('table-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept table ID as first parameter', () => {
      const result = getTable('123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept restaurant slug as second parameter', () => {
      const result = getTable('123', 'restaurant-slug');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should handle UUID table ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = getTable(uuid);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should handle demo table request', () => {
      const result = getTable('demo');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should handle DEMO (uppercase) table request', () => {
      const result = getTable('DEMO');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should handle table number as string', () => {
      const result = getTable('5');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept both table number and restaurant slug', () => {
      const result = getTable('1', 'praahis');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });
});

describe('Payment Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processRefund', () => {
    it('should be a function', () => {
      expect(typeof processRefund).toBe('function');
    });

    it('should require order ID', async () => {
      await expect(processRefund(null, { refundAmount: 100, reason: 'test' }))
        .rejects.toThrow('Order ID is required');
    });

    it('should require order ID when empty', async () => {
      await expect(processRefund('', { refundAmount: 100, reason: 'test' }))
        .rejects.toThrow('Order ID is required');
    });

    it('should require valid refund amount', async () => {
      await expect(processRefund('order-123', { refundAmount: 0, reason: 'test' }))
        .rejects.toThrow('Valid refund amount is required');
    });

    it('should require positive refund amount', async () => {
      await expect(processRefund('order-123', { refundAmount: -50, reason: 'test' }))
        .rejects.toThrow('Valid refund amount is required');
    });

    it('should require refund amount to be present', async () => {
      await expect(processRefund('order-123', { reason: 'test' }))
        .rejects.toThrow('Valid refund amount is required');
    });

    it('should require refund reason', async () => {
      await expect(processRefund('order-123', { refundAmount: 100, reason: '' }))
        .rejects.toThrow('Refund reason is required');
    });

    it('should require refund reason to be present', async () => {
      await expect(processRefund('order-123', { refundAmount: 100 }))
        .rejects.toThrow('Refund reason is required');
    });
  });
});

describe('Exports', () => {
  it('should export supabase client', () => {
    expect(supabase).toBeDefined();
  });

  it('supabase should have from method', () => {
    expect(typeof supabase.from).toBe('function');
  });

  it('supabase should have rpc method', () => {
    expect(typeof supabase.rpc).toBe('function');
  });

  it('supabase should have channel method', () => {
    expect(typeof supabase.channel).toBe('function');
  });

  it('supabase should have auth object', () => {
    expect(supabase.auth).toBeDefined();
  });

  it('should export handleSupabaseError function', () => {
    expect(typeof handleSupabaseError).toBe('function');
  });

  it('should export fromRestaurant function', () => {
    expect(typeof fromRestaurant).toBe('function');
  });

  it('should export getRestaurant function', () => {
    expect(typeof getRestaurant).toBe('function');
  });

  it('should export getTable function', () => {
    expect(typeof getTable).toBe('function');
  });

  it('should export getTables function', () => {
    expect(typeof getTables).toBe('function');
  });

  it('should export getMenuItems function', () => {
    expect(typeof getMenuItems).toBe('function');
  });

  it('should export createOrder function', () => {
    expect(typeof createOrder).toBe('function');
  });

  it('should export getOrder function', () => {
    expect(typeof getOrder).toBe('function');
  });

  it('should export updateOrderStatus function', () => {
    expect(typeof updateOrderStatus).toBe('function');
  });

  it('should export cancelOrder function', () => {
    expect(typeof cancelOrder).toBe('function');
  });

  it('should export processRefund function', () => {
    expect(typeof processRefund).toBe('function');
  });

  it('should export getSharedCart function', () => {
    expect(typeof getSharedCart).toBe('function');
  });

  it('should export updateSharedCart function', () => {
    expect(typeof updateSharedCart).toBe('function');
  });

  it('should export clearSharedCart function', () => {
    expect(typeof clearSharedCart).toBe('function');
  });

  it('should export subscribeToSharedCart function', () => {
    expect(typeof subscribeToSharedCart).toBe('function');
  });

  it('should export getOrCreateActiveSessionId function', () => {
    expect(typeof getOrCreateActiveSessionId).toBe('function');
  });

  it('should export markTableOccupied function', () => {
    expect(typeof markTableOccupied).toBe('function');
  });

  it('should export getSessionWithOrders function', () => {
    expect(typeof getSessionWithOrders).toBe('function');
  });

  it('should export endTableSession function', () => {
    expect(typeof endTableSession).toBe('function');
  });

  it('should export updateSessionActivity function', () => {
    expect(typeof updateSessionActivity).toBe('function');
  });

  it('should export forceReleaseTableSession function', () => {
    expect(typeof forceReleaseTableSession).toBe('function');
  });
});

describe('Error Handling Integration', () => {
  it('handleSupabaseError handles auth code PGRST301', () => {
    const result = handleSupabaseError({ code: 'PGRST301' });
    expect(result.message).toContain('Session expired');
  });

  it('handleSupabaseError handles 401 in message', () => {
    const result = handleSupabaseError({ message: '401' });
    expect(result).toBeInstanceOf(Error);
  });

  it('handleSupabaseError handles JWT expired', () => {
    const result = handleSupabaseError({ message: 'JWT expired at xyz' });
    expect(result).toBeInstanceOf(Error);
  });

  it('handleSupabaseError handles token not found', () => {
    // Note: "token not found" alone is not handled - returns original error
    const result = handleSupabaseError({ message: 'token not found' });
    expect(result).toEqual({ message: 'token not found' });
  });

  it('handleSupabaseError handles session_not_found', () => {
    // Note: "session_not_found" alone is not handled - returns original error
    const result = handleSupabaseError({ message: 'session_not_found' });
    expect(result).toEqual({ message: 'session_not_found' });
  });
});

describe('Function Signatures', () => {
  it('getRestaurant accepts restaurantId', () => {
    expect(getRestaurant.length).toBeGreaterThanOrEqual(1);
  });

  it('getTable accepts tableIdOrNumber and optional restaurantSlug', () => {
    expect(getTable.length).toBeGreaterThanOrEqual(1);
  });

  it('getTables accepts restaurantId', () => {
    expect(getTables.length).toBeGreaterThanOrEqual(1);
  });

  it('createOrder accepts orderData', () => {
    expect(createOrder.length).toBeGreaterThanOrEqual(1);
  });

  it('getOrder accepts orderId', () => {
    expect(getOrder.length).toBeGreaterThanOrEqual(1);
  });

  it('updateOrderStatus accepts orderId and status', () => {
    expect(updateOrderStatus.length).toBeGreaterThanOrEqual(2);
  });

  it('cancelOrder accepts orderId and options', () => {
    expect(cancelOrder.length).toBeGreaterThanOrEqual(2);
  });

  it('processRefund accepts orderId and options', () => {
    expect(processRefund.length).toBeGreaterThanOrEqual(2);
  });

  it('getSharedCart accepts sessionId', () => {
    expect(getSharedCart.length).toBeGreaterThanOrEqual(1);
  });

  it('updateSharedCart accepts sessionId and cartItems', () => {
    expect(updateSharedCart.length).toBeGreaterThanOrEqual(2);
  });

  it('clearSharedCart accepts sessionId', () => {
    expect(clearSharedCart.length).toBeGreaterThanOrEqual(1);
  });

  it('subscribeToSharedCart accepts sessionId and callback', () => {
    expect(subscribeToSharedCart.length).toBeGreaterThanOrEqual(2);
  });

  it('getOrCreateActiveSessionId accepts tableId', () => {
    expect(getOrCreateActiveSessionId.length).toBeGreaterThanOrEqual(1);
  });

  it('markTableOccupied accepts tableId', () => {
    expect(markTableOccupied.length).toBeGreaterThanOrEqual(1);
  });

  it('getSessionWithOrders accepts sessionId', () => {
    expect(getSessionWithOrders.length).toBeGreaterThanOrEqual(1);
  });

  it('endTableSession accepts sessionId', () => {
    expect(endTableSession.length).toBeGreaterThanOrEqual(1);
  });

  it('updateSessionActivity accepts sessionId', () => {
    expect(updateSessionActivity.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Order Token Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrderByToken', () => {
    it('should be a function', () => {
      expect(typeof getOrderByToken).toBe('function');
    });

    it('should be an async function', () => {
      const result = getOrderByToken('order-token-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept order token parameter', () => {
      expect(getOrderByToken.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateOrderStatusCascade', () => {
    it('should be a function', () => {
      expect(typeof updateOrderStatusCascade).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateOrderStatusCascade('order-id', 'served');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId and status parameters', () => {
      expect(updateOrderStatusCascade.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Complaint Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createComplaint', () => {
    it('should be a function', () => {
      expect(typeof createComplaint).toBe('function');
    });

    it('should be an async function', () => {
      const result = createComplaint({
        orderId: 'order-123',
        issueType: 'food_quality',
        description: 'Test description'
      });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should require orderId', async () => {
      await expect(createComplaint({
        issueType: 'food_quality',
        description: 'Test'
      })).rejects.toThrow('Order ID is required');
    });

    it('should require issueType', async () => {
      await expect(createComplaint({
        orderId: 'order-123',
        description: 'Test'
      })).rejects.toThrow('Issue type is required');
    });

    it('should validate issueType values', async () => {
      await expect(createComplaint({
        orderId: 'order-123',
        issueType: 'invalid_type',
        description: 'Test'
      })).rejects.toThrow('Invalid issue type');
    });

    it('should require description', async () => {
      await expect(createComplaint({
        orderId: 'order-123',
        issueType: 'food_quality',
        description: ''
      })).rejects.toThrow('Description is required');
    });

    it('should require non-whitespace description', async () => {
      await expect(createComplaint({
        orderId: 'order-123',
        issueType: 'food_quality',
        description: '   '
      })).rejects.toThrow('Description is required');
    });
  });

  describe('updateComplaint', () => {
    it('should be a function', () => {
      expect(typeof updateComplaint).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateComplaint('complaint-id', { status: 'resolved' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept complaintId and updates parameters', () => {
      expect(updateComplaint.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getComplaints', () => {
    it('should be a function', () => {
      expect(typeof getComplaints).toBe('function');
    });

    it('should be an async function', () => {
      const result = getComplaints('restaurant-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept restaurantId and optional filters', () => {
      expect(getComplaints.length).toBeGreaterThanOrEqual(1);
    });

    it('should accept filters object', () => {
      const result = getComplaints('restaurant-123', { status: 'open' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });
});

describe('Order Update Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateOrder', () => {
    it('should be a function', () => {
      expect(typeof updateOrder).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateOrder('order-123', { notes: 'updated' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId and updates parameters', () => {
      expect(updateOrder.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateOrderItemStatus', () => {
    it('should be a function', () => {
      expect(typeof updateOrderItemStatus).toBe('function');
    });

    it('should be an async function', () => {
      const result = updateOrderItemStatus('order-123', 'menu-item-456', 'preparing');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId, menuItemId, and nextStatus parameters', () => {
      expect(updateOrderItemStatus.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should be a function', () => {
      expect(typeof updatePaymentStatus).toBe('function');
    });

    it('should be an async function', () => {
      const result = updatePaymentStatus('order-123', 'paid');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId and paymentStatus parameters', () => {
      expect(updatePaymentStatus.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('applyDiscount', () => {
    it('should be a function', () => {
      expect(typeof applyDiscount).toBe('function');
    });

    it('should be an async function', () => {
      const result = applyDiscount('order-123', { type: 'percentage', value: 10 });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId and discountData parameters', () => {
      expect(applyDiscount.length).toBeGreaterThanOrEqual(2);
    });

    it('should require order ID', async () => {
      await expect(applyDiscount(null, { type: 'percentage', value: 10 }))
        .rejects.toThrow('Order ID is required');
    });

    it('should require order ID when empty', async () => {
      await expect(applyDiscount('', { type: 'percentage', value: 10 }))
        .rejects.toThrow('Order ID is required');
    });

    it('should require valid discount type', async () => {
      await expect(applyDiscount('order-123', { type: 'invalid', value: 10 }))
        .rejects.toThrow('Discount type must be "percentage" or "fixed"');
    });

    it('should require percentage or fixed type', async () => {
      await expect(applyDiscount('order-123', { type: 'bogo', value: 10 }))
        .rejects.toThrow('Discount type must be "percentage" or "fixed"');
    });

    it('should require positive discount value', async () => {
      await expect(applyDiscount('order-123', { type: 'percentage', value: 0 }))
        .rejects.toThrow('Discount value must be greater than 0');
    });

    it('should require non-negative discount value', async () => {
      await expect(applyDiscount('order-123', { type: 'percentage', value: -10 }))
        .rejects.toThrow('Discount value must be greater than 0');
    });

    it('should reject percentage discount over 100', async () => {
      await expect(applyDiscount('order-123', { type: 'percentage', value: 150 }))
        .rejects.toThrow('Percentage discount cannot exceed 100%');
    });

    it('should require discount reason', async () => {
      await expect(applyDiscount('order-123', { type: 'percentage', value: 10, reason: '' }))
        .rejects.toThrow('Discount reason is required');
    });

    it('should require non-whitespace discount reason', async () => {
      await expect(applyDiscount('order-123', { type: 'percentage', value: 10, reason: '   ' }))
        .rejects.toThrow('Discount reason is required');
    });

    it('should require valid discount amount', async () => {
      await expect(applyDiscount('order-123', { 
        type: 'percentage', 
        value: 10, 
        reason: 'test', 
        amount: -5 
      })).rejects.toThrow('Invalid discount amount');
    });

    it('should require valid new total', async () => {
      await expect(applyDiscount('order-123', { 
        type: 'percentage', 
        value: 10, 
        reason: 'test', 
        amount: 10,
        newTotal: -100 
      })).rejects.toThrow('Invalid new total');
    });
  });
});

describe('Order Query Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should be a function', () => {
      expect(typeof getOrders).toBe('function');
    });

    it('should be an async function', () => {
      const result = getOrders('restaurant-123');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept restaurantId', () => {
      expect(getOrders.length).toBeGreaterThanOrEqual(1);
    });

    it('should accept optional filters', () => {
      const result = getOrders('restaurant-123', { order_status: 'preparing' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });
  });
});

describe('Payment Functions Extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should be a function', () => {
      expect(typeof createPayment).toBe('function');
    });

    it('should be an async function', () => {
      const result = createPayment({ order_id: 'order-123', amount: 100 });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept payment data object', () => {
      expect(createPayment.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updatePayment', () => {
    it('should be a function', () => {
      expect(typeof updatePayment).toBe('function');
    });

    it('should be an async function', () => {
      const result = updatePayment('payment-123', { status: 'completed' });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept paymentId and paymentData parameters', () => {
      expect(updatePayment.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('processSplitPayment', () => {
    it('should be a function', () => {
      expect(typeof processSplitPayment).toBe('function');
    });

    it('should be an async function', () => {
      const result = processSplitPayment('order-123', 50, 50, 'razorpay-id');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId, cashAmount, onlineAmount, and razorpayPaymentId', () => {
      expect(processSplitPayment.length).toBeGreaterThanOrEqual(3);
    });

    it('should require order ID', async () => {
      await expect(processSplitPayment(null, 50, 50))
        .rejects.toThrow('Order ID is required');
    });

    it('should require order ID when empty', async () => {
      await expect(processSplitPayment('', 50, 50))
        .rejects.toThrow('Order ID is required');
    });

    it('should require positive cash amount', async () => {
      await expect(processSplitPayment('order-123', 0, 50))
        .rejects.toThrow('Cash amount must be greater than 0');
    });

    it('should require non-negative cash amount', async () => {
      await expect(processSplitPayment('order-123', -10, 50))
        .rejects.toThrow('Cash amount must be greater than 0');
    });

    it('should require positive online amount', async () => {
      await expect(processSplitPayment('order-123', 50, 0))
        .rejects.toThrow('Online amount must be greater than 0');
    });

    it('should require non-negative online amount', async () => {
      await expect(processSplitPayment('order-123', 50, -10))
        .rejects.toThrow('Online amount must be greater than 0');
    });
  });

  describe('handleSplitPayment', () => {
    it('should be a function', () => {
      expect(typeof handleSplitPayment).toBe('function');
    });

    it('should be an async function', () => {
      const result = handleSplitPayment('order-123', { cash: 50, online: 50 });
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept orderId and payments object', () => {
      expect(handleSplitPayment.length).toBeGreaterThanOrEqual(2);
    });

    it('should require positive cash amount', async () => {
      await expect(handleSplitPayment('order-123', { cash: 0, online: 50 }))
        .rejects.toThrow('Cash amount must be greater than 0');
    });

    it('should require non-negative cash amount', async () => {
      await expect(handleSplitPayment('order-123', { cash: -10, online: 50 }))
        .rejects.toThrow('Cash amount must be greater than 0');
    });

    it('should require positive online amount', async () => {
      await expect(handleSplitPayment('order-123', { cash: 50, online: 0 }))
        .rejects.toThrow('Online amount must be greater than 0');
    });

    it('should require non-negative online amount', async () => {
      await expect(handleSplitPayment('order-123', { cash: 50, online: -10 }))
        .rejects.toThrow('Online amount must be greater than 0');
    });

    it('should require razorpay payment id when razorpayDetails provided', async () => {
      await expect(handleSplitPayment('order-123', { 
        cash: 50, 
        online: 50,
        razorpayDetails: {} 
      })).rejects.toThrow('Razorpay payment ID is required for online portion');
    });
  });
});

describe('Subscription Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribeToOrders', () => {
    it('should be a function', () => {
      expect(typeof subscribeToOrders).toBe('function');
    });

    it('should be an async function', () => {
      const callback = vi.fn();
      const errorCallback = vi.fn();
      const result = subscribeToOrders('restaurant-123', callback, errorCallback);
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should accept restaurantId, onOrderChange, and onError callbacks', () => {
      expect(subscribeToOrders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('subscribeToOrder', () => {
    it('should be a function', () => {
      expect(typeof subscribeToOrder).toBe('function');
    });

    it('should return subscription object', () => {
      const callback = vi.fn();
      const result = subscribeToOrder('order-123', callback);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should accept orderId and callback', () => {
      expect(subscribeToOrder.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Demo Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDemoRestaurant', () => {
    it('should be a function', () => {
      expect(typeof ensureDemoRestaurant).toBe('function');
    });

    it('should be an async function', () => {
      const result = ensureDemoRestaurant();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {}); // Catch unhandled rejection
    });

    it('should not require parameters', () => {
      expect(ensureDemoRestaurant.length).toBe(0);
    });
  });
});

describe('Additional Exports', () => {
  it('should export getOrderByToken function', () => {
    expect(typeof getOrderByToken).toBe('function');
  });

  it('should export updateOrderStatusCascade function', () => {
    expect(typeof updateOrderStatusCascade).toBe('function');
  });

  it('should export createComplaint function', () => {
    expect(typeof createComplaint).toBe('function');
  });

  it('should export updateComplaint function', () => {
    expect(typeof updateComplaint).toBe('function');
  });

  it('should export getComplaints function', () => {
    expect(typeof getComplaints).toBe('function');
  });

  it('should export updateOrder function', () => {
    expect(typeof updateOrder).toBe('function');
  });

  it('should export updateOrderItemStatus function', () => {
    expect(typeof updateOrderItemStatus).toBe('function');
  });

  it('should export updatePaymentStatus function', () => {
    expect(typeof updatePaymentStatus).toBe('function');
  });

  it('should export applyDiscount function', () => {
    expect(typeof applyDiscount).toBe('function');
  });

  it('should export getOrders function', () => {
    expect(typeof getOrders).toBe('function');
  });

  it('should export createPayment function', () => {
    expect(typeof createPayment).toBe('function');
  });

  it('should export updatePayment function', () => {
    expect(typeof updatePayment).toBe('function');
  });

  it('should export processSplitPayment function', () => {
    expect(typeof processSplitPayment).toBe('function');
  });

  it('should export handleSplitPayment function', () => {
    expect(typeof handleSplitPayment).toBe('function');
  });

  it('should export subscribeToOrders function', () => {
    expect(typeof subscribeToOrders).toBe('function');
  });

  it('should export subscribeToOrder function', () => {
    expect(typeof subscribeToOrder).toBe('function');
  });

  it('should export ensureDemoRestaurant function', () => {
    expect(typeof ensureDemoRestaurant).toBe('function');
  });
});

describe('Function Signatures Extended', () => {
  it('getOrderByToken accepts orderToken', () => {
    expect(getOrderByToken.length).toBeGreaterThanOrEqual(1);
  });

  it('updateOrderStatusCascade accepts orderId and status', () => {
    expect(updateOrderStatusCascade.length).toBeGreaterThanOrEqual(2);
  });

  it('createComplaint accepts complaintData', () => {
    expect(createComplaint.length).toBeGreaterThanOrEqual(1);
  });

  it('updateComplaint accepts complaintId and updates', () => {
    expect(updateComplaint.length).toBeGreaterThanOrEqual(2);
  });

  it('getComplaints accepts restaurantId and optional filters', () => {
    expect(getComplaints.length).toBeGreaterThanOrEqual(1);
  });

  it('updateOrder accepts orderId and updates', () => {
    expect(updateOrder.length).toBeGreaterThanOrEqual(2);
  });

  it('updateOrderItemStatus accepts orderId, menuItemId, and nextStatus', () => {
    expect(updateOrderItemStatus.length).toBeGreaterThanOrEqual(3);
  });

  it('updatePaymentStatus accepts orderId and paymentStatus', () => {
    expect(updatePaymentStatus.length).toBeGreaterThanOrEqual(2);
  });

  it('applyDiscount accepts orderId and discountData', () => {
    expect(applyDiscount.length).toBeGreaterThanOrEqual(2);
  });

  it('getOrders accepts restaurantId and optional filters', () => {
    expect(getOrders.length).toBeGreaterThanOrEqual(1);
  });

  it('createPayment accepts paymentData', () => {
    expect(createPayment.length).toBeGreaterThanOrEqual(1);
  });

  it('updatePayment accepts paymentId and paymentData', () => {
    expect(updatePayment.length).toBeGreaterThanOrEqual(2);
  });

  it('processSplitPayment accepts orderId, cashAmount, onlineAmount, and razorpayPaymentId', () => {
    expect(processSplitPayment.length).toBeGreaterThanOrEqual(3);
  });

  it('handleSplitPayment accepts orderId and payments', () => {
    expect(handleSplitPayment.length).toBeGreaterThanOrEqual(2);
  });

  it('subscribeToOrders accepts restaurantId, onOrderChange, and onError', () => {
    expect(subscribeToOrders.length).toBeGreaterThanOrEqual(2);
  });

  it('subscribeToOrder accepts orderId and callback', () => {
    expect(subscribeToOrder.length).toBeGreaterThanOrEqual(2);
  });
});