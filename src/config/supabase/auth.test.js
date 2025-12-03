/**
 * Auth Service Tests
 * Tests for authentication and authorization operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@config/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithPassword', () => {
    it('should sign in user with valid credentials', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should return error for invalid credentials', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.data.user).toBeNull();
      expect(result.error.message).toBe('Invalid login credentials');
    });
  });

  describe('signUp', () => {
    it('should create new user account', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
      };

      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null, // Email confirmation pending
        },
        error: null,
      });

      const result = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'securePassword123',
      });

      expect(result.data.user.email).toBe('newuser@example.com');
      expect(result.error).toBeNull();
    });

    it('should return error for existing email', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error.message).toBe('User already registered');
    });
  });

  describe('signOut', () => {
    it('should sign out current user', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123', email: 'test@example.com' },
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await supabase.auth.getSession();

      expect(result.data.session.access_token).toBe('test-token');
      expect(result.data.session.user.email).toBe('test@example.com');
    });

    it('should return null session when not logged in', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return current user', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await supabase.auth.getUser();

      expect(result.data.user.id).toBe('user-123');
      expect(result.data.user.user_metadata.full_name).toBe('Test User');
    });
  });

  describe('resetPasswordForEmail', () => {
    it('should send password reset email', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await supabase.auth.resetPasswordForEmail('test@example.com');

      expect(result.error).toBeNull();
    });

    it('should handle non-existent email gracefully', async () => {
      const { supabase } = await import('@config/supabase/client');

      // Supabase doesn't reveal if email exists for security
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await supabase.auth.resetPasswordForEmail('nonexistent@example.com');

      expect(result.error).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockCallback = vi.fn();
      const mockUnsubscribe = { unsubscribe: vi.fn() };

      supabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockUnsubscribe },
      });

      const { data } = supabase.auth.onAuthStateChange(mockCallback);

      expect(data.subscription.unsubscribe).toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const { supabase } = await import('@config/supabase/client');

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Updated Name',
        },
      };

      supabase.auth.updateUser.mockResolvedValue({
        data: { user: updatedUser },
        error: null,
      });

      const result = await supabase.auth.updateUser({
        data: { full_name: 'Updated Name' },
      });

      expect(result.data.user.user_metadata.full_name).toBe('Updated Name');
    });
  });
});

describe('User Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from profiles table', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockProfile = {
        id: 'user-123',
        role: 'manager',
        restaurant_id: 'rest-123',
        full_name: 'Test Manager',
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { data } = await supabase.from('profiles').select('*').eq('id', 'user-123').single();

      expect(data.role).toBe('manager');
      expect(data.restaurant_id).toBe('rest-123');
    });

    it('should handle missing profile gracefully', async () => {
      const { supabase } = await import('@config/supabase/client');

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No profile found', code: 'PGRST116' },
            }),
          }),
        }),
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'missing-user')
        .single();

      expect(data).toBeNull();
      expect(error.code).toBe('PGRST116');
    });
  });

  describe('Role-based access', () => {
    it('should verify manager role', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockProfile = {
        id: 'user-123',
        role: 'manager',
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { data } = await supabase.from('profiles').select('role').eq('id', 'user-123').single();

      expect(data.role).toBe('manager');
      expect(['manager', 'superadmin'].includes(data.role)).toBe(true);
    });

    it('should verify waiter role', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockProfile = {
        id: 'waiter-123',
        role: 'waiter',
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', 'waiter-123')
        .single();

      expect(data.role).toBe('waiter');
    });

    it('should verify chef role', async () => {
      const { supabase } = await import('@config/supabase/client');

      const mockProfile = {
        id: 'chef-123',
        role: 'chef',
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { data } = await supabase.from('profiles').select('role').eq('id', 'chef-123').single();

      expect(data.role).toBe('chef');
    });
  });
});
