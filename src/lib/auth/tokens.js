/**
 * PAACS v2.0 — JWT Token Utilities
 * 
 * Handles creation, verification, and rotation of access and refresh tokens.
 * Uses RS256 asymmetric encryption for enhanced security.
 * 
 * @module lib/auth/tokens
 */

/* global process */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Configuration
// ============================================================================

const ACCESS_TOKEN_EXPIRES = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES = {
  default: '8h',      // 8 hours (standard session)
  rememberMe: '30d'   // 30 days (remember me)
};

// Keys should be loaded from environment variables (RSA key pairs)
const ACCESS_PRIVATE_KEY = typeof process !== 'undefined' ? process.env.ACCESS_TOKEN_PRIVATE_KEY : undefined;
const ACCESS_PUBLIC_KEY = typeof process !== 'undefined' ? process.env.ACCESS_TOKEN_PUBLIC_KEY : undefined;
const REFRESH_PRIVATE_KEY = typeof process !== 'undefined' ? process.env.REFRESH_TOKEN_PRIVATE_KEY : undefined;
const REFRESH_PUBLIC_KEY = typeof process !== 'undefined' ? process.env.REFRESH_TOKEN_PUBLIC_KEY : undefined;

// Validate keys on module load
if (!ACCESS_PRIVATE_KEY || !ACCESS_PUBLIC_KEY || !REFRESH_PRIVATE_KEY || !REFRESH_PUBLIC_KEY) {
  console.warn('Warning: Token signing keys not configured. JWT features will not work.');
}

// ============================================================================
// Access Token Functions
// ============================================================================

/**
 * Creates a short-lived access token (15 minutes)
 * Used for API authentication on every request
 * 
 * Note: With Supabase auth, session_id is no longer needed.
 * Supabase manages sessions internally.
 * 
 * @param {Object} payload - Token payload
 * @param {string} payload.sub - User ID (UUID)
 * @param {string} payload.role - User role (chef/waiter/manager/owner/superadmin)
 * @param {string} payload.restaurant_id - Restaurant ID (UUID)
 * @returns {Object} { token: string, jti: string, expiresAt: Date }
 */
export function createAccessToken(payload) {
  const jti = uuidv4();
  const expiresIn = ACCESS_TOKEN_EXPIRES;
  
  const tokenPayload = {
    ...payload,
    jti,
    token_type: 'access',
    iat: Math.floor(Date.now() / 1000)
  };
  
  try {
    const token = jwt.sign(tokenPayload, ACCESS_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn
    });
    
    // Calculate exact expiry time
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    return { token, jti, expiresAt };
  } catch (error) {
    console.error('Error creating access token:', error);
    throw new Error('Failed to create access token');
  }
}

/**
 * Verifies an access token and returns decoded payload
 * 
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, ACCESS_PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    
    // Validate token type
    if (payload.token_type !== 'access') {
      return null;
    }
    
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token expired - this is expected behavior
    } else if (error.name === 'JsonWebTokenError') {
      // Invalid token format
    } else {
      console.error('Error verifying access token:', error);
    }
    return null;
  }
}

/**
 * Decodes access token without verification (for debugging)
 * ⚠️ DO NOT use for authentication - use verifyAccessToken instead
 * 
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null
 */
export function decodeAccessToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

// ============================================================================
// Refresh Token Functions
// ============================================================================

/**
 * Creates a long-lived refresh token (8 hours or 30 days)
 * Stored in HttpOnly cookie, used to obtain new access tokens
 * 
 * Note: With Supabase auth, session_id is no longer needed.
 * Supabase manages sessions internally.
 * 
 * @param {Object} payload - Token payload
 * @param {string} payload.sub - User ID (UUID)
 * @param {Object} options - Configuration options
 * @param {boolean} options.rememberMe - If true, token lasts 30 days instead of 8 hours
 * @returns {Object} { token: string, jti: string, expiresAt: Date }
 */
export function createRefreshToken(payload, options = {}) {
  const jti = uuidv4();
  const { rememberMe = false } = options;
  const expiresIn = rememberMe ? REFRESH_TOKEN_EXPIRES.rememberMe : REFRESH_TOKEN_EXPIRES.default;
  
  const tokenPayload = {
    ...payload,
    jti,
    token_type: 'refresh',
    remember_me: rememberMe,
    iat: Math.floor(Date.now() / 1000)
  };
  
  try {
    const token = jwt.sign(tokenPayload, REFRESH_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn
    });
    
    // Calculate exact expiry time
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    return { token, jti, expiresAt };
  } catch (error) {
    console.error('Error creating refresh token:', error);
    throw new Error('Failed to create refresh token');
  }
}

/**
 * Verifies a refresh token and returns decoded payload
 * 
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, REFRESH_PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    
    // Validate token type
    if (payload.token_type !== 'refresh') {
      return null;
    }
    
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token expired - this is expected behavior
    } else if (error.name === 'JsonWebTokenError') {
      // Invalid token format
    } else {
      console.error('Error verifying refresh token:', error);
    }
    return null;
  }
}

/**
 * Decodes refresh token without verification (for debugging)
 * ⚠️ DO NOT use for authentication - use verifyRefreshToken instead
 * 
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null
 */
export function decodeRefreshToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

// ============================================================================
// Token Rotation Utilities
// ============================================================================

/**
 * Rotates refresh token (creates new token, invalidates old JTI)
 * Used in refresh endpoint to prevent token replay attacks
 * 
 * Note: With Supabase auth, session_id is no longer tracked.
 * Supabase handles token rotation internally.
 * 
 * @param {Object} oldPayload - Payload from old refresh token
 * @param {boolean} rememberMe - Whether to extend expiry
 * @returns {Object} { token: string, jti: string, expiresAt: Date }
 */
export function rotateRefreshToken(oldPayload, rememberMe = false) {
  // Create new refresh token with same user but new JTI
  const newPayload = {
    sub: oldPayload.sub
  };
  
  return createRefreshToken(newPayload, { rememberMe });
}

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Generates Set-Cookie header value for refresh token
 * 
 * @param {string} token - Refresh token string
 * @param {number} maxAge - Max age in seconds
 * @returns {string} Set-Cookie header value
 */
export function generateRefreshTokenCookie(token, maxAge) {
  const cookieOptions = [
    `refresh_token=${token}`,
    'HttpOnly',
    'Secure', // Only over HTTPS
    'SameSite=Strict', // CSRF protection
    'Path=/',
    `Max-Age=${maxAge}`
  ];
  
  return cookieOptions.join('; ');
}

/**
 * Generates Set-Cookie header value to clear refresh token
 * Used during logout
 * 
 * @returns {string} Set-Cookie header value
 */
export function clearRefreshTokenCookie() {
  return 'refresh_token=deleted; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

/**
 * Calculates Max-Age for cookie based on token expiry
 * 
 * @param {Date} expiresAt - Token expiration date
 * @returns {number} Max-Age in seconds
 */
export function calculateCookieMaxAge(expiresAt) {
  const now = new Date();
  const seconds = Math.floor((expiresAt - now) / 1000);
  return Math.max(0, seconds);
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates JWT structure without verifying signature
 * Useful for early rejection of malformed tokens
 * 
 * @param {string} token - JWT token string
 * @returns {boolean} True if valid JWT structure
 */
export function isValidJWTStructure(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3; // Header.Payload.Signature
}

/**
 * Checks if token is expired (without verification)
 * 
 * @param {string} token - JWT token string
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Gets time until token expiry
 * 
 * @param {string} token - JWT token string
 * @returns {number} Milliseconds until expiry (negative if expired)
 */
export function getTimeUntilExpiry(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return -1;
    return (decoded.exp * 1000) - Date.now();
  } catch {
    return -1;
  }
}

// ============================================================================
// Key Generation Utilities (for setup)
// ============================================================================

/**
 * Generates RSA key pair for JWT signing
 * Run this during initial setup to generate keys
 * 
 * ⚠️ This is a utility function for setup - DO NOT call in production code
 * Keys should be generated once and stored securely
 * 
 * @returns {Promise<Object>} { publicKey: string, privateKey: string }
 */
export async function generateRSAKeyPair() {
  const crypto = await import('crypto');
  
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) reject(err);
      else resolve({ publicKey, privateKey });
    });
  });
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Access token
  createAccessToken,
  verifyAccessToken,
  decodeAccessToken,
  
  // Refresh token
  createRefreshToken,
  verifyRefreshToken,
  decodeRefreshToken,
  rotateRefreshToken,
  
  // Cookie utilities
  generateRefreshTokenCookie,
  clearRefreshTokenCookie,
  calculateCookieMaxAge,
  
  // Validation
  isValidJWTStructure,
  isTokenExpired,
  getTimeUntilExpiry,
  
  // Setup
  generateRSAKeyPair
};
