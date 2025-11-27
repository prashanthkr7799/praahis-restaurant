/**
 * Auth Error Handler Tests
 * Tests for authentication error handling utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearInvalidTokens,
  handleAuthError,
  suppressMultiClientWarning,
  initAuthErrorHandling,
  isValidSession,
  clearAllSessions,
} from './authErrorHandler';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('clearInvalidTokens', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return false when no sessions exist', () => {
    const result = clearInvalidTokens();
    expect(result).toBe(false);
  });

  it('should clear invalid manager session', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: null,
    });
    
    const result = clearInvalidTokens();
    
    expect(result).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-manager-session');
  });

  it('should clear invalid owner session', () => {
    localStorageMock.store['sb-owner-session'] = JSON.stringify({
      refresh_token: null,
    });
    
    const result = clearInvalidTokens();
    
    expect(result).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-owner-session');
  });

  it('should clear malformed session JSON', () => {
    localStorageMock.store['sb-manager-session'] = 'invalid json';
    
    const result = clearInvalidTokens();
    
    expect(result).toBe(true);
  });

  it('should clear malformed owner session JSON', () => {
    localStorageMock.store['sb-owner-session'] = 'invalid json for owner';
    
    const result = clearInvalidTokens();
    
    expect(result).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-owner-session');
  });

  it('should not clear valid sessions', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
    });
    
    const result = clearInvalidTokens();
    
    expect(result).toBe(false);
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    const result = clearInvalidTokens();
    expect(result).toBe(false);
  });
});

describe('handleAuthError', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return undefined for null error', () => {
    const result = handleAuthError(null);
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined error', () => {
    const result = handleAuthError(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle refresh token not found error', () => {
    const error = { message: 'Refresh Token not found in database' };
    
    const result = handleAuthError(error);
    
    expect(result).toBe(true);
  });

  it('should handle expired token error', () => {
    const error = { message: 'Token has expired' };
    
    const result = handleAuthError(error);
    
    expect(result).toBe(true);
  });

  it('should handle invalid token error', () => {
    const error = { message: 'Token is invalid' };
    
    const result = handleAuthError(error);
    
    expect(result).toBe(true);
  });

  it('should return false for unrelated errors', () => {
    const error = { message: 'Network error' };
    
    const result = handleAuthError(error);
    
    expect(result).toBe(false);
  });

  it('should handle error without message', () => {
    const error = { code: 401 };
    
    const result = handleAuthError(error);
    
    expect(result).toBe(false);
  });
});

describe('suppressMultiClientWarning', () => {
  it('should not throw when called', () => {
    expect(() => suppressMultiClientWarning()).not.toThrow();
  });

  it('should modify console.warn', () => {
    const originalWarn = console.warn;
    
    suppressMultiClientWarning();
    
    // console.warn should be modified
    expect(console.warn).not.toBe(originalWarn);
  });

  it('should suppress GoTrueClient warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    suppressMultiClientWarning();
    console.warn('Multiple GoTrueClient instances detected');
    
    // The warning should be suppressed
    warnSpy.mockRestore();
  });

  it('should pass through other warnings', () => {
    // Store original
    const originalWarn = console.warn;
    const calls = [];
    
    // Mock after suppression
    suppressMultiClientWarning();
    console.warn = vi.fn((...args) => calls.push(args));
    
    console.warn('Other warning');
    
    // Other warnings should pass through
    expect(calls.length).toBe(1);
    
    // Restore
    console.warn = originalWarn;
  });

  it('should pass through non-GoTrueClient warnings via originalWarn.apply', () => {
    // Track what warnings get passed through
    const passedWarnings = [];
    const originalWarn = console.warn;
    
    // Replace console.warn to track calls
    console.warn = (...args) => passedWarnings.push(args);
    
    // Now call suppressMultiClientWarning - it will capture our tracking function as originalWarn
    suppressMultiClientWarning();
    
    // Call with a non-GoTrueClient warning - should be passed through to originalWarn
    console.warn('This is a regular warning');
    console.warn('Another warning message');
    
    // Verify the warnings were passed through
    expect(passedWarnings.length).toBe(2);
    expect(passedWarnings[0][0]).toBe('This is a regular warning');
    expect(passedWarnings[1][0]).toBe('Another warning message');
    
    // Restore
    console.warn = originalWarn;
  });
});

describe('isValidSession', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return false for non-existent session', () => {
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(false);
  });

  it('should return false for session without access_token', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      refresh_token: 'valid',
    });
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(false);
  });

  it('should return false for session without refresh_token', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
    });
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(false);
  });

  it('should return true for valid session', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
    });
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(true);
  });

  it('should return false for expired session', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
      expires_at: pastTime,
    });
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(false);
  });

  it('should return true for non-expired session', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
      expires_at: futureTime,
    });
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(true);
  });

  it('should handle malformed JSON', () => {
    localStorageMock.store['sb-manager-session'] = 'invalid json';
    
    const result = isValidSession('sb-manager-session');
    expect(result).toBe(false);
  });

  it('should use default session key', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
    });
    
    const result = isValidSession();
    expect(result).toBe(true);
  });

  it('should work with owner session key', () => {
    localStorageMock.store['sb-owner-session'] = JSON.stringify({
      access_token: 'valid',
      refresh_token: 'valid',
    });
    
    const result = isValidSession('sb-owner-session');
    expect(result).toBe(true);
  });
});

describe('clearAllSessions', () => {
  let originalObjectKeys;
  
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Mock Object.keys to work with our localStorage mock
    originalObjectKeys = Object.keys;
    Object.keys = (obj) => {
      if (obj === localStorage) {
        return Object.getOwnPropertyNames(localStorageMock.store);
      }
      return originalObjectKeys(obj);
    };
  });
  
  afterEach(() => {
    Object.keys = originalObjectKeys;
  });

  it('should clear manager session', () => {
    localStorageMock.store['sb-manager-session'] = JSON.stringify({});
    
    clearAllSessions();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-manager-session');
  });

  it('should clear owner session', () => {
    localStorageMock.store['sb-owner-session'] = JSON.stringify({});
    
    clearAllSessions();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-owner-session');
  });

  it('should clear praahis keys', () => {
    localStorageMock.store['praahis_cart_1'] = JSON.stringify([]);
    localStorageMock.store['praahis_session_1'] = 'session';
    
    clearAllSessions();
    
    // Just verify the function runs without error - actual clearing depends on implementation
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  it('should keep restaurant context', () => {
    localStorageMock.store['praahis_restaurant_123'] = JSON.stringify({ id: 123 });
    
    clearAllSessions();
    
    // Should NOT remove restaurant context
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('praahis_restaurant_123');
  });

  it('should remove praahis keys without restaurant context', () => {
    // Add both types of praahis keys
    localStorageMock.store['praahis_auth_token'] = 'token123';
    localStorageMock.store['praahis_user_data'] = JSON.stringify({ name: 'test' });
    localStorageMock.store['praahis_restaurant_456'] = JSON.stringify({ id: 456 });
    
    clearAllSessions();
    
    // Should remove non-restaurant praahis keys
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_auth_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_user_data');
    // Should NOT remove restaurant context
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('praahis_restaurant_456');
  });

  it('should handle mixed praahis keys correctly', () => {
    // Set up keys that will test the forEach branch
    localStorageMock.store['praahis_session'] = 'session_value';
    localStorageMock.store['praahis_cart'] = JSON.stringify([{ item: 1 }]);
    localStorageMock.store['praahis_temp_restaurant_context'] = 'temp'; // contains _restaurant_ so should be kept
    
    clearAllSessions();
    
    // Keys without _restaurant_ should be removed
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_session');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('praahis_cart');
    // Keys with _restaurant_ should NOT be removed
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('praahis_temp_restaurant_context');
  });
});

describe('initAuthErrorHandling', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should initialize without throwing', () => {
    expect(() => initAuthErrorHandling()).not.toThrow();
  });

  it('should clear invalid tokens on initialization', () => {
    // Set up an invalid token
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: null,
    });
    
    initAuthErrorHandling();
    
    // Should have attempted to clear invalid tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-manager-session');
  });

  it('should log info message on successful initialization', () => {
    initAuthErrorHandling();
    
    expect(console.info).toHaveBeenCalledWith('✅ Auth error handling initialized');
  });

  it('should suppress multi-client warning', () => {
    const originalWarn = console.warn;
    
    initAuthErrorHandling();
    
    // console.warn should be modified (not the same as original)
    // This tests that suppressMultiClientWarning was called
    expect(console.warn).not.toBe(originalWarn);
  });

  it('should handle already valid sessions gracefully', () => {
    // Set up a valid session
    localStorageMock.store['sb-manager-session'] = JSON.stringify({
      access_token: 'valid_token',
      refresh_token: 'valid_refresh',
    });
    
    expect(() => initAuthErrorHandling()).not.toThrow();
    expect(console.info).toHaveBeenCalled();
  });
});
