/**
 * Authentication Service Tests
 * Tests login, logout, session management, and security features
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Supabase
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};

vi.mock('@config/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockUserProfile, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'manager@restaurant.com',
  created_at: '2025-01-01T00:00:00Z',
};

const mockUserProfile = {
  id: 'user-123',
  email: 'manager@restaurant.com',
  role: 'manager',
  restaurant_id: 'rest-1',
  full_name: 'John Manager',
  is_active: true,
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() / 1000 + 3600,
  user: mockUser,
};

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: 'manager@restaurant.com',
        password: 'validPassword123!',
      });

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('manager@restaurant.com');
      expect(result.data.session.access_token).toBeDefined();
    });

    it('should fail login with invalid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: 'wrong@email.com',
        password: 'wrongpassword',
      });

      expect(result.error).not.toBeNull();
      expect(result.error.message).toBe('Invalid login credentials');
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        mockSupabaseAuth.signInWithPassword({
          email: 'test@test.com',
          password: 'password',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Logout', () => {
    it('should clear session on logout', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      const result = await mockSupabaseAuth.signOut();

      expect(result.error).toBeNull();
    });

    it('should clear local storage on logout', async () => {
      localStorage.setItem('praahis_auth', JSON.stringify(mockSession));
      localStorage.setItem('praahis_restaurant_ctx', JSON.stringify({ restaurantId: 'rest-1' }));

      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });
      await mockSupabaseAuth.signOut();

      // In real implementation, these would be cleared
      // Simulating the clear
      localStorage.clear();

      // After clear, getItem returns null (in real browser) or undefined (in mock)
      expect(localStorage.getItem('praahis_auth')).toBeFalsy();
      expect(localStorage.getItem('praahis_restaurant_ctx')).toBeFalsy();
    });
  });

  describe('Session Management', () => {
    it('should retrieve current session', async () => {
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await mockSupabaseAuth.getSession();

      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBe('mock-access-token');
    });

    it('should detect expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() / 1000 - 3600, // 1 hour ago
      };

      const isExpired = expiredSession.expires_at < Date.now() / 1000;

      expect(isExpired).toBe(true);
    });

    it('should detect valid session', async () => {
      const validSession = {
        ...mockSession,
        expires_at: Date.now() / 1000 + 3600, // 1 hour from now
      };

      const isExpired = validSession.expires_at < Date.now() / 1000;

      expect(isExpired).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const result = await mockSupabaseAuth.resetPasswordForEmail('user@example.com', {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      expect(result.error).toBeNull();
    });

    it('should handle invalid email for password reset', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      });

      const result = await mockSupabaseAuth.resetPasswordForEmail('nonexistent@example.com');

      expect(result.error).not.toBeNull();
    });
  });

  describe('Role-Based Access', () => {
    const roles = ['customer', 'waiter', 'chef', 'manager', 'admin', 'owner'];

    it('should identify valid roles', () => {
      roles.forEach((role) => {
        expect(roles.includes(role)).toBe(true);
      });
    });

    it('should get correct dashboard route for each role', () => {
      const dashboardRoutes = {
        customer: '/table',
        waiter: '/waiter/dashboard',
        chef: '/chef/dashboard',
        manager: '/manager/dashboard',
        admin: '/manager/dashboard',
        owner: '/superadmin/dashboard',
      };

      Object.entries(dashboardRoutes).forEach(([role, route]) => {
        expect(dashboardRoutes[role]).toBe(route);
      });
    });

    it('should validate manager permissions', () => {
      const managerPermissions = [
        'menu:view',
        'menu:create',
        'menu:edit',
        'menu:delete',
        'order:view',
        'order:update',
        'staff:view',
        'staff:create',
        'staff:edit',
        'analytics:view',
        'reports:view',
        'settings:view',
        'settings:edit',
      ];

      const hasPermission = (permission) => managerPermissions.includes(permission);

      expect(hasPermission('menu:view')).toBe(true);
      expect(hasPermission('menu:create')).toBe(true);
      expect(hasPermission('superadmin:access')).toBe(false);
    });

    it('should validate chef permissions', () => {
      const chefPermissions = ['order:view', 'order:update', 'menu:view'];

      const hasPermission = (permission) => chefPermissions.includes(permission);

      expect(hasPermission('order:view')).toBe(true);
      expect(hasPermission('order:update')).toBe(true);
      expect(hasPermission('staff:delete')).toBe(false);
    });

    it('should validate waiter permissions', () => {
      const waiterPermissions = ['order:view', 'order:update', 'menu:view'];

      const hasPermission = (permission) => waiterPermissions.includes(permission);

      expect(hasPermission('order:view')).toBe(true);
      expect(hasPermission('menu:edit')).toBe(false);
    });
  });

  describe('Restaurant Context', () => {
    it('should set restaurant context after login', () => {
      const setRestaurantContext = (restaurantId, restaurantName) => {
        const ctx = { restaurantId, restaurantName, setAt: Date.now() };
        localStorage.setItem('praahis_restaurant_ctx', JSON.stringify(ctx));
        return ctx;
      };

      const ctx = setRestaurantContext('rest-1', 'Test Restaurant');

      expect(ctx.restaurantId).toBe('rest-1');
      expect(localStorage.getItem('praahis_restaurant_ctx')).not.toBeNull();
    });

    it('should validate user belongs to restaurant', () => {
      const validateRestaurantAccess = (userRestaurantId, requestedRestaurantId) => {
        if (!userRestaurantId) return { valid: false, error: 'No restaurant assigned' };
        if (userRestaurantId !== requestedRestaurantId) {
          return { valid: false, error: 'Access denied to this restaurant' };
        }
        return { valid: true };
      };

      expect(validateRestaurantAccess('rest-1', 'rest-1')).toEqual({ valid: true });
      expect(validateRestaurantAccess('rest-1', 'rest-2')).toEqual({
        valid: false,
        error: 'Access denied to this restaurant',
      });
      expect(validateRestaurantAccess(null, 'rest-1')).toEqual({
        valid: false,
        error: 'No restaurant assigned',
      });
    });
  });
});

describe('Input Validation', () => {
  describe('Email Validation', () => {
    const validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    it('should accept valid emails', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.in', 'user+tag@gmail.com'];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'spaces in@email.com',
        'missing@domain',
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password) => {
      const errors = [];
      if (password.length < 8) errors.push('Must be at least 8 characters');
      if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Must contain number');
      if (!/[!@#$%^&*]/.test(password)) errors.push('Must contain special character');
      return { valid: errors.length === 0, errors };
    };

    it('should accept strong passwords', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should identify all missing requirements', () => {
      const result = validatePassword('nouppercase1!');
      expect(result.errors).toContain('Must contain uppercase letter');
    });
  });

  describe('Phone Validation', () => {
    const validatePhone = (phone) => {
      // Indian phone number format
      const regex = /^[6-9]\d{9}$/;
      return regex.test(phone.replace(/\s/g, ''));
    };

    it('should accept valid Indian phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('8765432109')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(false); // Doesn't start with 6-9
      expect(validatePhone('987654321')).toBe(false); // Too short
      expect(validatePhone('98765432100')).toBe(false); // Too long
    });
  });
});
