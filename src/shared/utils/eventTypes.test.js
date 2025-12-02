/**
 * Event Types Tests
 * Tests for the centralized event type definitions
 */
import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_EVENTS,
  ANALYTICS_EVENTS,
  STAFF_EVENTS,
  ORDERING_EVENTS,
  BILLING_EVENTS,
  ALL_EVENTS,
  SYSTEM_EVENTS,
} from './eventTypes';

describe('Event Types', () => {
  describe('NOTIFICATION_EVENTS', () => {
    it('should be defined', () => {
      expect(NOTIFICATION_EVENTS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof NOTIFICATION_EVENTS).toBe('object');
    });
  });

  describe('ANALYTICS_EVENTS', () => {
    it('should be defined', () => {
      expect(ANALYTICS_EVENTS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof ANALYTICS_EVENTS).toBe('object');
    });
  });

  describe('STAFF_EVENTS', () => {
    it('should be defined', () => {
      expect(STAFF_EVENTS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof STAFF_EVENTS).toBe('object');
    });
  });

  describe('ORDERING_EVENTS', () => {
    it('should be defined', () => {
      expect(ORDERING_EVENTS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof ORDERING_EVENTS).toBe('object');
    });
  });

  describe('BILLING_EVENTS', () => {
    it('should be defined', () => {
      expect(BILLING_EVENTS).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof BILLING_EVENTS).toBe('object');
    });
  });

  describe('ALL_EVENTS', () => {
    it('should be defined', () => {
      expect(ALL_EVENTS).toBeDefined();
    });

    it('should contain events from all domains', () => {
      expect(typeof ALL_EVENTS).toBe('object');
      // Should have properties from merged domains
      expect(Object.keys(ALL_EVENTS).length).toBeGreaterThan(0);
    });
  });

  describe('SYSTEM_EVENTS', () => {
    it('should be defined', () => {
      expect(SYSTEM_EVENTS).toBeDefined();
    });

    it('should have APP_INITIALIZED event', () => {
      expect(SYSTEM_EVENTS.APP_INITIALIZED).toBe('system:app_initialized');
    });

    it('should have USER_LOGGED_IN event', () => {
      expect(SYSTEM_EVENTS.USER_LOGGED_IN).toBe('system:user_logged_in');
    });

    it('should have USER_LOGGED_OUT event', () => {
      expect(SYSTEM_EVENTS.USER_LOGGED_OUT).toBe('system:user_logged_out');
    });

    it('should have RESTAURANT_CHANGED event', () => {
      expect(SYSTEM_EVENTS.RESTAURANT_CHANGED).toBe('system:restaurant_changed');
    });

    it('should have THEME_CHANGED event', () => {
      expect(SYSTEM_EVENTS.THEME_CHANGED).toBe('system:theme_changed');
    });

    it('should have NETWORK_ONLINE event', () => {
      expect(SYSTEM_EVENTS.NETWORK_ONLINE).toBe('system:network_online');
    });

    it('should have NETWORK_OFFLINE event', () => {
      expect(SYSTEM_EVENTS.NETWORK_OFFLINE).toBe('system:network_offline');
    });

    it('should have ERROR_OCCURRED event', () => {
      expect(SYSTEM_EVENTS.ERROR_OCCURRED).toBe('system:error_occurred');
    });
  });
});
