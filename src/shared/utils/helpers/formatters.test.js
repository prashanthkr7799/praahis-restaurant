/**
 * Formatters Unit Tests
 * 
 * Tests for utility functions in formatters.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatPhoneNumber,
  formatPercentage,
  formatNumber,
  formatFileSize,
  truncateText,
  formatDiscount,
  getInitials,
  formatDateForInput,
  parseDateFromInput,
  formatOrderStatus,
  formatPaymentStatus,
  getStatusColor,
} from './formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format amount in Indian Rupees', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00')
      expect(formatCurrency(100)).toBe('₹100.00')
    })

    it('should handle decimal amounts', () => {
      expect(formatCurrency(99.5)).toBe('₹99.50')
      expect(formatCurrency(1234.56)).toBe('₹1,234.56')
    })

    it('should handle null/undefined', () => {
      expect(formatCurrency(null)).toBe('₹0.00')
      expect(formatCurrency(undefined)).toBe('₹0.00')
    })

    it('should handle 0', () => {
      expect(formatCurrency(0)).toBe('₹0.00')
    })

    it('should format large numbers with Indian numbering', () => {
      expect(formatCurrency(100000)).toContain('1,00,000')
    })
  })

  describe('formatDate', () => {
    it('should format date in readable format', () => {
      const date = '2025-11-27'
      const formatted = formatDate(date)
      
      expect(formatted).toContain('2025')
      expect(formatted).toContain('November')
      expect(formatted).toContain('27')
    })

    it('should handle null/undefined', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })

    it('should handle ISO date strings', () => {
      const date = '2025-11-27T10:30:00Z'
      const formatted = formatDate(date)
      
      expect(formatted).toContain('2025')
    })
  })

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const date = '2025-11-27T10:30:00Z'
      const formatted = formatDateTime(date)
      
      expect(formatted).toContain('2025')
      expect(typeof formatted).toBe('string')
    })

    it('should handle null/undefined', () => {
      expect(formatDateTime(null)).toBe('N/A')
      expect(formatDateTime(undefined)).toBe('N/A')
    })
  })

  describe('formatTime', () => {
    it('should format time only', () => {
      const date = '2025-11-27T10:30:00Z'
      const formatted = formatTime(date)
      
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should handle null/undefined', () => {
      expect(formatTime(null)).toBe('N/A')
      expect(formatTime(undefined)).toBe('N/A')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-11-27T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "Just now" for recent timestamps', () => {
      const date = new Date('2025-11-27T11:59:45Z')
      expect(formatRelativeTime(date)).toBe('Just now')
    })

    it('should return "X minutes ago" for minutes', () => {
      const date = new Date('2025-11-27T11:55:00Z')
      expect(formatRelativeTime(date)).toBe('5 minutes ago')
    })

    it('should return "1 minute ago" (singular)', () => {
      const date = new Date('2025-11-27T11:59:00Z')
      expect(formatRelativeTime(date)).toBe('1 minute ago')
    })

    it('should return "X hours ago" for hours', () => {
      const date = new Date('2025-11-27T09:00:00Z')
      expect(formatRelativeTime(date)).toBe('3 hours ago')
    })

    it('should return "1 hour ago" (singular)', () => {
      const date = new Date('2025-11-27T11:00:00Z')
      expect(formatRelativeTime(date)).toBe('1 hour ago')
    })

    it('should return "X days ago" for days', () => {
      const date = new Date('2025-11-25T12:00:00Z')
      expect(formatRelativeTime(date)).toBe('2 days ago')
    })

    it('should return formatted date for dates older than 7 days', () => {
      const date = new Date('2025-11-10T12:00:00Z')
      const result = formatRelativeTime(date)
      // Should call formatDate for dates > 7 days old
      expect(result).toContain('November')
      expect(result).toContain('10')
      expect(result).toContain('2025')
    })

    it('should handle null/undefined', () => {
      expect(formatRelativeTime(null)).toBe('N/A')
      expect(formatRelativeTime(undefined)).toBe('N/A')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit Indian phone number', () => {
      expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210')
    })

    it('should handle phone with non-digit characters', () => {
      expect(formatPhoneNumber('987-654-3210')).toBe('+91 98765 43210')
      expect(formatPhoneNumber('(987) 654 3210')).toBe('+91 98765 43210')
    })

    it('should return original if not 10 digits', () => {
      expect(formatPhoneNumber('+91 98765 43210')).toBe('+91 98765 43210')
      expect(formatPhoneNumber('12345')).toBe('12345')
    })

    it('should handle null/undefined', () => {
      expect(formatPhoneNumber(null)).toBe('N/A')
      expect(formatPhoneNumber(undefined)).toBe('N/A')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with default 1 decimal', () => {
      expect(formatPercentage(75)).toBe('75.0%')
      expect(formatPercentage(33.333)).toBe('33.3%')
    })

    it('should handle custom decimal places', () => {
      expect(formatPercentage(75.5555, 2)).toBe('75.56%')
      expect(formatPercentage(100, 0)).toBe('100%')
    })

    it('should handle null/undefined', () => {
      expect(formatPercentage(null)).toBe('0%')
      expect(formatPercentage(undefined)).toBe('0%')
    })
  })

  describe('formatNumber', () => {
    it('should format number with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toContain('10,00,000') // Indian numbering
    })

    it('should handle null/undefined', () => {
      expect(formatNumber(null)).toBe('0')
      expect(formatNumber(undefined)).toBe('0')
    })

    it('should handle decimal numbers', () => {
      const formatted = formatNumber(1234.56)
      expect(formatted).toContain('1,234')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should show 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text with ellipsis', () => {
      const longText = 'This is a very long text that should be truncated'
      const truncated = truncateText(longText, 20)
      
      expect(truncated.length).toBeLessThanOrEqual(23) // 20 + '...'
      expect(truncated).toContain('...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short'
      const result = truncateText(shortText, 50)
      
      expect(result).toBe('Short')
    })

    it('should handle null/undefined', () => {
      expect(truncateText(null)).toBe('')
      expect(truncateText(undefined)).toBe('')
    })

    it('should use default maxLength of 50', () => {
      const text = 'A'.repeat(60)
      const truncated = truncateText(text)
      
      expect(truncated.length).toBeLessThanOrEqual(53) // 50 + '...'
    })
  })

  describe('formatDiscount', () => {
    it('should format percentage discount', () => {
      expect(formatDiscount('percentage', 10)).toBe('10% OFF')
      expect(formatDiscount('percentage', 25)).toBe('25% OFF')
    })

    it('should format fixed discount', () => {
      expect(formatDiscount('fixed', 100)).toBe('₹100 OFF')
      expect(formatDiscount('fixed', 50)).toBe('₹50 OFF')
    })

    it('should format BOGO discount', () => {
      expect(formatDiscount('bogo')).toBe('Buy 1 Get 1')
    })

    it('should return value for unknown type', () => {
      expect(formatDiscount('unknown', 'free delivery')).toBe('free delivery')
    })
  })

  describe('getInitials', () => {
    it('should return initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Alice Bob Charlie')).toBe('AB')
    })

    it('should return single initial for single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle null/undefined', () => {
      expect(getInitials(null)).toBe('??')
      expect(getInitials(undefined)).toBe('??')
    })

    it('should return uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD')
    })

    it('should limit to 2 characters', () => {
      expect(getInitials('Alice Bob Charlie David')).toBe('AB')
    })
  })

  describe('formatDateForInput', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-06-15')
      expect(formatDateForInput(date)).toBe('2025-06-15')
    })

    it('should handle string date', () => {
      expect(formatDateForInput('2025-06-15')).toBe('2025-06-15')
    })

    it('should return empty string for null/undefined', () => {
      expect(formatDateForInput(null)).toBe('')
      expect(formatDateForInput(undefined)).toBe('')
    })

    it('should pad single digit months and days', () => {
      const date = new Date('2025-01-05')
      expect(formatDateForInput(date)).toBe('2025-01-05')
    })
  })

  describe('parseDateFromInput', () => {
    it('should parse date string to Date object', () => {
      const result = parseDateFromInput('2025-06-15')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2025)
    })

    it('should return null for empty string', () => {
      expect(parseDateFromInput('')).toBeNull()
    })

    it('should return null for null/undefined', () => {
      expect(parseDateFromInput(null)).toBeNull()
      expect(parseDateFromInput(undefined)).toBeNull()
    })
  })

  describe('formatOrderStatus', () => {
    it('should format received status', () => {
      expect(formatOrderStatus('received')).toBe('Received')
    })

    it('should format preparing status', () => {
      expect(formatOrderStatus('preparing')).toBe('Preparing')
    })

    it('should format ready status', () => {
      expect(formatOrderStatus('ready')).toBe('Ready')
    })

    it('should format served status', () => {
      expect(formatOrderStatus('served')).toBe('Served')
    })

    it('should format cancelled status', () => {
      expect(formatOrderStatus('cancelled')).toBe('Cancelled')
    })

    it('should return original status if unknown', () => {
      expect(formatOrderStatus('custom')).toBe('custom')
      expect(formatOrderStatus('in-progress')).toBe('in-progress')
    })
  })

  describe('formatPaymentStatus', () => {
    it('should format pending status', () => {
      expect(formatPaymentStatus('pending')).toBe('Pending')
    })

    it('should format paid status', () => {
      expect(formatPaymentStatus('paid')).toBe('Paid')
    })

    it('should format failed status', () => {
      expect(formatPaymentStatus('failed')).toBe('Failed')
    })

    it('should format refunded status', () => {
      expect(formatPaymentStatus('refunded')).toBe('Refunded')
    })

    it('should return original status if unknown', () => {
      expect(formatPaymentStatus('cancelled')).toBe('cancelled')
      expect(formatPaymentStatus('processing')).toBe('processing')
    })
  })

  describe('getStatusColor', () => {
    describe('order status colors', () => {
      it('should return blue for received', () => {
        expect(getStatusColor('received', 'order')).toBe('bg-blue-100 text-blue-800 border-blue-200')
      })

      it('should return yellow for preparing', () => {
        expect(getStatusColor('preparing', 'order')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200')
      })

      it('should return purple for ready', () => {
        expect(getStatusColor('ready', 'order')).toBe('bg-purple-100 text-purple-800 border-purple-200')
      })

      it('should return green for served', () => {
        expect(getStatusColor('served', 'order')).toBe('bg-green-100 text-green-800 border-green-200')
      })

      it('should return red for cancelled', () => {
        expect(getStatusColor('cancelled', 'order')).toBe('bg-red-100 text-red-800 border-red-200')
      })

      it('should return gray for unknown order status', () => {
        expect(getStatusColor('custom', 'order')).toBe('bg-gray-100 text-gray-800 border-gray-200')
      })

      it('should default to order type if not specified', () => {
        expect(getStatusColor('received')).toBe('bg-blue-100 text-blue-800 border-blue-200')
      })
    })

    describe('payment status colors', () => {
      it('should return yellow for pending payment', () => {
        expect(getStatusColor('pending', 'payment')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200')
      })

      it('should return green for paid', () => {
        expect(getStatusColor('paid', 'payment')).toBe('bg-green-100 text-green-800 border-green-200')
      })

      it('should return red for failed payment', () => {
        expect(getStatusColor('failed', 'payment')).toBe('bg-red-100 text-red-800 border-red-200')
      })

      it('should return purple for refunded', () => {
        expect(getStatusColor('refunded', 'payment')).toBe('bg-purple-100 text-purple-800 border-purple-200')
      })

      it('should return gray for unknown payment status', () => {
        expect(getStatusColor('cancelled', 'payment')).toBe('bg-gray-100 text-gray-800 border-gray-200')
      })
    })

    describe('unknown type', () => {
      it('should return gray for unknown type', () => {
        expect(getStatusColor('pending', 'unknown')).toBe('bg-gray-100 text-gray-800 border-gray-200')
      })

      it('should return gray for any status with invalid type', () => {
        expect(getStatusColor('received', 'invalid')).toBe('bg-gray-100 text-gray-800 border-gray-200')
      })
    })
  })
})
