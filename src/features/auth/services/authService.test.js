/**
 * Auth Service Tests
 * Tests for authentication functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@config/supabase';

// Create mock functions that we can configure per test
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockEqForSelect = vi.fn(() => ({
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
}));
const mockEqForUpdate = vi.fn(() => Promise.resolve({ data: {}, error: null }));
const mockSelect = vi.fn(() => ({
  eq: mockEqForSelect,
}));
const mockUpdate = vi.fn(() => ({
  eq: mockEqForUpdate,
}));
const mockUpsert = vi.fn(() => Promise.resolve({ data: {}, error: null }));

// Mock the supabase module
vi.mock('@config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      upsert: mockUpsert,
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Import after mocking
import { signIn, signOut, getCurrentUser, getSession } from './authService';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockReset();
    mockSingle.mockReset();
  });

  describe('signIn', () => {
    it('should successfully sign in a user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };
      const mockSession = {
        access_token: 'token-123',
        user: mockUser,
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock profile fetch - user exists
      mockMaybeSingle.mockResolvedValue({
        data: { id: mockUser.id, role: 'manager', restaurant_id: 'rest-123' },
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('test@example.com');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error for invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await signIn('wrong@example.com', 'wrongpassword');

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await signOut();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed' };
      supabase.auth.signOut.mockResolvedValue({ error: mockError });

      const result = await signOut();

      expect(result.error).toBeTruthy();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: mockUser.id,
                email: mockUser.email,
                role: 'manager',
                full_name: 'Test User',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await getCurrentUser();

      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should return null user when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.profile).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: { id: 'user-123' },
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toBeTruthy();
      expect(result.session.access_token).toBe('token-123');
    });

    it('should return null when no session exists', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toBeNull();
    });
  });
});
