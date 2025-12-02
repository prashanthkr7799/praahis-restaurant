/**
 * Form Validation Utilities
 * Reusable validation functions for forms throughout the application
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Check for Indian phone numbers (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate price/decimal value
 * @param {string|number} price - Price to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePrice = (price) => {
  if (price === '' || price === null || price === undefined) {
    return { isValid: false, error: 'Price is required' };
  }

  const numPrice = parseFloat(price);
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

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
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

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateLength = (value, min, max, fieldName = 'This field') => {
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

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error: string, strength: string }
 */
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required', strength: 'none' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }

  let strength = 'weak';
  let hasUpper = /[A-Z]/.test(password);
  let hasLower = /[a-z]/.test(password);
  let hasNumber = /\d/.test(password);
  let hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (criteriaMet >= 4 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriaMet >= 3 && password.length >= 10) {
    strength = 'medium';
  }

  return { isValid: true, error: null, strength };
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRange = (value, min, max, fieldName = 'Value') => {
  const num = parseFloat(value);

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

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateURL = (url) => {
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

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {boolean} allowPast - Whether past dates are allowed
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateDate = (date, allowPast = true) => {
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
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateDateRange = (startDate, endDate) => {
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

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Array of allowed MIME types
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    const types = allowedTypes.map(t => t.split('/')[1]).join(', ');
    return { isValid: false, error: `File must be of type: ${types}` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate entire form
 * @param {object} formData - Form data object
 * @param {object} validationRules - Validation rules
 * @returns {object} { isValid: boolean, errors: object }
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];

    for (const rule of rules) {
      const result = rule.validator(value, ...rule.args);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
};

/**
 * Clean and sanitize input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Validate discount percentage (0-100%)
 * @param {number} percentage - Discount percentage
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateDiscountPercentage = (percentage) => {
  if (percentage === null || percentage === undefined || percentage === '') {
    return { isValid: false, error: 'Discount percentage is required' };
  }
  
  const num = parseFloat(percentage);
  
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
 * @param {number} discountAmount - Discount amount
 * @param {number} billTotal - Total bill amount
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateDiscountAmount = (discountAmount, billTotal) => {
  if (discountAmount === null || discountAmount === undefined || discountAmount === '') {
    return { isValid: false, error: 'Discount amount is required' };
  }
  
  const amount = parseFloat(discountAmount);
  const total = parseFloat(billTotal);
  
  if (isNaN(amount) || isNaN(total)) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (amount < 0) {
    return { isValid: false, error: 'Discount cannot be negative' };
  }
  
  if (amount > total) {
    return { 
      isValid: false, 
      error: `Discount (₹${amount.toFixed(2)}) cannot exceed bill amount (₹${total.toFixed(2)})` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate refund amount
 * @param {number} refundAmount - Refund amount
 * @param {number} paidAmount - Amount that was paid
 * @param {number} alreadyRefunded - Amount already refunded
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRefundAmount = (refundAmount, paidAmount, alreadyRefunded = 0) => {
  if (refundAmount === null || refundAmount === undefined || refundAmount === '') {
    return { isValid: false, error: 'Refund amount is required' };
  }
  
  const amount = parseFloat(refundAmount);
  const paid = parseFloat(paidAmount);
  const refunded = parseFloat(alreadyRefunded);
  
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
      error: `Total refund (₹${totalRefund.toFixed(2)}) cannot exceed paid amount (₹${paid.toFixed(2)})` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Clean phone number (digits only)
 * @param {string} phone - Phone number to clean
 * @returns {string} - Cleaned phone number
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-()]/g, '');
};

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
