/**
 * Link Helpers Tests
 * Tests for URL generation utilities
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getChefLoginLink,
  getWaiterLoginLink,
  getQrTableLink,
} from './linkHelpers';

describe('Link Helpers', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Mock window.location.origin
    globalThis.window = {
      location: {
        origin: 'https://praahis.com',
      },
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  describe('getChefLoginLink', () => {
    it('should generate correct chef login URL with slug', () => {
      const link = getChefLoginLink('my-restaurant');
      expect(link).toBe('https://praahis.com/chef/login?restaurant=my-restaurant');
    });

    it('should handle slug with special characters', () => {
      const link = getChefLoginLink('café-resto');
      expect(link).toBe('https://praahis.com/chef/login?restaurant=caf%C3%A9-resto');
    });

    it('should handle empty slug', () => {
      const link = getChefLoginLink('');
      expect(link).toBe('https://praahis.com/chef/login?restaurant=');
    });

    it('should include restaurant query parameter', () => {
      const link = getChefLoginLink('test-slug');
      expect(link).toContain('restaurant=');
    });
  });

  describe('getWaiterLoginLink', () => {
    it('should generate correct waiter login URL with slug', () => {
      const link = getWaiterLoginLink('my-restaurant');
      expect(link).toBe('https://praahis.com/waiter/login?restaurant=my-restaurant');
    });

    it('should handle slug with hyphens', () => {
      const link = getWaiterLoginLink('the-great-restaurant');
      expect(link).toBe('https://praahis.com/waiter/login?restaurant=the-great-restaurant');
    });

    it('should handle empty slug', () => {
      const link = getWaiterLoginLink('');
      expect(link).toBe('https://praahis.com/waiter/login?restaurant=');
    });
  });

  describe('getQrTableLink', () => {
    it('should generate correct QR table URL with slug and table number', () => {
      const link = getQrTableLink('my-restaurant', 5);
      expect(link).toBe('https://praahis.com/table/5?restaurant=my-restaurant');
    });

    it('should handle string table ID', () => {
      const link = getQrTableLink('my-restaurant', 'table-uuid-123');
      expect(link).toBe('https://praahis.com/table/table-uuid-123?restaurant=my-restaurant');
    });

    it('should encode special characters in table ID', () => {
      const link = getQrTableLink('my-restaurant', 'table/1');
      expect(link).toContain('table%2F1');
    });

    it('should handle numeric table numbers', () => {
      const link = getQrTableLink('resto', 1);
      expect(link).toBe('https://praahis.com/table/1?restaurant=resto');
    });

    it('should handle large table numbers', () => {
      const link = getQrTableLink('resto', 999);
      expect(link).toBe('https://praahis.com/table/999?restaurant=resto');
    });
  });
});

describe('Link Helpers - No Window', () => {
  beforeEach(() => {
    // Simulate server-side rendering
    globalThis.window = undefined;
  });

  afterEach(() => {
    globalThis.window = {
      location: {
        origin: 'https://praahis.com',
      },
    };
  });

  it('should handle missing window gracefully for chef login', () => {
    const link = getChefLoginLink('test');
    expect(link).toContain('/chef/login');
  });

  it('should handle missing window gracefully for waiter login', () => {
    const link = getWaiterLoginLink('test');
    expect(link).toContain('/waiter/login');
  });

  it('should handle missing window gracefully for QR link', () => {
    const link = getQrTableLink('test', 1);
    expect(link).toContain('/table/1');
  });
});

describe('Link Helpers - Error Handling', () => {
  it('should handle window.location throwing error', () => {
    // Create a proxy that throws on location access
    globalThis.window = {
      get location() {
        throw new Error('Cannot access location');
      }
    };
    
    const link = getChefLoginLink('test');
    expect(link).toContain('/chef/login');
    expect(link).toContain('restaurant=test');
    
    // Restore
    globalThis.window = {
      location: { origin: 'https://praahis.com' }
    };
  });
});

describe('Link Helpers - withQuery branch coverage', () => {
  beforeEach(() => {
    globalThis.window = {
      location: {
        origin: 'https://praahis.com',
      },
    };
  });

  it('should return URL unchanged when no params provided (null)', () => {
    // Test by calling a function with no slug - empty query should still add restaurant param
    const link = getChefLoginLink(null);
    // Even with null, it should form restaurant=null or empty
    expect(link).toContain('/chef/login');
  });

  it('should handle undefined slug parameter', () => {
    const link = getChefLoginLink(undefined);
    expect(link).toContain('/chef/login');
  });
});
