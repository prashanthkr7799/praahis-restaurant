/**
 * Validation Utilities Tests
 * Comprehensive tests for form validation functions
 */
import { describe, it, expect } from 'vitest';
import {
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
} from './validators';

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept email with numbers', () => {
      expect(validateEmail('user123@example123.com')).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid emails', () => {
    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject null', () => {
      const result = validateEmail(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject undefined', () => {
      const result = validateEmail(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject whitespace only', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should reject email with spaces', () => {
      const result = validateEmail('test @example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });
  });
});

describe('validatePhone', () => {
  describe('valid phone numbers', () => {
    it('should accept 10-digit number starting with 9', () => {
      expect(validatePhone('9876543210')).toEqual({ isValid: true, error: null });
    });

    it('should accept 10-digit number starting with 8', () => {
      expect(validatePhone('8765432109')).toEqual({ isValid: true, error: null });
    });

    it('should accept 10-digit number starting with 7', () => {
      expect(validatePhone('7654321098')).toEqual({ isValid: true, error: null });
    });

    it('should accept 10-digit number starting with 6', () => {
      expect(validatePhone('6543210987')).toEqual({ isValid: true, error: null });
    });

    it('should accept phone with spaces', () => {
      expect(validatePhone('987 654 3210')).toEqual({ isValid: true, error: null });
    });

    it('should accept phone with dashes', () => {
      expect(validatePhone('987-654-3210')).toEqual({ isValid: true, error: null });
    });

    it('should accept phone with parentheses', () => {
      expect(validatePhone('(987) 654-3210')).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid phone numbers', () => {
    it('should reject empty string', () => {
      const result = validatePhone('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should reject null', () => {
      const result = validatePhone(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should reject undefined', () => {
      const result = validatePhone(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should reject 9-digit number', () => {
      const result = validatePhone('987654321');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 10-digit phone number');
    });

    it('should reject 11-digit number', () => {
      const result = validatePhone('98765432101');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 10-digit phone number');
    });

    it('should reject number starting with 5', () => {
      const result = validatePhone('5876543210');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 10-digit phone number');
    });

    it('should reject number starting with 0', () => {
      const result = validatePhone('0876543210');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 10-digit phone number');
    });

    it('should reject alphanumeric input', () => {
      const result = validatePhone('98765abc10');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid 10-digit phone number');
    });
  });
});

describe('validatePrice', () => {
  describe('valid prices', () => {
    it('should accept zero', () => {
      expect(validatePrice(0)).toEqual({ isValid: true, error: null });
    });

    it('should accept positive integer', () => {
      expect(validatePrice(100)).toEqual({ isValid: true, error: null });
    });

    it('should accept positive decimal', () => {
      expect(validatePrice(99.99)).toEqual({ isValid: true, error: null });
    });

    it('should accept string number', () => {
      expect(validatePrice('150.50')).toEqual({ isValid: true, error: null });
    });

    it('should accept maximum valid price', () => {
      expect(validatePrice(99999)).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid prices', () => {
    it('should reject empty string', () => {
      const result = validatePrice('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price is required');
    });

    it('should reject null', () => {
      const result = validatePrice(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price is required');
    });

    it('should reject undefined', () => {
      const result = validatePrice(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price is required');
    });

    it('should reject non-numeric string', () => {
      const result = validatePrice('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price must be a valid number');
    });

    it('should reject negative price', () => {
      const result = validatePrice(-10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price cannot be negative');
    });

    it('should reject price exceeding maximum', () => {
      const result = validatePrice(100000);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Price is too large');
    });
  });
});

describe('validateRequired', () => {
  describe('valid values', () => {
    it('should accept non-empty string', () => {
      expect(validateRequired('hello')).toEqual({ isValid: true, error: null });
    });

    it('should accept number zero', () => {
      expect(validateRequired(0)).toEqual({ isValid: true, error: null });
    });

    it('should accept positive number', () => {
      expect(validateRequired(42)).toEqual({ isValid: true, error: null });
    });

    it('should accept boolean false', () => {
      expect(validateRequired(false)).toEqual({ isValid: true, error: null });
    });

    it('should accept non-empty array', () => {
      expect(validateRequired([1, 2, 3])).toEqual({ isValid: true, error: null });
    });

    it('should accept object', () => {
      expect(validateRequired({ key: 'value' })).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid values', () => {
    it('should reject null', () => {
      const result = validateRequired(null, 'Name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject undefined', () => {
      const result = validateRequired(undefined, 'Email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject empty string', () => {
      const result = validateRequired('', 'Description');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description is required');
    });

    it('should reject whitespace only string', () => {
      const result = validateRequired('   ', 'Title');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should reject empty array', () => {
      const result = validateRequired([], 'Items');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Items must have at least one item');
    });

    it('should use default field name', () => {
      const result = validateRequired(null);
      expect(result.error).toBe('This field is required');
    });
  });
});

describe('validateLength', () => {
  describe('valid lengths', () => {
    it('should accept string at minimum length', () => {
      expect(validateLength('abc', 3, 10)).toEqual({ isValid: true, error: null });
    });

    it('should accept string at maximum length', () => {
      expect(validateLength('abcdefghij', 3, 10)).toEqual({ isValid: true, error: null });
    });

    it('should accept string within range', () => {
      expect(validateLength('hello', 3, 10)).toEqual({ isValid: true, error: null });
    });

    it('should accept string when no max specified', () => {
      expect(validateLength('hello world this is a long string', 3)).toEqual({
        isValid: true,
        error: null,
      });
    });
  });

  describe('invalid lengths', () => {
    it('should reject null', () => {
      const result = validateLength(null, 3, 10, 'Name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be a string');
    });

    it('should reject undefined', () => {
      const result = validateLength(undefined, 3, 10, 'Name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be a string');
    });

    it('should reject string below minimum', () => {
      const result = validateLength('ab', 3, 10, 'Username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username must be at least 3 characters');
    });

    it('should reject string above maximum', () => {
      const result = validateLength('abcdefghijk', 3, 10, 'Username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username must be at most 10 characters');
    });

    it('should reject number', () => {
      const result = validateLength(12345, 3, 10, 'Code');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Code must be a string');
    });
  });
});

describe('validatePassword', () => {
  describe('valid passwords', () => {
    it('should accept 8 character password', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return weak strength for simple password', () => {
      const result = validatePassword('password');
      expect(result.strength).toBe('weak');
    });

    it('should return medium strength for mixed password', () => {
      const result = validatePassword('Password1!');
      expect(result.strength).toBe('medium');
    });

    it('should return strong strength for complex password', () => {
      const result = validatePassword('MyP@ssw0rd123!');
      expect(result.strength).toBe('strong');
    });
  });

  describe('invalid passwords', () => {
    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.strength).toBe('none');
    });

    it('should reject null', () => {
      const result = validatePassword(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
      expect(result.strength).toBe('weak');
    });

    it('should reject whitespace only', () => {
      const result = validatePassword('        ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });
  });
});

describe('validateRange', () => {
  describe('valid ranges', () => {
    it('should accept value at minimum', () => {
      expect(validateRange(0, 0, 100)).toEqual({ isValid: true, error: null });
    });

    it('should accept value at maximum', () => {
      expect(validateRange(100, 0, 100)).toEqual({ isValid: true, error: null });
    });

    it('should accept value within range', () => {
      expect(validateRange(50, 0, 100)).toEqual({ isValid: true, error: null });
    });

    it('should accept string number', () => {
      expect(validateRange('50', 0, 100)).toEqual({ isValid: true, error: null });
    });

    it('should accept negative values when in range', () => {
      expect(validateRange(-5, -10, 0)).toEqual({ isValid: true, error: null });
    });

    it('should accept when no max specified', () => {
      expect(validateRange(1000, 0, undefined)).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid ranges', () => {
    it('should reject non-numeric value', () => {
      const result = validateRange('abc', 0, 100, 'Quantity');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quantity must be a number');
    });

    it('should reject value below minimum', () => {
      const result = validateRange(-1, 0, 100, 'Age');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Age must be at least 0');
    });

    it('should reject value above maximum', () => {
      const result = validateRange(101, 0, 100, 'Percentage');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Percentage must be at most 100');
    });
  });
});

describe('validateURL', () => {
  describe('valid URLs', () => {
    it('should accept http URL', () => {
      expect(validateURL('http://example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept https URL', () => {
      expect(validateURL('https://example.com')).toEqual({ isValid: true, error: null });
    });

    it('should accept URL with path', () => {
      expect(validateURL('https://example.com/path/to/page')).toEqual({
        isValid: true,
        error: null,
      });
    });

    it('should accept URL with query string', () => {
      expect(validateURL('https://example.com?foo=bar')).toEqual({ isValid: true, error: null });
    });

    it('should accept URL with port', () => {
      expect(validateURL('http://localhost:3000')).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty string', () => {
      const result = validateURL('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should reject null', () => {
      const result = validateURL(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should reject plain text', () => {
      const result = validateURL('not a url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid URL');
    });

    it('should reject URL without protocol', () => {
      const result = validateURL('example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid URL');
    });
  });
});

describe('validateDate', () => {
  describe('valid dates', () => {
    it('should accept valid date string', () => {
      expect(validateDate('2024-01-15')).toEqual({ isValid: true, error: null });
    });

    it('should accept Date object', () => {
      expect(validateDate(new Date())).toEqual({ isValid: true, error: null });
    });

    it('should accept past date when allowPast is true', () => {
      expect(validateDate('2020-01-01', true)).toEqual({ isValid: true, error: null });
    });

    it('should accept future date when allowPast is false', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validateDate(futureDate, false)).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid dates', () => {
    it('should reject null', () => {
      const result = validateDate(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date is required');
    });

    it('should reject undefined', () => {
      const result = validateDate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date is required');
    });

    it('should reject invalid date string', () => {
      const result = validateDate('not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });

    it('should reject past date when allowPast is false', () => {
      const result = validateDate('2020-01-01', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date cannot be in the past');
    });
  });
});

describe('validateDateRange', () => {
  describe('valid date ranges', () => {
    it('should accept valid date range', () => {
      expect(validateDateRange('2024-01-01', '2024-01-31')).toEqual({ isValid: true, error: null });
    });

    it('should accept same start and end date', () => {
      expect(validateDateRange('2024-01-15', '2024-01-15')).toEqual({ isValid: true, error: null });
    });

    it('should accept Date objects', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(validateDateRange(start, end)).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid date ranges', () => {
    it('should reject missing start date', () => {
      const result = validateDateRange(null, '2024-01-31');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Both start and end dates are required');
    });

    it('should reject missing end date', () => {
      const result = validateDateRange('2024-01-01', null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Both start and end dates are required');
    });

    it('should reject invalid start date', () => {
      const result = validateDateRange('invalid', '2024-01-31');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter valid dates');
    });

    it('should reject invalid end date', () => {
      const result = validateDateRange('2024-01-01', 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter valid dates');
    });

    it('should reject end date before start date', () => {
      const result = validateDateRange('2024-01-31', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });
  });
});

describe('validateFileType', () => {
  describe('valid file types', () => {
    it('should accept JPEG file', () => {
      const file = { type: 'image/jpeg' };
      expect(validateFileType(file)).toEqual({ isValid: true, error: null });
    });

    it('should accept PNG file', () => {
      const file = { type: 'image/png' };
      expect(validateFileType(file)).toEqual({ isValid: true, error: null });
    });

    it('should accept GIF file', () => {
      const file = { type: 'image/gif' };
      expect(validateFileType(file)).toEqual({ isValid: true, error: null });
    });

    it('should accept custom allowed types', () => {
      const file = { type: 'application/pdf' };
      expect(validateFileType(file, ['application/pdf'])).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid file types', () => {
    it('should reject null file', () => {
      const result = validateFileType(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is required');
    });

    it('should reject undefined file', () => {
      const result = validateFileType(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is required');
    });

    it('should reject disallowed file type', () => {
      const file = { type: 'application/pdf' };
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File must be of type');
    });
  });
});

describe('validateFileSize', () => {
  describe('valid file sizes', () => {
    it('should accept file under limit', () => {
      const file = { size: 1024 * 1024 }; // 1MB
      expect(validateFileSize(file, 5)).toEqual({ isValid: true, error: null });
    });

    it('should accept file at exact limit', () => {
      const file = { size: 5 * 1024 * 1024 }; // 5MB
      expect(validateFileSize(file, 5)).toEqual({ isValid: true, error: null });
    });

    it('should accept small file', () => {
      const file = { size: 100 }; // 100 bytes
      expect(validateFileSize(file, 1)).toEqual({ isValid: true, error: null });
    });
  });

  describe('invalid file sizes', () => {
    it('should reject null file', () => {
      const result = validateFileSize(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is required');
    });

    it('should reject file over limit', () => {
      const file = { size: 6 * 1024 * 1024 }; // 6MB
      const result = validateFileSize(file, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 5MB');
    });

    it('should reject large file with custom limit', () => {
      const file = { size: 11 * 1024 * 1024 }; // 11MB
      const result = validateFileSize(file, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 10MB');
    });
  });
});

describe('validateForm', () => {
  it('should validate form with rules', () => {
    const formData = {
      email: 'test@example.com',
      name: 'John',
    };
    const rules = {
      email: [{ validator: validateEmail, args: [] }],
      name: [{ validator: validateRequired, args: [] }],
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return errors for invalid data', () => {
    const formData = {
      email: 'invalid',
      name: '',
    };
    const rules = {
      email: [{ validator: validateEmail, args: [] }],
      name: [{ validator: validateRequired, args: [] }],
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should handle empty form data', () => {
    const result = validateForm({}, {});
    expect(result.isValid).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should remove HTML-like characters', () => {
    expect(sanitizeInput('<script>alert()</script>')).toBe('scriptalert()/script');
  });

  it('should normalize multiple spaces', () => {
    expect(sanitizeInput('hello    world')).toBe('hello world');
  });

  it('should return non-string input as-is', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(null)).toBe(null);
  });
});

describe('validateDiscountPercentage', () => {
  it('should accept valid percentage (0)', () => {
    const result = validateDiscountPercentage(0);
    expect(result.isValid).toBe(true);
  });

  it('should accept valid percentage (50)', () => {
    const result = validateDiscountPercentage(50);
    expect(result.isValid).toBe(true);
  });

  it('should accept valid percentage (100)', () => {
    const result = validateDiscountPercentage(100);
    expect(result.isValid).toBe(true);
  });

  it('should reject null', () => {
    const result = validateDiscountPercentage(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Discount percentage is required');
  });

  it('should reject undefined', () => {
    const result = validateDiscountPercentage(undefined);
    expect(result.isValid).toBe(false);
  });

  it('should reject empty string', () => {
    const result = validateDiscountPercentage('');
    expect(result.isValid).toBe(false);
  });

  it('should reject NaN', () => {
    const result = validateDiscountPercentage('abc');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid number');
  });

  it('should reject negative percentage', () => {
    const result = validateDiscountPercentage(-10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Discount cannot be negative');
  });

  it('should reject percentage over 100', () => {
    const result = validateDiscountPercentage(150);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Discount cannot exceed 100%');
  });
});

describe('validateDiscountAmount', () => {
  it('should accept valid discount less than bill', () => {
    const result = validateDiscountAmount(50, 100);
    expect(result.isValid).toBe(true);
  });

  it('should accept discount equal to bill', () => {
    const result = validateDiscountAmount(100, 100);
    expect(result.isValid).toBe(true);
  });

  it('should reject null discount', () => {
    const result = validateDiscountAmount(null, 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Discount amount is required');
  });

  it('should reject negative discount', () => {
    const result = validateDiscountAmount(-50, 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Discount cannot be negative');
  });

  it('should reject discount exceeding bill', () => {
    const result = validateDiscountAmount(150, 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed bill amount');
  });

  it('should reject invalid amounts', () => {
    const result = validateDiscountAmount('abc', 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid amount');
  });
});

describe('validateRefundAmount', () => {
  it('should accept valid refund', () => {
    const result = validateRefundAmount(50, 100, 0);
    expect(result.isValid).toBe(true);
  });

  it('should accept refund equal to paid amount', () => {
    const result = validateRefundAmount(100, 100, 0);
    expect(result.isValid).toBe(true);
  });

  it('should reject null refund', () => {
    const result = validateRefundAmount(null, 100, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Refund amount is required');
  });

  it('should reject zero refund', () => {
    const result = validateRefundAmount(0, 100, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Refund amount must be greater than 0');
  });

  it('should reject negative refund', () => {
    const result = validateRefundAmount(-50, 100, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Refund amount must be greater than 0');
  });

  it('should reject refund exceeding paid amount', () => {
    const result = validateRefundAmount(150, 100, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed paid amount');
  });

  it('should consider already refunded amount', () => {
    const result = validateRefundAmount(80, 100, 30);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed paid amount');
  });

  it('should accept refund when total equals paid', () => {
    const result = validateRefundAmount(50, 100, 50);
    expect(result.isValid).toBe(true);
  });
});

describe('formatPhoneNumber', () => {
  it('should format 10-digit phone number', () => {
    expect(formatPhoneNumber('9876543210')).toBe('987-654-3210');
  });

  it('should format phone with spaces', () => {
    expect(formatPhoneNumber('987 654 3210')).toBe('987-654-3210');
  });

  it('should format phone with dashes', () => {
    expect(formatPhoneNumber('987-654-3210')).toBe('987-654-3210');
  });

  it('should return empty string for null', () => {
    expect(formatPhoneNumber(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatPhoneNumber(undefined)).toBe('');
  });

  it('should return as-is for non-10-digit numbers', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
  });
});

describe('cleanPhoneNumber', () => {
  it('should remove spaces', () => {
    expect(cleanPhoneNumber('987 654 3210')).toBe('9876543210');
  });

  it('should remove dashes', () => {
    expect(cleanPhoneNumber('987-654-3210')).toBe('9876543210');
  });

  it('should remove parentheses', () => {
    expect(cleanPhoneNumber('(987) 654-3210')).toBe('9876543210');
  });

  it('should return empty string for null', () => {
    expect(cleanPhoneNumber(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(cleanPhoneNumber(undefined)).toBe('');
  });

  it('should preserve digits only', () => {
    expect(cleanPhoneNumber('+91 (987) 654-3210')).toBe('+919876543210');
  });
});
