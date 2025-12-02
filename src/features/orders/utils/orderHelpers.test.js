/**
 * Order Helpers Unit Tests
 * 
 * Tests for utility functions in orderHelpers.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateOrderNumber,
  generateOrderToken,
  calculateTax,
  calculateTotal,
  calculateSubtotal,
  formatCurrency,
  formatTimestamp,
  formatTime,
  getRelativeTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  getOrderStatusText,
  getPaymentStatusText,
  validateOrderData,
  prepareOrderData,
} from './orderHelpers'

describe('orderHelpers', () => {
  describe('generateOrderNumber', () => {
    it('should generate a valid order number format', () => {
      const orderNumber = generateOrderNumber()
      
      // Format: ORD-YYYYMMDD-XXXX
      expect(orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/)
    })

    it('should generate unique order numbers', () => {
      const orderNumbers = new Set()
      for (let i = 0; i < 100; i++) {
        orderNumbers.add(generateOrderNumber())
      }
      
      // All 100 should be unique (with high probability)
      expect(orderNumbers.size).toBe(100)
    })

    it('should include current date in order number', () => {
      const orderNumber = generateOrderNumber()
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      
      expect(orderNumber).toContain(today)
    })
  })

  describe('generateOrderToken', () => {
    it('should generate a non-empty string', () => {
      const token = generateOrderToken()
      
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateOrderToken())
      }
      
      expect(tokens.size).toBe(100)
    })
  })

  describe('calculateTax', () => {
    it('should calculate 5% tax by default', () => {
      expect(calculateTax(100)).toBe(5)
      expect(calculateTax(200)).toBe(10)
      expect(calculateTax(1000)).toBe(50)
    })

    it('should calculate custom tax rate', () => {
      expect(calculateTax(100, 0.10)).toBe(10) // 10%
      expect(calculateTax(100, 0.18)).toBe(18) // 18%
    })

    it('should return 0 for 0 subtotal', () => {
      expect(calculateTax(0)).toBe(0)
    })

    it('should handle decimal amounts', () => {
      expect(calculateTax(99.99)).toBe(5) // 4.9995 rounds to 5
    })
  })

  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      expect(calculateTotal(100, 5, 0)).toBe(105)
      expect(calculateTotal(100, 5, 10)).toBe(95)
    })

    it('should handle no tax or discount', () => {
      expect(calculateTotal(100)).toBe(100)
      expect(calculateTotal(100, 0, 0)).toBe(100)
    })

    it('should handle decimal values', () => {
      expect(calculateTotal(99.99, 5.00, 4.99)).toBe(100)
    })
  })

  describe('calculateSubtotal', () => {
    it('should calculate subtotal from items', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ]
      
      expect(calculateSubtotal(items)).toBe(350) // (100*2) + (50*3)
    })

    it('should return 0 for empty items', () => {
      expect(calculateSubtotal([])).toBe(0)
    })

    it('should handle single item', () => {
      const items = [{ price: 150, quantity: 1 }]
      expect(calculateSubtotal(items)).toBe(150)
    })
  })

  describe('formatCurrency', () => {
    it('should format amount in Indian Rupees', () => {
      const formatted = formatCurrency(1000)
      
      expect(formatted).toContain('₹')
      expect(formatted).toContain('1,000')
    })

    it('should handle decimal amounts', () => {
      const formatted = formatCurrency(99.50)
      
      expect(formatted).toContain('₹')
      expect(formatted).toContain('99.5')
    })

    it('should handle 0', () => {
      const formatted = formatCurrency(0)
      
      expect(formatted).toContain('₹')
      expect(formatted).toContain('0')
    })

    it('should format large numbers with commas', () => {
      const formatted = formatCurrency(100000)
      
      expect(formatted).toContain('1,00,000') // Indian numbering system
    })
  })

  describe('formatTimestamp', () => {
    it('should format timestamp in readable format', () => {
      const timestamp = '2025-11-27T10:30:00Z'
      const formatted = formatTimestamp(timestamp)
      
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('formatTime', () => {
    it('should format time only', () => {
      const timestamp = '2025-11-27T10:30:00Z'
      const formatted = formatTime(timestamp)
      
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-11-27T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "Just now" for recent timestamps', () => {
      const timestamp = new Date('2025-11-27T11:59:45Z').toISOString()
      expect(getRelativeTime(timestamp)).toBe('Just now')
    })

    it('should return "1 minute ago" for 1 minute', () => {
      const timestamp = new Date('2025-11-27T11:59:00Z').toISOString()
      expect(getRelativeTime(timestamp)).toBe('1 minute ago')
    })

    it('should return "X minutes ago" for multiple minutes', () => {
      const timestamp = new Date('2025-11-27T11:55:00Z').toISOString()
      expect(getRelativeTime(timestamp)).toBe('5 minutes ago')
    })

    it('should return "1 hour ago" for 1 hour', () => {
      const timestamp = new Date('2025-11-27T11:00:00Z').toISOString()
      expect(getRelativeTime(timestamp)).toBe('1 hour ago')
    })

    it('should return "X hours ago" for multiple hours', () => {
      const timestamp = new Date('2025-11-27T09:00:00Z').toISOString()
      expect(getRelativeTime(timestamp)).toBe('3 hours ago')
    })
  })

  describe('getOrderStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(getOrderStatusColor('received')).toContain('blue')
      expect(getOrderStatusColor('preparing')).toContain('yellow')
      expect(getOrderStatusColor('ready')).toContain('green')
      expect(getOrderStatusColor('served')).toContain('gray')
      expect(getOrderStatusColor('cancelled')).toContain('red')
    })

    it('should return default color for unknown status', () => {
      expect(getOrderStatusColor('unknown')).toContain('gray')
    })
  })

  describe('getPaymentStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(getPaymentStatusColor('pending')).toContain('yellow')
      expect(getPaymentStatusColor('paid')).toContain('green')
      expect(getPaymentStatusColor('failed')).toContain('red')
    })

    it('should return default color for unknown status', () => {
      expect(getPaymentStatusColor('unknown')).toContain('gray')
    })
  })

  describe('getOrderStatusText', () => {
    it('should return display text for each status', () => {
      expect(getOrderStatusText('received')).toBe('Order Received')
      expect(getOrderStatusText('preparing')).toBe('Preparing')
      expect(getOrderStatusText('ready')).toBe('Ready to Serve')
      expect(getOrderStatusText('served')).toBe('Served')
      expect(getOrderStatusText('cancelled')).toBe('Cancelled')
    })

    it('should return status itself for unknown status', () => {
      expect(getOrderStatusText('unknown')).toBe('unknown')
    })
  })

  describe('getPaymentStatusText', () => {
    it('should return display text for each status', () => {
      expect(getPaymentStatusText('pending')).toBe('Payment Pending')
      expect(getPaymentStatusText('paid')).toBe('Paid')
      expect(getPaymentStatusText('failed')).toBe('Payment Failed')
    })

    it('should return status itself for unknown status', () => {
      expect(getPaymentStatusText('unknown')).toBe('unknown')
    })
  })

  describe('validateOrderData', () => {
    it('should validate valid order data', () => {
      const orderData = {
        items: [{ name: 'Item 1', price: 100, quantity: 1 }],
        table_id: 'table-123',
        subtotal: 100,
        total: 105,
      }
      
      const result = validateOrderData(orderData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if items are empty', () => {
      const orderData = {
        items: [],
        table_id: 'table-123',
        subtotal: 0,
        total: 0,
      }
      
      const result = validateOrderData(orderData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Order must contain at least one item')
    })

    it('should fail if table info is missing', () => {
      const orderData = {
        items: [{ name: 'Item 1', price: 100, quantity: 1 }],
        subtotal: 100,
        total: 105,
      }
      
      const result = validateOrderData(orderData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Table information is required')
    })

    it('should fail if subtotal is zero or negative', () => {
      const orderData = {
        items: [{ name: 'Item 1', price: 100, quantity: 1 }],
        table_id: 'table-123',
        subtotal: 0,
        total: 0,
      }
      
      const result = validateOrderData(orderData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Order subtotal must be greater than zero')
    })

    it('should collect multiple errors', () => {
      const orderData = {
        items: [],
        subtotal: 0,
        total: 0,
      }
      
      const result = validateOrderData(orderData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('prepareOrderData', () => {
    const mockCartItems = [
      { id: 'item-1', name: 'Burger', price: 200, quantity: 2, is_vegetarian: false },
      { id: 'item-2', name: 'Fries', price: 100, quantity: 1, is_vegetarian: true },
    ]
    const mockTableInfo = { id: 'table-123', table_number: 5 }
    const mockRestaurantId = 'restaurant-456'

    it('should prepare order data correctly', () => {
      const orderData = prepareOrderData(mockCartItems, mockTableInfo, mockRestaurantId)
      
      expect(orderData.restaurant_id).toBe(mockRestaurantId)
      expect(orderData.table_id).toBe('table-123')
      expect(orderData.table_number).toBe(5)
      expect(orderData.items).toHaveLength(2)
      expect(orderData.subtotal).toBe(500) // (200*2) + (100*1)
      expect(orderData.tax).toBe(25) // 5% of 500
      expect(orderData.total).toBe(525)
      expect(orderData.payment_status).toBe('pending')
      expect(orderData.order_status).toBe('pending_payment')
    })

    it('should throw error if table info is missing', () => {
      expect(() => {
        prepareOrderData(mockCartItems, null, mockRestaurantId)
      }).toThrow('Table information is missing or invalid')
    })

    it('should throw error if cart is empty', () => {
      expect(() => {
        prepareOrderData([], mockTableInfo, mockRestaurantId)
      }).toThrow('Cart is empty')
    })

    it('should throw error if restaurant ID is missing', () => {
      expect(() => {
        prepareOrderData(mockCartItems, mockTableInfo, null)
      }).toThrow('Restaurant ID is missing')
    })

    it('should include item details correctly', () => {
      const orderData = prepareOrderData(mockCartItems, mockTableInfo, mockRestaurantId)
      
      const firstItem = orderData.items[0]
      expect(firstItem.menu_item_id).toBe('item-1')
      expect(firstItem.name).toBe('Burger')
      expect(firstItem.price).toBe(200)
      expect(firstItem.quantity).toBe(2)
      expect(firstItem.is_veg).toBe(false)
      expect(firstItem.item_status).toBe('queued')
    })

    it('should generate unique order number and token', () => {
      const orderData1 = prepareOrderData(mockCartItems, mockTableInfo, mockRestaurantId)
      const orderData2 = prepareOrderData(mockCartItems, mockTableInfo, mockRestaurantId)
      
      expect(orderData1.order_number).not.toBe(orderData2.order_number)
      expect(orderData1.order_token).not.toBe(orderData2.order_token)
    })
  })
})

// Import missing functions for additional tests
import {
  getEstimatedTime,
  isRecentOrder,
  groupByCategory,
  getCategories,
} from './orderHelpers'

describe('Additional orderHelpers functions', () => {
  describe('getEstimatedTime', () => {
    it('should return 15 minutes for empty items', () => {
      expect(getEstimatedTime([])).toBe(15)
    })

    it('should return 15 minutes for null items', () => {
      expect(getEstimatedTime(null)).toBe(15)
    })

    it('should return 15 minutes for undefined items', () => {
      expect(getEstimatedTime(undefined)).toBe(15)
    })

    it('should return max preparation time plus 5 minutes buffer', () => {
      const items = [
        { preparation_time: 10 },
        { preparation_time: 20 },
        { preparation_time: 15 },
      ]
      expect(getEstimatedTime(items)).toBe(25) // 20 + 5
    })

    it('should use default 15 minutes when preparation_time is missing', () => {
      const items = [
        { name: 'Burger' },
        { name: 'Fries' },
      ]
      expect(getEstimatedTime(items)).toBe(20) // 15 + 5
    })

    it('should handle mixed items with and without preparation_time', () => {
      const items = [
        { preparation_time: 10 },
        { name: 'Burger' }, // No preparation_time, defaults to 15
        { preparation_time: 25 },
      ]
      expect(getEstimatedTime(items)).toBe(30) // 25 + 5
    })
  })

  describe('isRecentOrder', () => {
    it('should return true for orders within 30 minutes', () => {
      const now = new Date()
      const recentTime = new Date(now - 15 * 60000).toISOString() // 15 mins ago
      expect(isRecentOrder(recentTime)).toBe(true)
    })

    it('should return true for orders exactly 30 minutes ago', () => {
      const now = new Date()
      const thirtyMinsAgo = new Date(now - 30 * 60000).toISOString()
      expect(isRecentOrder(thirtyMinsAgo)).toBe(true)
    })

    it('should return false for orders older than 30 minutes', () => {
      const now = new Date()
      const oldTime = new Date(now - 31 * 60000).toISOString() // 31 mins ago
      expect(isRecentOrder(oldTime)).toBe(false)
    })

    it('should return true for orders just now', () => {
      const now = new Date().toISOString()
      expect(isRecentOrder(now)).toBe(true)
    })

    it('should return false for orders from yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60000).toISOString()
      expect(isRecentOrder(yesterday)).toBe(false)
    })
  })

  describe('groupByCategory', () => {
    it('should group items by category', () => {
      const menuItems = [
        { id: 1, name: 'Burger', category: 'Main Course' },
        { id: 2, name: 'Pizza', category: 'Main Course' },
        { id: 3, name: 'Coke', category: 'Beverages' },
        { id: 4, name: 'Ice Cream', category: 'Desserts' },
      ]
      
      const grouped = groupByCategory(menuItems)
      
      expect(Object.keys(grouped)).toHaveLength(3)
      expect(grouped['Main Course']).toHaveLength(2)
      expect(grouped['Beverages']).toHaveLength(1)
      expect(grouped['Desserts']).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupByCategory([])
      expect(Object.keys(grouped)).toHaveLength(0)
    })

    it('should handle single category', () => {
      const menuItems = [
        { id: 1, name: 'Burger', category: 'Main Course' },
        { id: 2, name: 'Pizza', category: 'Main Course' },
      ]
      
      const grouped = groupByCategory(menuItems)
      
      expect(Object.keys(grouped)).toHaveLength(1)
      expect(grouped['Main Course']).toHaveLength(2)
    })

    it('should preserve item data in groups', () => {
      const menuItems = [
        { id: 1, name: 'Burger', price: 200, category: 'Main Course' },
      ]
      
      const grouped = groupByCategory(menuItems)
      
      expect(grouped['Main Course'][0].id).toBe(1)
      expect(grouped['Main Course'][0].name).toBe('Burger')
      expect(grouped['Main Course'][0].price).toBe(200)
    })
  })

  describe('getCategories', () => {
    it('should return unique categories', () => {
      const menuItems = [
        { id: 1, category: 'Main Course' },
        { id: 2, category: 'Main Course' },
        { id: 3, category: 'Beverages' },
        { id: 4, category: 'Desserts' },
      ]
      
      const categories = getCategories(menuItems)
      
      expect(categories).toHaveLength(3)
      expect(categories).toContain('Main Course')
      expect(categories).toContain('Beverages')
      expect(categories).toContain('Desserts')
    })

    it('should return sorted categories', () => {
      const menuItems = [
        { id: 1, category: 'Zesty Foods' },
        { id: 2, category: 'Appetizers' },
        { id: 3, category: 'Main Course' },
      ]
      
      const categories = getCategories(menuItems)
      
      expect(categories).toEqual(['Appetizers', 'Main Course', 'Zesty Foods'])
    })

    it('should handle empty array', () => {
      const categories = getCategories([])
      expect(categories).toHaveLength(0)
    })

    it('should handle single category', () => {
      const menuItems = [
        { id: 1, category: 'Main Course' },
        { id: 2, category: 'Main Course' },
      ]
      
      const categories = getCategories(menuItems)
      
      expect(categories).toHaveLength(1)
      expect(categories[0]).toBe('Main Course')
    })
  })
})
