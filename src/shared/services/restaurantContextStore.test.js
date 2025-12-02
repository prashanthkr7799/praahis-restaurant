/**
 * Restaurant Context Store Tests
 * Tests for the runtime restaurant context store
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setRestaurantContext,
  getRestaurantContext,
  clearRestaurantContext,
  getActiveRestaurantId,
} from './restaurantContextStore';

describe('restaurantContextStore', () => {
  beforeEach(() => {
    // Clear context before each test
    clearRestaurantContext();
  });

  describe('setRestaurantContext', () => {
    it('should set restaurant context', () => {
      const ctx = {
        restaurantId: 'rest-123',
        restaurantSlug: 'my-restaurant',
        restaurantName: 'My Restaurant',
        branding: { primaryColor: '#ff0000' },
      };
      
      setRestaurantContext(ctx);
      
      const result = getRestaurantContext();
      expect(result.restaurantId).toBe('rest-123');
      expect(result.restaurantSlug).toBe('my-restaurant');
    });

    it('should create a copy of the context', () => {
      const ctx = { restaurantId: 'rest-123' };
      setRestaurantContext(ctx);
      
      ctx.restaurantId = 'modified';
      
      const result = getRestaurantContext();
      expect(result.restaurantId).toBe('rest-123');
    });

    it('should handle null context', () => {
      setRestaurantContext({ restaurantId: 'test' });
      setRestaurantContext(null);
      
      expect(getRestaurantContext()).toBeNull();
    });

    it('should handle undefined context', () => {
      setRestaurantContext({ restaurantId: 'test' });
      setRestaurantContext(undefined);
      
      expect(getRestaurantContext()).toBeNull();
    });
  });

  describe('getRestaurantContext', () => {
    it('should return null when no context set', () => {
      expect(getRestaurantContext()).toBeNull();
    });

    it('should return the current context', () => {
      setRestaurantContext({
        restaurantId: 'rest-456',
        restaurantName: 'Test Restaurant',
      });
      
      const result = getRestaurantContext();
      expect(result.restaurantId).toBe('rest-456');
      expect(result.restaurantName).toBe('Test Restaurant');
    });
  });

  describe('clearRestaurantContext', () => {
    it('should clear the context', () => {
      setRestaurantContext({ restaurantId: 'rest-789' });
      expect(getRestaurantContext()).not.toBeNull();
      
      clearRestaurantContext();
      
      expect(getRestaurantContext()).toBeNull();
    });

    it('should handle clearing when already empty', () => {
      clearRestaurantContext();
      expect(getRestaurantContext()).toBeNull();
    });
  });

  describe('getActiveRestaurantId', () => {
    it('should return restaurant ID when context is set', () => {
      setRestaurantContext({ restaurantId: 'active-rest-123' });
      
      expect(getActiveRestaurantId()).toBe('active-rest-123');
    });

    it('should return fallback when no context', () => {
      expect(getActiveRestaurantId('fallback-id')).toBe('fallback-id');
    });

    it('should return null when no context and no fallback', () => {
      expect(getActiveRestaurantId()).toBeNull();
    });

    it('should prefer context over fallback', () => {
      setRestaurantContext({ restaurantId: 'context-id' });
      
      expect(getActiveRestaurantId('fallback-id')).toBe('context-id');
    });

    it('should return null for empty context without fallback', () => {
      setRestaurantContext({});
      
      expect(getActiveRestaurantId()).toBeNull();
    });
  });
});
