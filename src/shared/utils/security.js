/**
 * Security Utilities
 *
 * Client-side security helpers for XSS prevention, input sanitization,
 * and secure data handling.
 */

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Advanced sanitization with configurable options
 * Use this for complex sanitization needs. For simple cases, use sanitizeInput from validators.js
 * @param {string} input - User input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeInputAdvanced(input, options = {}) {
  if (typeof input !== 'string') return '';

  const {
    allowHtml = false,
    maxLength = 10000,
    trimWhitespace = true,
    removeNewlines = false,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove newlines if specified
  if (removeNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Escape HTML if not allowed
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Validate and sanitize email address with XSS protection
 * Use this for security-sensitive email validation. For basic validation, use validateEmail from validators.js
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with { valid, email, error }
 */
export function validateEmailSecure(email) {
  if (typeof email !== 'string') {
    return { valid: false, email: '', error: 'Email must be a string' };
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email regex (not RFC 5322 compliant but practical)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, email: sanitized, error: 'Invalid email format' };
  }

  // Check for common injection patterns
  const dangerousPatterns = [/[<>]/, /javascript:/i, /data:/i, /vbscript:/i];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, email: '', error: 'Email contains invalid characters' };
    }
  }

  return { valid: true, email: sanitized, error: null };
}

/**
 * Validate URL and check for safe protocols
 * @param {string} url - URL to validate
 * @param {Array} allowedProtocols - Allowed protocols
 * @returns {Object} Validation result
 */
export function validateUrl(url, allowedProtocols = ['http:', 'https:']) {
  if (typeof url !== 'string') {
    return { valid: false, url: '', error: 'URL must be a string' };
  }

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return {
        valid: false,
        url,
        error: `Invalid protocol. Allowed: ${allowedProtocols.join(', ')}`,
      };
    }

    // Check for javascript: in any form
    if (/javascript:/i.test(url)) {
      return { valid: false, url: '', error: 'JavaScript URLs not allowed' };
    }

    return { valid: true, url: parsed.href, error: null };
  } catch {
    return { valid: false, url, error: 'Invalid URL format' };
  }
}

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
export function generateCsrfToken() {
  const token = generateSecureToken(32);
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} Whether token is valid
 */
export function validateCsrfToken(token) {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken && token === storedToken;
}

/**
 * Safely parse JSON with error handling
 * @param {string} json - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Create a Content Security Policy nonce
 * @returns {string} CSP nonce
 */
export function generateCspNonce() {
  return generateSecureToken(16);
}

/**
 * Check if a string contains SQL injection patterns
 * @param {string} input - String to check
 * @returns {boolean} Whether input contains SQL injection patterns
 */
export function hasSqlInjectionPatterns(input) {
  if (typeof input !== 'string') return false;

  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|TRUNCATE)\b)/i,
    /('|"|;|--|\*|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /\bEXEC(UTE)?\b/i,
    /\bSCRIPT\b/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Check if a string contains XSS patterns
 * @param {string} input - String to check
 * @returns {boolean} Whether input contains XSS patterns
 */
export function hasXssPatterns(input) {
  if (typeof input !== 'string') return false;

  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /data:/gi,
    /vbscript:/gi,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize object values recursively
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeInputAdvanced(obj, options) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInputAdvanced(key, { maxLength: 100 });
    result[sanitizedKey] = sanitizeObject(value, options);
  }
  return result;
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of chars to show at end
 * @returns {string} Masked string
 */
export function maskSensitiveData(data, visibleChars = 4) {
  if (typeof data !== 'string' || data.length <= visibleChars) {
    return '****';
  }
  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  return masked + visible;
}

/**
 * Security headers check
 * @returns {Object} Security headers status
 */
export function checkSecurityHeaders() {
  // This is informational only - actual headers are set server-side
  const recommendedHeaders = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Referrer-Policy',
  ];

  return {
    recommended: recommendedHeaders,
    note: 'Security headers should be configured server-side',
  };
}

export default {
  escapeHtml,
  sanitizeInputAdvanced,
  validateEmailSecure,
  validateUrl,
  generateSecureToken,
  generateCsrfToken,
  validateCsrfToken,
  safeJsonParse,
  generateCspNonce,
  hasSqlInjectionPatterns,
  hasXssPatterns,
  sanitizeObject,
  maskSensitiveData,
  checkSecurityHeaders,
};
