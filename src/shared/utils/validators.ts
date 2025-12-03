/**
 * Form Validation Utilities
 * TypeScript version with full type safety
 */

// ========================================
// Validation Result Types
// ========================================

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: 'none' | 'weak' | 'medium' | 'strong';
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRule<T = unknown> {
  validator: (value: T, ...args: unknown[]) => ValidationResult;
  args: unknown[];
}

export type ValidationRules = Record<string, ValidationRule[]>;

// ========================================
// Email Validation
// ========================================

/**
 * Validate email address
 */
export const validateEmail = (email: string | null | undefined): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
};

// ========================================
// Phone Validation
// ========================================

/**
 * Validate phone number (Indian format)
 */
export const validatePhone = (phone: string | null | undefined): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Check for Indian phone numbers (10 digits starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }

  return { isValid: true, error: null };
};

// ========================================
// Price Validation
// ========================================

/**
 * Validate price/decimal value
 */
export const validatePrice = (price: string | number | null | undefined): ValidationResult => {
  if (price === '' || price === null || price === undefined) {
    return { isValid: false, error: 'Price is required' };
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }

  if (numPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  if (numPrice > 99999) {
    return { isValid: false, error: 'Price is too large' };
  }

  return { isValid: true, error: null };
};

// ========================================
// Required Field Validation
// ========================================

/**
 * Validate required field
 */
export const validateRequired = <T>(
  value: T,
  fieldName: string = 'This field'
): ValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName} must have at least one item` };
  }

  return { isValid: true, error: null };
};

// ========================================
// Length Validation
// ========================================

/**
 * Validate string length
 */
export const validateLength = (
  value: string | null | undefined,
  min: number,
  max?: number,
  fieldName: string = 'This field'
): ValidationResult => {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  const length = value.trim().length;

  if (length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (max && length > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max} characters` };
  }

  return { isValid: true, error: null };
};

// ========================================
// Password Validation
// ========================================

/**
 * Validate password strength
 */
export const validatePassword = (password: string | null | undefined): PasswordValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required', strength: 'none' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (criteriaMet >= 4 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriaMet >= 3 && password.length >= 10) {
    strength = 'medium';
  }

  return { isValid: true, error: null, strength };
};

// ========================================
// Range Validation
// ========================================

/**
 * Validate number range
 */
export const validateRange = (
  value: string | number,
  min: number,
  max?: number,
  fieldName: string = 'Value'
): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true, error: null };
};

// ========================================
// URL Validation
// ========================================

/**
 * Validate URL
 */
export const validateURL = (url: string | null | undefined): ValidationResult => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

// ========================================
// Date Validation
// ========================================

/**
 * Validate date
 */
export const validateDate = (
  date: string | Date | null | undefined,
  allowPast: boolean = true
): ValidationResult => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  if (!allowPast && dateObj < new Date()) {
    return { isValid: false, error: 'Date cannot be in the past' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): ValidationResult => {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Both start and end dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Please enter valid dates' };
  }

  if (end < start) {
    return { isValid: false, error: 'End date must be after start date' };
  }

  return { isValid: true, error: null };
};

// ========================================
// File Validation
// ========================================

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validate file type
 */
export const validateFileType = (
  file: File | null | undefined,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): ValidationResult => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    const types = allowedTypes.map((t) => t.split('/')[1]).join(', ');
    return { isValid: false, error: `File must be of type: ${types}` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate file size
 */
export const validateFileSize = (
  file: File | null | undefined,
  maxSizeMB: number = 5
): ValidationResult => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { isValid: true, error: null };
};

// ========================================
// Discount Validation
// ========================================

/**
 * Validate discount percentage (0-100%)
 */
export const validateDiscountPercentage = (
  percentage: string | number | null | undefined
): ValidationResult => {
  if (percentage === null || percentage === undefined || percentage === '') {
    return { isValid: false, error: 'Discount percentage is required' };
  }

  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;

  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Discount cannot be negative' };
  }

  if (num > 100) {
    return { isValid: false, error: 'Discount cannot exceed 100%' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate discount amount against bill total
 */
export const validateDiscountAmount = (
  discountAmount: string | number | null | undefined,
  billTotal: string | number
): ValidationResult => {
  if (discountAmount === null || discountAmount === undefined || discountAmount === '') {
    return { isValid: false, error: 'Discount amount is required' };
  }

  const amount = typeof discountAmount === 'string' ? parseFloat(discountAmount) : discountAmount;
  const total = typeof billTotal === 'string' ? parseFloat(billTotal) : billTotal;

  if (isNaN(amount) || isNaN(total)) {
    return { isValid: false, error: 'Invalid amount' };
  }

  if (amount < 0) {
    return { isValid: false, error: 'Discount cannot be negative' };
  }

  if (amount > total) {
    return {
      isValid: false,
      error: `Discount (₹${amount.toFixed(2)}) cannot exceed bill amount (₹${total.toFixed(2)})`,
    };
  }

  return { isValid: true, error: null };
};

// ========================================
// Refund Validation
// ========================================

/**
 * Validate refund amount
 */
export const validateRefundAmount = (
  refundAmount: string | number | null | undefined,
  paidAmount: string | number,
  alreadyRefunded: string | number = 0
): ValidationResult => {
  if (refundAmount === null || refundAmount === undefined || refundAmount === '') {
    return { isValid: false, error: 'Refund amount is required' };
  }

  const amount = typeof refundAmount === 'string' ? parseFloat(refundAmount) : refundAmount;
  const paid = typeof paidAmount === 'string' ? parseFloat(paidAmount) : paidAmount;
  const refunded =
    typeof alreadyRefunded === 'string' ? parseFloat(alreadyRefunded) : alreadyRefunded;

  if (isNaN(amount) || isNaN(paid)) {
    return { isValid: false, error: 'Invalid amount' };
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Refund amount must be greater than 0' };
  }

  const totalRefund = amount + refunded;

  if (totalRefund > paid) {
    return {
      isValid: false,
      error: `Total refund (₹${totalRefund.toFixed(2)}) cannot exceed paid amount (₹${paid.toFixed(2)})`,
    };
  }

  return { isValid: true, error: null };
};

// ========================================
// Form Validation
// ========================================

/**
 * Validate entire form
 */
export const validateForm = <T extends Record<string, unknown>>(
  formData: T,
  validationRules: Record<keyof T, ValidationRule[]>
): FormValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];

    for (const rule of rules as ValidationRule[]) {
      const result = rule.validator(value, ...rule.args);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
        isValid = false;
        break;
      }
    }
  }

  return { isValid, errors };
};

// ========================================
// Utility Functions
// ========================================

/**
 * Clean and sanitize input
 */
export const sanitizeInput = (input: unknown): unknown => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Clean phone number (digits only)
 */
export const cleanPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/[\s\-()]/g, '');
};

// ========================================
// Default Export
// ========================================

export default {
  validateEmail,
  validatePhone,
  validatePrice,
  validateRequired,
  validateLength,
  validatePassword,
  validateRange,
  validateURL,
  validateDate,
  validateDateRange,
  validateFileType,
  validateFileSize,
  validateForm,
  sanitizeInput,
  validateDiscountPercentage,
  validateDiscountAmount,
  validateRefundAmount,
  formatPhoneNumber,
  cleanPhoneNumber,
};
