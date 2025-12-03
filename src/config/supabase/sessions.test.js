/**
 * Sessions Service Tests
 * Tests for table session management and shared cart operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('./client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          order: vi.fn(),
        })),
        is: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      send: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock logger
vi.mock('@shared/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Sessions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSharedCart', () => {
    it('should return cart items when session exists', async () => {
      const { supabase } = await import('./client');

      const mockCart = [
        { id: 'item-1', name: 'Biryani', quantity: 2, price: 250 },
        { id: 'item-2', name: 'Naan', quantity: 3, price: 40 },
      ];

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { cart_items: mockCart },
              error: null,
            }),
          }),
        }),
      });

      const { getSharedCart } = await import('./sessions');
      const result = await getSharedCart('session-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Biryani');
      expect(result[1].name).toBe('Naan');
    });

    it('should return empty array when no cart', async () => {
      const { supabase } = await import('./client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { cart_items: null },
              error: null,
            }),
          }),
        }),
      });

      const { getSharedCart } = await import('./sessions');
      const result = await getSharedCart('session-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      const { supabase } = await import('./client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Session not found' },
            }),
          }),
        }),
      });

      const { getSharedCart } = await import('./sessions');
      const result = await getSharedCart('invalid-session');

      expect(result).toEqual([]);
    });
  });

  describe('updateSharedCart', () => {
    it('should update cart successfully', async () => {
      const { supabase } = await import('./client');

      const newCart = [{ id: 'item-1', name: 'Biryani', quantity: 3, price: 250 }];

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          // Simulate subscription callback
          if (callback) callback('SUBSCRIBED');
          return mockChannel;
        }),
        send: vi.fn(),
        unsubscribe: vi.fn(),
      };

      supabase.channel.mockReturnValue(mockChannel);
      supabase.removeChannel.mockResolvedValue(undefined);

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ cart_items: newCart, status: 'active' }],
              error: null,
            }),
          }),
        }),
      });

      const { updateSharedCart } = await import('./sessions');
      const result = await updateSharedCart('session-123', newCart);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3);
    });

    it('should throw error when session not found', async () => {
      const { supabase } = await import('./client');

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const { updateSharedCart } = await import('./sessions');

      await expect(updateSharedCart('invalid-session', [])).rejects.toThrow('Session not found');
    });
  });

  describe('clearSharedCart', () => {
    it('should clear cart and return true', async () => {
      const { supabase } = await import('./client');

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { clearSharedCart } = await import('./sessions');
      const result = await clearSharedCart('session-123');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const { supabase } = await import('./client');

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      const { clearSharedCart } = await import('./sessions');
      const result = await clearSharedCart('session-123');

      expect(result).toBe(false);
    });
  });

  describe('subscribeToSharedCart', () => {
    it('should set up realtime subscription', async () => {
      const { supabase } = await import('./client');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      };

      supabase.channel.mockReturnValue(mockChannel);

      const { subscribeToSharedCart } = await import('./sessions');

      const callback = vi.fn();
      subscribeToSharedCart('session-123', callback);

      expect(supabase.channel).toHaveBeenCalledWith('table-session-session-123');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should return unsubscribe function', async () => {
      const { supabase } = await import('./client');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      };

      supabase.channel.mockReturnValue(mockChannel);

      const { subscribeToSharedCart } = await import('./sessions');

      const callback = vi.fn();
      const unsubscribe = subscribeToSharedCart('session-123', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('endTableSession', () => {
    it('should call RPC to end session', async () => {
      const { supabase } = await import('./client');

      supabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { endTableSession } = await import('./sessions');
      const result = await endTableSession('session-123');

      expect(supabase.rpc).toHaveBeenCalledWith('end_table_session', {
        p_session_id: 'session-123',
      });
      expect(result.success).toBe(true);
    });

    it('should throw error on failure', async () => {
      const { supabase } = await import('./client');

      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Failed to end session' },
      });

      const { endTableSession } = await import('./sessions');

      await expect(endTableSession('invalid-session')).rejects.toThrow();
    });
  });

  describe('getSessionWithOrders', () => {
    it('should return session with orders', async () => {
      const { supabase } = await import('./client');

      const mockSession = {
        id: 'session-123',
        table_id: 'table-1',
        status: 'active',
      };

      const mockOrders = [
        { id: 'order-1', total: 500 },
        { id: 'order-2', total: 300 },
      ];

      // First call for session
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSession,
              error: null,
            }),
          }),
        }),
      });

      // Second call for orders
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrders,
              error: null,
            }),
          }),
        }),
      });

      const { getSessionWithOrders } = await import('./sessions');
      const result = await getSessionWithOrders('session-123');

      expect(result.id).toBe('session-123');
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].total).toBe(500);
    });
  });
});
