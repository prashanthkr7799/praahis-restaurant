/**
 * Supabase Client Mock for Testing
 * 
 * Provides a mock implementation of the Supabase client
 * for use in unit tests.
 */

import { vi } from 'vitest'

// Mock query builder with chainable methods
const createMockQueryBuilder = (defaultData = [], defaultError = null) => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: defaultData[0] || null, error: defaultError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: defaultData[0] || null, error: defaultError }),
    then: vi.fn((resolve) => resolve({ data: defaultData, error: defaultError })),
  }

  // Make the query builder thenable by default
  mockQueryBuilder.select.mockReturnValue({
    ...mockQueryBuilder,
    then: vi.fn((resolve) => resolve({ data: defaultData, error: defaultError })),
  })

  return mockQueryBuilder
}

// Mock auth methods
const createMockAuth = (mockUser = null) => ({
  getUser: vi.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
    data: { session: mockUser ? { user: mockUser } : null },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: { user: mockUser } },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: null },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  updateUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
})

// Mock realtime channel
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue('SUBSCRIBED'),
  unsubscribe: vi.fn(),
})

// Mock storage
const createMockStorage = () => ({
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
})

// Create the main mock Supabase client
export const createMockSupabaseClient = (options = {}) => {
  const {
    mockUser = null,
    mockData = [],
    mockError = null,
  } = options

  const mockQueryBuilder = createMockQueryBuilder(mockData, mockError)

  return {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    auth: createMockAuth(mockUser),
    channel: vi.fn().mockReturnValue(createMockChannel()),
    removeChannel: vi.fn(),
    storage: createMockStorage(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

// Default mock instance
export const mockSupabase = createMockSupabaseClient()

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks()
}

// Helper to set mock return data
export const setMockQueryData = (supabaseClient, tableName, data, error = null) => {
  const mockQueryBuilder = createMockQueryBuilder(data, error)
  supabaseClient.from.mockImplementation((table) => {
    if (table === tableName) {
      return mockQueryBuilder
    }
    return createMockQueryBuilder()
  })
}

export default mockSupabase
