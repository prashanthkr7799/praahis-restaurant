/**
 * Payment Service Tests
 * Tests for payment processing and refund operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@config/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@config/supabase/restaurant', () => ({
  resolveRestaurantId: vi.fn(() => 'test-restaurant-id'),
}));

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to paid', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockUpdatedOrder = {
        id: 'order-123',
        payment_status: 'paid',
        order_status: 'received',
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

      const { updatePaymentStatus } = await import('./payments');

      const result = await updatePaymentStatus('order-123', 'paid');

      expect(result.payment_status).toBe('paid');
      expect(result.order_status).toBe('received');
    });
  });

  describe('createPayment', () => {
    it('should create a payment record', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        amount: 420,
        currency: 'INR',
        status: 'captured',
      };

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPayment,
              error: null,
            }),
          }),
        }),
      });

      const { createPayment } = await import('./payments');

      const result = await createPayment({
        order_id: 'order-123',
        amount: 420,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay',
      });

      expect(result.id).toBe('payment-123');
      expect(result.amount).toBe(420);
    });
  });

  describe('processRefund', () => {
    it('should process full refund for paid order', async () => {
      const { supabase } = await import('@config/supabase/client');

      // Mock fetching order
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                payment_status: 'paid',
                total: 420,
                order_payments: [{ id: 'payment-123', amount: 420, refund_amount: 0 }],
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock updating order
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'order-123',
                  payment_status: 'refunded',
                  refund_amount: 420,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock updating payment record
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { processRefund } = await import('./payments');

      const result = await processRefund('order-123', {
        refundAmount: 420,
        reason: 'Customer complaint',
        alreadyRefunded: 0,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('refunded');
      expect(result.totalRefunded).toBe(420);
    });

    it('should process partial refund', async () => {
      const { supabase } = await import('@config/supabase/client');

      // Mock fetching order
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                payment_status: 'paid',
                total: 420,
                order_payments: [],
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock updating order
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'order-123',
                  payment_status: 'partially_refunded',
                  refund_amount: 200,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { processRefund } = await import('./payments');

      const result = await processRefund('order-123', {
        refundAmount: 200,
        reason: 'Partial refund for wrong item',
        alreadyRefunded: 0,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('partially_refunded');
      expect(result.totalRefunded).toBe(200);
    });

    it('should reject refund for unpaid order', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                payment_status: 'pending',
                total: 420,
              },
              error: null,
            }),
          }),
        }),
      });

      const { processRefund } = await import('./payments');

      await expect(
        processRefund('order-123', {
          refundAmount: 420,
          reason: 'Test',
        })
      ).rejects.toThrow('Cannot process refund');
    });

    it('should reject refund exceeding paid amount', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                payment_status: 'paid',
                total: 420,
                order_payments: [{ id: 'payment-123', amount: 420, refund_amount: 0 }],
              },
              error: null,
            }),
          }),
        }),
      });

      const { processRefund } = await import('./payments');

      await expect(
        processRefund('order-123', {
          refundAmount: 500,
          reason: 'Too much refund',
          alreadyRefunded: 0,
        })
      ).rejects.toThrow('cannot exceed');
    });
  });

  describe('processSplitPayment', () => {
    it('should process split payment with cash and online', async () => {
      const { supabase } = await import('@config/supabase/client');

      // Mock fetching order
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                total: 420,
                restaurant_id: 'rest-123',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock updating order
      supabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'order-123',
                  payment_method: 'split',
                  payment_status: 'paid',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { processSplitPayment } = await import('./payments');

      const result = await processSplitPayment('order-123', 200, 220, null);

      expect(result.success).toBe(true);
      expect(result.order.payment_method).toBe('split');
      expect(result.splitDetails.cash_amount).toBe(200);
      expect(result.splitDetails.online_amount).toBe(220);
    });

    it('should reject split payment when total does not match', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                total: 420,
                restaurant_id: 'rest-123',
              },
              error: null,
            }),
          }),
        }),
      });

      const { processSplitPayment } = await import('./payments');

      await expect(processSplitPayment('order-123', 100, 100, null)).rejects.toThrow(
        'does not match order total'
      );
    });
  });
});
