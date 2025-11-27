/**
 * useTheme Hook Tests
 * Tests for the theme management hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    // Reset localStorage for each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return theme and toggleTheme function', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBeDefined();
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('should have initial theme as string', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(['light', 'dark']).toContain(result.current.theme);
  });

  it('should toggle theme when toggleTheme is called', () => {
    const { result } = renderHook(() => useTheme());
    
    const initialTheme = result.current.theme;
    
    act(() => {
      result.current.toggleTheme();
    });
    
    const newTheme = result.current.theme;
    expect(newTheme).not.toBe(initialTheme);
  });

  it('should alternate between light and dark on multiple toggles', () => {
    const { result } = renderHook(() => useTheme());
    
    const initialTheme = result.current.theme;
    
    act(() => {
      result.current.toggleTheme();
    });
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe(initialTheme);
  });

  it('should use dark theme when system prefers dark and no localStorage value', () => {
    // Mock matchMedia to return dark preference
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('dark');
    
    // Restore
    window.matchMedia = originalMatchMedia;
  });
});
