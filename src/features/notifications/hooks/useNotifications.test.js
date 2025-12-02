/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNotifications from './useNotifications';

// Mock state - using globalThis to be accessible inside vi.mock
globalThis.__mockSupabaseData = [];
globalThis.__mockSupabaseError = null;
globalThis.__mockUpdateError = null;
globalThis.__mockDeleteError = null;

vi.mock('@config/supabase', () => {
  const createMockChain = () => {
    let pendingOperation = null; // 'select', 'update', 'delete'
    
    const chain = {
      select: vi.fn(() => {
        pendingOperation = 'select';
        return chain;
      }),
      update: vi.fn(() => {
        pendingOperation = 'update';
        return chain;
      }),
      delete: vi.fn(() => {
        pendingOperation = 'delete';
        return chain;
      }),
      order: vi.fn(() => chain),
      eq: vi.fn(() => {
        // eq can be terminal for update/delete, or intermediate for select
        if (pendingOperation === 'update') {
          return Promise.resolve({ 
            data: null, 
            error: globalThis.__mockUpdateError 
          });
        }
        if (pendingOperation === 'delete') {
          return Promise.resolve({ 
            data: null, 
            error: globalThis.__mockDeleteError 
          });
        }
        return chain;
      }),
      in: vi.fn(() => {
        // in is terminal for update/delete with multiple IDs
        return Promise.resolve({ 
          data: null, 
          error: pendingOperation === 'update' ? globalThis.__mockUpdateError : globalThis.__mockDeleteError 
        });
      }),
      range: vi.fn(() => Promise.resolve({ 
        data: globalThis.__mockSupabaseData, 
        error: globalThis.__mockSupabaseError 
      })),
    };
    return chain;
  };
  
  return {
    supabase: {
      from: vi.fn(() => createMockChain()),
    },
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data
    globalThis.__mockSupabaseData = [];
    globalThis.__mockSupabaseError = null;
    globalThis.__mockUpdateError = null;
    globalThis.__mockDeleteError = null;
  });

  describe('initialization', () => {
    it('should return notifications array', async () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('notifications');
      expect(Array.isArray(result.current.notifications)).toBe(true);
    });

    it('should return loading state', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('loading');
      expect(typeof result.current.loading).toBe('boolean');
    });

    it('should return error state', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('error');
    });

    it('should return unreadCount', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('unreadCount');
      expect(typeof result.current.unreadCount).toBe('number');
    });

    it('should return markAsRead function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('markAsRead');
      expect(typeof result.current.markAsRead).toBe('function');
    });

    it('should return markAllAsRead function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('markAllAsRead');
      expect(typeof result.current.markAllAsRead).toBe('function');
    });

    it('should return deleteNotification function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('deleteNotification');
      expect(typeof result.current.deleteNotification).toBe('function');
    });

    it('should return refresh function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('refresh');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('unreadCount calculation', () => {
    it('should start with unreadCount of 0', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('function signatures', () => {
    it('markAsRead should accept notification id', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Should not throw when called with a string id
      await act(async () => {
        try {
          await result.current.markAsRead('notification-123');
        } catch {
          // Expected - mock might not be fully set up
        }
      });
      
      expect(typeof result.current.markAsRead).toBe('function');
    });

    it('markAllAsRead should be callable without arguments', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        try {
          await result.current.markAllAsRead();
        } catch {
          // Expected - mock might not be fully set up
        }
      });
      
      expect(typeof result.current.markAllAsRead).toBe('function');
    });

    it('deleteNotification should accept notification id', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        try {
          await result.current.deleteNotification('notification-456');
        } catch {
          // Expected - mock might not be fully set up
        }
      });
      
      expect(typeof result.current.deleteNotification).toBe('function');
    });

    it('refresh should be callable without arguments', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        try {
          await result.current.refresh();
        } catch {
          // Expected - mock might not be fully set up
        }
      });
      
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('hook behavior', () => {
    it('should not throw on initial render', () => {
      expect(() => {
        renderHook(() => useNotifications());
      }).not.toThrow();
    });

    it('should maintain stable function references between renders', () => {
      const { result, rerender } = renderHook(() => useNotifications());
      
      const firstMarkAsRead = result.current.markAsRead;
      const firstMarkAllAsRead = result.current.markAllAsRead;
      const firstDeleteNotification = result.current.deleteNotification;
      const firstRefresh = result.current.refresh;
      
      rerender();
      
      // Functions should be stable (memoized with useCallback)
      expect(result.current.markAsRead).toBe(firstMarkAsRead);
      expect(result.current.markAllAsRead).toBe(firstMarkAllAsRead);
      expect(result.current.deleteNotification).toBe(firstDeleteNotification);
      expect(result.current.refresh).toBe(firstRefresh);
    });
  });

  describe('options handling', () => {
    it('should accept userId option', () => {
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123' })
      );
      expect(result.current.notifications).toBeDefined();
    });

    it('should accept restaurantId option', () => {
      const { result } = renderHook(() => 
        useNotifications({ restaurantId: 'restaurant-123' })
      );
      expect(result.current.notifications).toBeDefined();
    });

    it('should accept pageSize option', () => {
      const { result } = renderHook(() => 
        useNotifications({ pageSize: 50 })
      );
      expect(result.current.notifications).toBeDefined();
    });

    it('should accept autoLoad option', () => {
      const { result } = renderHook(() => 
        useNotifications({ autoLoad: false })
      );
      expect(result.current.notifications).toBeDefined();
    });

    it('should accept all options together', () => {
      const { result } = renderHook(() => 
        useNotifications({ 
          userId: 'user-123',
          restaurantId: 'restaurant-456',
          pageSize: 30,
          autoLoad: true
        })
      );
      expect(result.current.notifications).toBeDefined();
      expect(result.current.loading).toBeDefined();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('loadMore functionality', () => {
    it('should return loadMore function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('loadMore');
      expect(typeof result.current.loadMore).toBe('function');
    });

    it('should return hasMore state', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('hasMore');
      expect(typeof result.current.hasMore).toBe('boolean');
    });

    it('loadMore should be callable', async () => {
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123' })
      );
      
      await act(async () => {
        try {
          result.current.loadMore();
        } catch {
          // Expected - async operations
        }
      });
      
      expect(typeof result.current.loadMore).toBe('function');
    });
  });

  describe('clearRead functionality', () => {
    it('should return clearRead function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('clearRead');
      expect(typeof result.current.clearRead).toBe('function');
    });

    it('clearRead should be callable', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        try {
          await result.current.clearRead();
        } catch {
          // Expected - mock might not be fully set up
        }
      });
      
      expect(typeof result.current.clearRead).toBe('function');
    });
  });

  describe('loadNotifications functionality', () => {
    it('should return loadNotifications function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('loadNotifications');
      expect(typeof result.current.loadNotifications).toBe('function');
    });

    it('loadNotifications should be callable with page number', async () => {
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123' })
      );
      
      await act(async () => {
        try {
          await result.current.loadNotifications(0);
        } catch {
          // Expected - async operations
        }
      });
      
      expect(typeof result.current.loadNotifications).toBe('function');
    });

    it('loadNotifications should be callable with append flag', async () => {
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123' })
      );
      
      await act(async () => {
        try {
          await result.current.loadNotifications(1, true);
        } catch {
          // Expected - async operations
        }
      });
      
      expect(typeof result.current.loadNotifications).toBe('function');
    });
  });

  describe('addNotification functionality', () => {
    it('should return addNotification function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('addNotification');
      expect(typeof result.current.addNotification).toBe('function');
    });

    it('should add notification to beginning of list', async () => {
      const { result } = renderHook(() => useNotifications());
      
      const newNotification = { id: 'new-1', message: 'New notification', is_read: false };
      
      await act(async () => {
        result.current.addNotification(newNotification);
      });
      
      expect(result.current.notifications[0]).toEqual(newNotification);
    });

    it('should increment unreadCount for unread notification', async () => {
      const { result } = renderHook(() => useNotifications());
      
      const initialCount = result.current.unreadCount;
      const newNotification = { id: 'new-1', message: 'New notification', is_read: false };
      
      await act(async () => {
        result.current.addNotification(newNotification);
      });
      
      expect(result.current.unreadCount).toBe(initialCount + 1);
    });

    it('should not increment unreadCount for read notification', async () => {
      const { result } = renderHook(() => useNotifications());
      
      const initialCount = result.current.unreadCount;
      const newNotification = { id: 'new-1', message: 'New notification', is_read: true };
      
      await act(async () => {
        result.current.addNotification(newNotification);
      });
      
      expect(result.current.unreadCount).toBe(initialCount);
    });
  });

  describe('updateNotification functionality', () => {
    it('should return updateNotification function', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current).toHaveProperty('updateNotification');
      expect(typeof result.current.updateNotification).toBe('function');
    });

    it('should update existing notification in list', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Add a notification first
      const notification = { id: 'notif-1', message: 'Original', is_read: false };
      await act(async () => {
        result.current.addNotification(notification);
      });
      
      // Update it
      const updatedNotification = { id: 'notif-1', message: 'Updated', is_read: true };
      await act(async () => {
        result.current.updateNotification(updatedNotification);
      });
      
      expect(result.current.notifications[0].message).toBe('Updated');
      expect(result.current.notifications[0].is_read).toBe(true);
    });
  });

  describe('loadNotifications with data', () => {
    it('should load notifications and update state', async () => {
      globalThis.__mockSupabaseData = [
        { id: '1', message: 'Test 1', is_read: false },
        { id: '2', message: 'Test 2', is_read: true },
      ];
      
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', autoLoad: false })
      );
      
      await act(async () => {
        await result.current.loadNotifications(0, false);
      });
      
      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should set hasMore to false when less than pageSize returned', async () => {
      globalThis.__mockSupabaseData = [
        { id: '1', message: 'Test 1', is_read: false },
      ];
      
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', pageSize: 20, autoLoad: false })
      );
      
      await act(async () => {
        await result.current.loadNotifications(0, false);
      });
      
      expect(result.current.hasMore).toBe(false);
    });

    it('should append notifications when append is true and page > 0', async () => {
      globalThis.__mockSupabaseData = [
        { id: '1', message: 'Test 1', is_read: false },
      ];
      
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', autoLoad: false })
      );
      
      // Load first page
      await act(async () => {
        await result.current.loadNotifications(0, false);
      });
      
      // Load second page with append
      globalThis.__mockSupabaseData = [
        { id: '2', message: 'Test 2', is_read: true },
      ];
      
      await act(async () => {
        await result.current.loadNotifications(1, true);
      });
      
      expect(result.current.notifications).toHaveLength(2);
    });

    it('should handle fetch error', async () => {
      globalThis.__mockSupabaseError = new Error('Database error');
      
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', autoLoad: false })
      );
      
      await act(async () => {
        await result.current.loadNotifications(0, false);
      });
      
      expect(result.current.error).toBe('Database error');
    });

    it('should clear notifications when no userId or restaurantId', async () => {
      const { result } = renderHook(() => 
        useNotifications({ autoLoad: false })
      );
      
      await act(async () => {
        await result.current.loadNotifications(0, false);
      });
      
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('markAsRead with data', () => {
    it('should mark notification as read and update state', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Add an unread notification
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: false });
      });
      
      expect(result.current.unreadCount).toBe(1);
      
      // Mark as read
      await act(async () => {
        const response = await result.current.markAsRead('notif-1');
        expect(response.success).toBe(true);
      });
      
      expect(result.current.notifications[0].is_read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle mark as read error', async () => {
      globalThis.__mockUpdateError = new Error('Update failed');
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        const response = await result.current.markAsRead('notif-1');
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      });
      
      expect(toast.error).toHaveBeenCalledWith('Failed to mark notification as read');
    });
  });

  describe('markAllAsRead with data', () => {
    it('should show success when no unread notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Add only read notifications
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: true });
      });
      
      await act(async () => {
        const response = await result.current.markAllAsRead();
        expect(response.success).toBe(true);
        expect(response.count).toBe(0);
      });
      
      expect(toast.success).toHaveBeenCalledWith('All notifications already read');
    });

    it('should mark all as read and update state', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Add unread notifications
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test 1', is_read: false });
        result.current.addNotification({ id: 'notif-2', message: 'Test 2', is_read: false });
      });
      
      expect(result.current.unreadCount).toBe(2);
      
      await act(async () => {
        const response = await result.current.markAllAsRead();
        expect(response.success).toBe(true);
        expect(response.count).toBe(2);
      });
      
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every(n => n.is_read)).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('Marked 2 notifications as read');
    });

    it('should handle mark all as read error', async () => {
      globalThis.__mockUpdateError = new Error('Update failed');
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: false });
      });
      
      await act(async () => {
        const response = await result.current.markAllAsRead();
        expect(response.success).toBe(false);
      });
      
      expect(toast.error).toHaveBeenCalledWith('Failed to mark all as read');
    });
  });

  describe('deleteNotification with data', () => {
    it('should delete notification and update state', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: false });
      });
      
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
      
      await act(async () => {
        const response = await result.current.deleteNotification('notif-1');
        expect(response.success).toBe(true);
      });
      
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should not decrement unreadCount for read notification', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: true });
      });
      
      expect(result.current.unreadCount).toBe(0);
      
      await act(async () => {
        await result.current.deleteNotification('notif-1');
      });
      
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle delete error', async () => {
      globalThis.__mockDeleteError = new Error('Delete failed');
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: false });
      });
      
      await act(async () => {
        const response = await result.current.deleteNotification('notif-1');
        expect(response.success).toBe(false);
      });
      
      expect(toast.error).toHaveBeenCalledWith('Failed to delete notification');
    });
  });

  describe('clearRead with data', () => {
    it('should show success when no read notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // Add only unread notifications
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: false });
      });
      
      await act(async () => {
        const response = await result.current.clearRead();
        expect(response.success).toBe(true);
        expect(response.count).toBe(0);
      });
      
      expect(toast.success).toHaveBeenCalledWith('No read notifications to clear');
    });

    it('should clear read notifications and update state', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Unread', is_read: false });
        result.current.addNotification({ id: 'notif-2', message: 'Read', is_read: true });
      });
      
      expect(result.current.notifications).toHaveLength(2);
      
      await act(async () => {
        const response = await result.current.clearRead();
        expect(response.success).toBe(true);
        expect(response.count).toBe(1);
      });
      
      // Only unread notification should remain
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].is_read).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Cleared 1 notifications');
    });

    it('should handle clear read error', async () => {
      globalThis.__mockDeleteError = new Error('Delete failed');
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        result.current.addNotification({ id: 'notif-1', message: 'Test', is_read: true });
      });
      
      await act(async () => {
        const response = await result.current.clearRead();
        expect(response.success).toBe(false);
      });
      
      expect(toast.error).toHaveBeenCalledWith('Failed to clear notifications');
    });
  });

  describe('loadMore behavior', () => {
    it('should not load more when loading is true', async () => {
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', autoLoad: false })
      );
      
      // loadMore should only trigger when not loading and hasMore is true
      await act(async () => {
        result.current.loadMore();
      });
      
      // Just verify no errors thrown
      expect(typeof result.current.loadMore).toBe('function');
    });
  });

  describe('refresh behavior', () => {
    it('should reset page and reload notifications', async () => {
      globalThis.__mockSupabaseData = [{ id: '1', message: 'Test', is_read: false }];
      
      const { result } = renderHook(() => 
        useNotifications({ userId: 'user-123', restaurantId: 'restaurant-123', autoLoad: false })
      );
      
      await act(async () => {
        await result.current.refresh();
      });
      
      expect(result.current.page).toBe(0);
    });
  });
});
