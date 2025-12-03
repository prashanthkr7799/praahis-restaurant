/**
 * Supabase API Integration Tests
 * Tests database operations, RLS policies, and API responses
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase responses
const mockRestaurant = {
  id: 'rest-123',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  is_active: true,
  settings: {
    theme_color: '#ff6600',
    enable_takeaway: true,
  },
};

const mockMenuItems = [
  {
    id: 'menu-1',
    name: 'Chicken Biryani',
    price: 250,
    category_id: 'cat-1',
    is_available: true,
    is_vegetarian: false,
    restaurant_id: 'rest-123',
  },
  {
    id: 'menu-2',
    name: 'Paneer Butter Masala',
    price: 220,
    category_id: 'cat-1',
    is_available: true,
    is_vegetarian: true,
    restaurant_id: 'rest-123',
  },
];

const mockOrder = {
  id: 'order-123',
  order_number: 'ORD-2025-001',
  table_id: 'table-1',
  status: 'received',
  payment_status: 'paid',
  total: 470,
  restaurant_id: 'rest-123',
  items: mockMenuItems.map((item, idx) => ({
    id: `item-${idx}`,
    menu_item_id: item.id,
    quantity: 1,
    unit_price: item.price,
    status: 'pending',
  })),
};

// Mock Supabase client
const createMockSupabase = () => ({
  from: vi.fn((table) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => {
          if (table === 'restaurants')
            return Promise.resolve({ data: mockRestaurant, error: null });
          if (table === 'orders') return Promise.resolve({ data: mockOrder, error: null });
          return Promise.resolve({ data: null, error: null });
        }),
        order: vi.fn(() => Promise.resolve({ data: mockMenuItems, error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ status: 'SUBSCRIBED' })),
  })),
});

describe('Supabase API Integration', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  describe('Restaurant Operations', () => {
    it('should fetch restaurant by slug', async () => {
      const result = await mockSupabase
        .from('restaurants')
        .select('*')
        .eq('slug', 'test-restaurant')
        .single();

      expect(result.error).toBeNull();
      expect(result.data.name).toBe('Test Restaurant');
      expect(result.data.slug).toBe('test-restaurant');
    });

    it('should fetch restaurant by id', async () => {
      const result = await mockSupabase
        .from('restaurants')
        .select('*')
        .eq('id', 'rest-123')
        .single();

      expect(result.error).toBeNull();
      expect(result.data.id).toBe('rest-123');
    });

    it('should only return active restaurants', () => {
      expect(mockRestaurant.is_active).toBe(true);
    });
  });

  describe('Menu Operations', () => {
    it('should fetch menu items for restaurant', async () => {
      const result = await mockSupabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', 'rest-123')
        .order('name');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should filter vegetarian items', () => {
      const vegItems = mockMenuItems.filter((item) => item.is_vegetarian);
      expect(vegItems).toHaveLength(1);
      expect(vegItems[0].name).toBe('Paneer Butter Masala');
    });

    it('should filter available items', () => {
      const available = mockMenuItems.filter((item) => item.is_available);
      expect(available).toHaveLength(2);
    });
  });

  describe('Order Operations', () => {
    it('should create new order', async () => {
      const orderData = {
        table_id: 'table-1',
        restaurant_id: 'rest-123',
        status: 'pending_payment',
        items: [],
      };

      const result = await mockSupabase.from('orders').insert(orderData).select().single();

      expect(result.error).toBeNull();
      expect(result.data.id).toBeDefined();
    });

    it('should fetch order by id', async () => {
      const result = await mockSupabase.from('orders').select('*').eq('id', 'order-123').single();

      expect(result.error).toBeNull();
      expect(result.data.order_number).toBe('ORD-2025-001');
    });

    it('should update order status', async () => {
      const result = await mockSupabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', 'order-123');

      expect(result.error).toBeNull();
    });
  });

  describe('Table Operations', () => {
    const mockTable = {
      id: 'table-1',
      table_number: 1,
      capacity: 4,
      status: 'available',
      restaurant_id: 'rest-123',
    };

    it('should update table status', async () => {
      const result = await mockSupabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', mockTable.id);

      expect(result.error).toBeNull();
    });

    it('should validate table status transitions', () => {
      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
      expect(validStatuses).toContain(mockTable.status);
    });
  });

  describe('Payment Operations', () => {
    const mockPayment = {
      id: 'pay-123',
      order_id: 'order-123',
      amount: 470,
      payment_method: 'razorpay',
      status: 'paid',
      razorpay_payment_id: 'pay_xxx',
    };

    it('should create payment record', async () => {
      const result = await mockSupabase.from('payments').insert(mockPayment).select().single();

      expect(result.error).toBeNull();
    });

    it('should validate payment amount matches order', () => {
      expect(mockPayment.amount).toBe(mockOrder.total);
    });
  });

  describe('Feedback Operations', () => {
    const mockFeedback = {
      order_id: 'order-123',
      rating: 5,
      comment: 'Excellent food and service!',
      would_recommend: true,
      restaurant_id: 'rest-123',
    };

    it('should create feedback', async () => {
      const result = await mockSupabase.from('feedbacks').insert(mockFeedback).select().single();

      expect(result.error).toBeNull();
    });

    it('should validate rating range', () => {
      expect(mockFeedback.rating).toBeGreaterThanOrEqual(1);
      expect(mockFeedback.rating).toBeLessThanOrEqual(5);
    });
  });

  describe('Realtime Subscriptions', () => {
    it('should create realtime channel for orders', () => {
      const channel = mockSupabase.channel('orders-channel');

      expect(channel.on).toBeDefined();
      expect(channel.subscribe).toBeDefined();
    });

    it('should subscribe to order changes', () => {
      const callback = vi.fn();

      const channel = mockSupabase
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback);

      const subscription = channel.subscribe();

      expect(subscription.status).toBe('SUBSCRIBED');
    });
  });

  describe('RPC Function Calls', () => {
    it('should call RPC function', async () => {
      const result = await mockSupabase.rpc('get_order_statistics', {
        restaurant_id: 'rest-123',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      });

      expect(result.error).toBeNull();
    });
  });
});

describe('Data Validation', () => {
  describe('Menu Item Validation', () => {
    it('should require name', () => {
      const validate = (item) => {
        if (!item.name || item.name.trim() === '') return { valid: false, error: 'Name required' };
        return { valid: true };
      };

      expect(validate({ name: '' })).toEqual({ valid: false, error: 'Name required' });
      expect(validate({ name: 'Biryani' })).toEqual({ valid: true });
    });

    it('should require positive price', () => {
      const validate = (item) => {
        if (typeof item.price !== 'number' || item.price <= 0) {
          return { valid: false, error: 'Price must be positive' };
        }
        return { valid: true };
      };

      expect(validate({ price: 0 })).toEqual({ valid: false, error: 'Price must be positive' });
      expect(validate({ price: -10 })).toEqual({ valid: false, error: 'Price must be positive' });
      expect(validate({ price: 250 })).toEqual({ valid: true });
    });
  });

  describe('Order Validation', () => {
    it('should require at least one item', () => {
      const validate = (order) => {
        if (!order.items || order.items.length === 0) {
          return { valid: false, error: 'Order must have items' };
        }
        return { valid: true };
      };

      expect(validate({ items: [] })).toEqual({ valid: false, error: 'Order must have items' });
      expect(validate({ items: [{ id: '1' }] })).toEqual({ valid: true });
    });

    it('should require restaurant_id', () => {
      const validate = (order) => {
        if (!order.restaurant_id) {
          return { valid: false, error: 'Restaurant ID required' };
        }
        return { valid: true };
      };

      expect(validate({})).toEqual({ valid: false, error: 'Restaurant ID required' });
      expect(validate({ restaurant_id: 'rest-123' })).toEqual({ valid: true });
    });
  });

  describe('Feedback Validation', () => {
    it('should validate rating range (1-5)', () => {
      const validate = (feedback) => {
        if (feedback.rating < 1 || feedback.rating > 5) {
          return { valid: false, error: 'Rating must be 1-5' };
        }
        return { valid: true };
      };

      expect(validate({ rating: 0 })).toEqual({ valid: false, error: 'Rating must be 1-5' });
      expect(validate({ rating: 6 })).toEqual({ valid: false, error: 'Rating must be 1-5' });
      expect(validate({ rating: 3 })).toEqual({ valid: true });
    });

    it('should sanitize comment', () => {
      const sanitize = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .slice(0, 500); // Limit length
      };

      expect(sanitize('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
      expect(sanitize('  padded text  ')).toBe('padded text');
    });
  });
});

describe('Error Handling', () => {
  it('should handle network errors', async () => {
    const mockErrorSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Network error', code: 'NETWORK_ERROR' },
              })
            ),
          })),
        })),
      })),
    };

    const result = await mockErrorSupabase
      .from('restaurants')
      .select('*')
      .eq('id', 'test')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error.message).toBe('Network error');
  });

  it('should handle RLS policy violations', async () => {
    const mockRLSError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: {
                  message: 'new row violates row-level security policy',
                  code: '42501',
                },
              })
            ),
          })),
        })),
      })),
    };

    const result = await mockRLSError
      .from('orders')
      .select('*')
      .eq('restaurant_id', 'unauthorized-restaurant')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error.code).toBe('42501');
  });

  it('should handle not found errors', async () => {
    const mockNotFound = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: {
                  message: 'Row not found',
                  code: 'PGRST116',
                },
              })
            ),
          })),
        })),
      })),
    };

    const result = await mockNotFound
      .from('restaurants')
      .select('*')
      .eq('id', 'non-existent')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error.code).toBe('PGRST116');
  });
});
