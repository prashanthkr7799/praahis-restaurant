/**
 * Event Bus Tests
 * Tests for the central event management system
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, EventBus } from './eventBus';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    // Create fresh instance for each test
    bus = new EventBus();
  });

  describe('on (subscribe)', () => {
    it('should add a listener for an event', () => {
      const callback = vi.fn();
      
      bus.on('test-event', callback);
      
      expect(bus.listenerCount('test-event')).toBe(1);
    });

    it('should allow multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      bus.on('test-event', callback1);
      bus.on('test-event', callback2);
      
      expect(bus.listenerCount('test-event')).toBe(2);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      
      const unsubscribe = bus.on('test-event', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe when calling returned function', () => {
      const callback = vi.fn();
      
      const unsubscribe = bus.on('test-event', callback);
      expect(bus.listenerCount('test-event')).toBe(1);
      
      unsubscribe();
      expect(bus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('off (unsubscribe)', () => {
    it('should remove a specific listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      bus.on('test-event', callback1);
      bus.on('test-event', callback2);
      
      bus.off('test-event', callback1);
      
      expect(bus.listenerCount('test-event')).toBe(1);
    });

    it('should do nothing if event does not exist', () => {
      const callback = vi.fn();
      
      // Should not throw
      expect(() => bus.off('non-existent', callback)).not.toThrow();
    });

    it('should do nothing if callback not found', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      bus.on('test-event', callback1);
      bus.off('test-event', callback2);
      
      expect(bus.listenerCount('test-event')).toBe(1);
    });

    it('should clean up empty event arrays', () => {
      const callback = vi.fn();
      
      bus.on('test-event', callback);
      bus.off('test-event', callback);
      
      expect(bus.listeners.has('test-event')).toBe(false);
    });
  });

  describe('emit', () => {
    it('should call all listeners with data', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      bus.on('test-event', callback1);
      bus.on('test-event', callback2);
      
      bus.emit('test-event', { value: 123 });
      
      expect(callback1).toHaveBeenCalledWith({ value: 123 });
      expect(callback2).toHaveBeenCalledWith({ value: 123 });
    });

    it('should do nothing if no listeners', () => {
      // Should not throw
      expect(() => bus.emit('non-existent', {})).not.toThrow();
    });

    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();
      
      // Spy on console.error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      bus.on('test-event', errorCallback);
      bus.on('test-event', normalCallback);
      
      bus.emit('test-event', {});
      
      // Both callbacks should be called
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should pass data correctly', () => {
      const callback = vi.fn();
      const testData = { orderId: 123, items: ['a', 'b'] };
      
      bus.on('order-created', callback);
      bus.emit('order-created', testData);
      
      expect(callback).toHaveBeenCalledWith(testData);
    });
  });

  describe('once', () => {
    it('should only call callback once', () => {
      const callback = vi.fn();
      
      bus.once('test-event', callback);
      
      bus.emit('test-event', { first: true });
      bus.emit('test-event', { second: true });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ first: true });
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      
      const unsubscribe = bus.once('test-event', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow manual unsubscribe before emit', () => {
      const callback = vi.fn();
      
      const unsubscribe = bus.once('test-event', callback);
      unsubscribe();
      
      bus.emit('test-event', {});
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should auto-remove listener after first emit', () => {
      const callback = vi.fn();
      
      bus.once('test-event', callback);
      expect(bus.listenerCount('test-event')).toBe(1);
      
      bus.emit('test-event', {});
      expect(bus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear specific event listeners', () => {
      bus.on('event-1', vi.fn());
      bus.on('event-2', vi.fn());
      
      bus.clear('event-1');
      
      expect(bus.listenerCount('event-1')).toBe(0);
      expect(bus.listenerCount('event-2')).toBe(1);
    });

    it('should clear all listeners when no event specified', () => {
      bus.on('event-1', vi.fn());
      bus.on('event-2', vi.fn());
      bus.on('event-3', vi.fn());
      
      bus.clear();
      
      expect(bus.listenerCount('event-1')).toBe(0);
      expect(bus.listenerCount('event-2')).toBe(0);
      expect(bus.listenerCount('event-3')).toBe(0);
    });
  });

  describe('listenerCount', () => {
    it('should return correct count for event with listeners', () => {
      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn());
      
      expect(bus.listenerCount('test-event')).toBe(3);
    });

    it('should return 0 for event with no listeners', () => {
      expect(bus.listenerCount('non-existent')).toBe(0);
    });
  });
});

describe('eventBus singleton', () => {
  beforeEach(() => {
    // Clear singleton between tests
    eventBus.clear();
  });

  it('should be an instance of EventBus', () => {
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  it('should work as expected', () => {
    const callback = vi.fn();
    
    eventBus.on('singleton-test', callback);
    eventBus.emit('singleton-test', { data: 'test' });
    
    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should persist across imports (singleton pattern)', () => {
    const callback1 = vi.fn();
    eventBus.on('persistent-event', callback1);
    
    // Same instance should have the listener
    expect(eventBus.listenerCount('persistent-event')).toBe(1);
  });
});

describe('Real-world usage scenarios', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should handle order created event', () => {
    const kitchenListener = vi.fn();
    const notificationListener = vi.fn();
    
    bus.on('order:created', kitchenListener);
    bus.on('order:created', notificationListener);
    
    const orderData = {
      orderId: 'order-123',
      tableId: 'table-5',
      items: [{ name: 'Burger', quantity: 2 }],
    };
    
    bus.emit('order:created', orderData);
    
    expect(kitchenListener).toHaveBeenCalledWith(orderData);
    expect(notificationListener).toHaveBeenCalledWith(orderData);
  });

  it('should handle cart updated event', () => {
    const cartBadgeListener = vi.fn();
    const totalDisplayListener = vi.fn();
    
    bus.on('cart:updated', cartBadgeListener);
    bus.on('cart:updated', totalDisplayListener);
    
    bus.emit('cart:updated', { itemCount: 5, total: 750 });
    
    expect(cartBadgeListener).toHaveBeenCalledWith({ itemCount: 5, total: 750 });
    expect(totalDisplayListener).toHaveBeenCalledWith({ itemCount: 5, total: 750 });
  });

  it('should handle one-time authentication events', () => {
    const loginHandler = vi.fn();
    
    bus.once('auth:login', loginHandler);
    
    bus.emit('auth:login', { userId: 'user-1' });
    bus.emit('auth:login', { userId: 'user-2' }); // Should be ignored
    
    expect(loginHandler).toHaveBeenCalledTimes(1);
    expect(loginHandler).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('should handle cleanup on component unmount', () => {
    const componentCallback = vi.fn();
    
    // Simulate component mount
    const unsubscribe = bus.on('data:refresh', componentCallback);
    
    bus.emit('data:refresh', { source: 'api' });
    expect(componentCallback).toHaveBeenCalledTimes(1);
    
    // Simulate component unmount
    unsubscribe();
    
    bus.emit('data:refresh', { source: 'socket' });
    expect(componentCallback).toHaveBeenCalledTimes(1); // Still 1, not called again
  });
});
