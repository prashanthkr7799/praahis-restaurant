/**
 * API Rate Limiter
 * Prevents abuse by limiting API calls per time window
 * Uses token bucket algorithm for smooth rate limiting
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 100; // Max requests per window
    this.windowMs = options.windowMs || 60000; // Time window in ms (default: 1 minute)
    this.buckets = new Map(); // endpoint -> { tokens, lastRefill }
    this.queue = new Map(); // endpoint -> Promise[]
  }

  /**
   * Get current bucket state for an endpoint
   */
  getBucket(endpoint) {
    if (!this.buckets.has(endpoint)) {
      this.buckets.set(endpoint, {
        tokens: this.maxRequests,
        lastRefill: Date.now(),
      });
    }
    return this.buckets.get(endpoint);
  }

  /**
   * Refill tokens based on elapsed time
   */
  refillTokens(bucket) {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.windowMs) * this.maxRequests);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  /**
   * Check if request can proceed
   */
  canProceed(endpoint) {
    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);
    return bucket.tokens > 0;
  }

  /**
   * Consume a token for the endpoint
   */
  consume(endpoint) {
    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Get wait time until next available token
   */
  getWaitTime(endpoint) {
    const bucket = this.getBucket(endpoint);
    if (bucket.tokens > 0) return 0;

    const timePerToken = this.windowMs / this.maxRequests;
    return timePerToken;
  }

  /**
   * Wait for rate limit and then proceed
   */
  async waitForSlot(endpoint) {
    while (!this.canProceed(endpoint)) {
      const waitTime = this.getWaitTime(endpoint);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.consume(endpoint);
  }

  /**
   * Get remaining tokens for an endpoint
   */
  getRemainingTokens(endpoint) {
    const bucket = this.getBucket(endpoint);
    this.refillTokens(bucket);
    return bucket.tokens;
  }

  /**
   * Reset rate limit for an endpoint
   */
  reset(endpoint) {
    this.buckets.delete(endpoint);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.buckets.clear();
  }
}

// Pre-configured limiters for different use cases
export const apiLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 100 requests per minute
});

export const authLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 5 auth attempts per minute
});

export const uploadLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 10 uploads per minute
});

/**
 * Rate-limited fetch wrapper
 */
export async function rateLimitedFetch(url, options = {}, limiter = apiLimiter) {
  const endpoint = new URL(url, window.location.origin).pathname;

  // Wait for rate limit slot
  await limiter.waitForSlot(endpoint);

  // Proceed with fetch
  return fetch(url, options);
}

/**
 * Decorator for rate limiting async functions
 */
export function withRateLimit(fn, limiter = apiLimiter, endpointKey = 'default') {
  return async function rateLimited(...args) {
    await limiter.waitForSlot(endpointKey);
    return fn.apply(this, args);
  };
}

/**
 * React hook for rate limiting
 */
export function useRateLimiter(limiter = apiLimiter, endpoint = 'default') {
  const canProceed = () => limiter.canProceed(endpoint);
  const consume = () => limiter.consume(endpoint);
  const remaining = () => limiter.getRemainingTokens(endpoint);
  const waitTime = () => limiter.getWaitTime(endpoint);

  return {
    canProceed,
    consume,
    remaining,
    waitTime,
    limiter,
  };
}

export default RateLimiter;
