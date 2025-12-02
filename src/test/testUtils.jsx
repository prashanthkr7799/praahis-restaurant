/**
 * Test Utilities
 * 
 * Common utilities and wrappers for testing React components.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock Supabase
vi.mock('@config/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue('SUBSCRIBED'),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
  getTable: vi.fn(),
  getMenuItems: vi.fn(),
  createOrder: vi.fn(),
  markTableOccupied: vi.fn(),
  getOrCreateActiveSessionId: vi.fn(),
  getSharedCart: vi.fn(),
  updateSharedCart: vi.fn(),
  clearSharedCart: vi.fn(),
  subscribeToSharedCart: vi.fn(),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock notification service
vi.mock('@features/notifications/services/notificationService', () => ({
  default: {
    playSound: vi.fn(),
    showToast: vi.fn(),
    registerUserGestureUnlock: vi.fn(),
  },
}))

/**
 * Custom render with providers
 */
export function renderWithProviders(
  ui,
  {
    route = '/',
    initialEntries = [route],
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Custom render with BrowserRouter (for hooks that need it)
 */
export function renderWithRouter(ui, renderOptions = {}) {
  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Mock order data
 */
export const mockOrder = {
  id: 'order-123',
  order_number: 'ORD-20251127-ABC1',
  restaurant_id: 'restaurant-456',
  table_id: 'table-789',
  table_number: 5,
  items: [
    {
      menu_item_id: 'item-1',
      name: 'Butter Chicken',
      price: 350,
      quantity: 2,
      notes: '',
      is_veg: false,
    },
    {
      menu_item_id: 'item-2',
      name: 'Naan',
      price: 50,
      quantity: 4,
      notes: 'Extra butter',
      is_veg: true,
    },
  ],
  subtotal: 900,
  tax: 45,
  discount: 0,
  total: 945,
  order_status: 'received',
  payment_status: 'pending',
  created_at: '2025-11-27T10:00:00Z',
  updated_at: '2025-11-27T10:00:00Z',
}

/**
 * Mock table data
 */
export const mockTable = {
  id: 'table-789',
  restaurant_id: 'restaurant-456',
  table_number: 5,
  capacity: 4,
  status: 'available',
  zone: 'Indoor',
  session_id: null,
}

/**
 * Mock menu items
 */
export const mockMenuItems = [
  {
    id: 'item-1',
    restaurant_id: 'restaurant-456',
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken',
    price: 350,
    category: 'Main Course',
    is_vegetarian: false,
    is_available: true,
    image_url: 'https://example.com/butter-chicken.jpg',
    preparation_time: 25,
  },
  {
    id: 'item-2',
    restaurant_id: 'restaurant-456',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese with spices',
    price: 280,
    category: 'Appetizers',
    is_vegetarian: true,
    is_available: true,
    image_url: 'https://example.com/paneer-tikka.jpg',
    preparation_time: 15,
  },
  {
    id: 'item-3',
    restaurant_id: 'restaurant-456',
    name: 'Naan',
    description: 'Leavened flatbread',
    price: 50,
    category: 'Breads',
    is_vegetarian: true,
    is_available: true,
    image_url: 'https://example.com/naan.jpg',
    preparation_time: 5,
  },
]

/**
 * Mock user profile
 */
export const mockUserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'manager',
  restaurant_id: 'restaurant-456',
  is_active: true,
}

/**
 * Mock restaurant
 */
export const mockRestaurant = {
  id: 'restaurant-456',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  address: '123 Test Street',
  phone: '9876543210',
  email: 'contact@test.com',
  is_active: true,
  payment_gateway_enabled: true,
}

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Create mock Supabase response
 */
export const createMockResponse = (data = null, error = null) => ({
  data,
  error,
})

export {
  screen,
  fireEvent,
  waitFor,
  within,
  act,
  cleanup,
  waitForElementToBeRemoved,
  prettyDOM,
  configure
} from '@testing-library/react'
