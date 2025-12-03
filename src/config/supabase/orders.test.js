/**
 * Order Service Tests
 * Tests for order CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing order functions
vi.mock('@config/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
        neq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
  default: {
    from: vi.fn(),
  },
}));

vi.mock('@config/supabase/restaurant', () => ({
  resolveRestaurantId: vi.fn(() => 'test-restaurant-id'),
}));

vi.mock('@config/supabase/sessions', () => ({
  getOrCreateActiveSessionId: vi.fn(() => 'test-session-id'),
}));

vi.mock('@shared/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Creation', () => {
    it('should create an order with required fields', async () => {
      // Import after mocking
      const { supabase } = await import('@config/supabase/client');

      const mockOrder = {
        id: 'order-123',
        order_number: 'ORD-001',
        restaurant_id: 'test-restaurant-id',
        table_id: 'table-123',
        items: [{ id: 'item-1', name: 'Pizza', quantity: 2, price: 200 }],
        subtotal: 400,
        tax: 20,
        total: 420,
        order_status: 'pending_payment',
        payment_status: 'pending',
      };

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockOrder],
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const { createOrder } = await import('./orders');

      const result = await createOrder({
        table_id: 'table-123',
        items: [{ id: 'item-1', name: 'Pizza', quantity: 2, price: 200 }],
        subtotal: 400,
        tax: 20,
        total: 420,
      });

      expect(result).toBeTruthy();
      expect(result.id).toBe('order-123');
    });

    it('should throw error when order creation fails', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const { createOrder } = await import('./orders');

      await expect(
        createOrder({
          items: [],
          total: 0,
        })
      ).rejects.toThrow('Failed to create order');
    });
  });

  describe('Order Status Update', () => {
    it('should update order status', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockUpdatedOrder = {
        id: 'order-123',
        order_status: 'preparing',
      };

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedOrder,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { updateOrderStatus } = await import('./orders');

      const result = await updateOrderStatus('order-123', 'preparing');

      expect(result.order_status).toBe('preparing');
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel an order with valid reason', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockCancelledOrder = {
        id: 'order-123',
        order_status: 'cancelled',
        cancellation_reason: 'Customer requested',
      };

      // First call for fetching order status
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { order_status: 'received', payment_status: 'paid', total: 420 },
              error: null,
            }),
          }),
        }),
      });

      // Second call for updating order
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCancelledOrder,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { cancelOrder } = await import('./orders');

      const result = await cancelOrder('order-123', { reason: 'Customer requested' });

      expect(result.order_status).toBe('cancelled');
    });

    it('should throw error when cancelling served order', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { order_status: 'served', payment_status: 'paid', total: 420 },
              error: null,
            }),
          }),
        }),
      });

      const { cancelOrder } = await import('./orders');

      await expect(cancelOrder('order-123', { reason: 'Test' })).rejects.toThrow(
        'Cannot cancel order'
      );
    });

    it('should throw error when reason is missing', async () => {
      const { cancelOrder } = await import('./orders');

      await expect(cancelOrder('order-123', { reason: '' })).rejects.toThrow(
        'Cancellation reason is required'
      );
    });
  });

  describe('Apply Discount', () => {
    it('should apply valid percentage discount', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockOrder = {
        id: 'order-123',
        total: 400,
        discount_amount: 40,
        discount_reason: 'Loyalty discount',
      };

      // Fetch order
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total: 400, subtotal: 400, discount_amount: 0 },
              error: null,
            }),
          }),
        }),
      });

      // Update order
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockOrder,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { applyDiscount } = await import('./orders');

      const result = await applyDiscount('order-123', {
        type: 'percentage',
        value: 10,
        amount: 40,
        reason: 'Loyalty discount',
        newTotal: 360,
      });

      expect(result.discount_amount).toBe(40);
    });

    it('should reject discount greater than order total', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total: 100, subtotal: 100, discount_amount: 0 },
              error: null,
            }),
          }),
        }),
      });

      const { applyDiscount } = await import('./orders');

      await expect(
        applyDiscount('order-123', {
          type: 'fixed',
          value: 200,
          amount: 200,
          reason: 'Too much discount',
          newTotal: -100,
        })
      ).rejects.toThrow('Invalid');
    });
  });
});
