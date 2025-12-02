/**
 * Sentry Configuration
 * Error monitoring and performance tracking for production
 */
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error monitoring
 * Only initializes in production mode when DSN is configured
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Only initialize if we have a DSN and we're in production
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Not initialized - no DSN configured');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    
    // Sample rate for error reporting (1.0 = 100%)
    sampleRate: 1.0,
    
    // Performance monitoring sample rate (adjust in production)
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    
    // Session replay for debugging production issues
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      'chrome-extension://',
      'moz-extension://',
      // Common React errors that aren't actionable
      'ResizeObserver loop',
      'Non-Error promise rejection',
      // Network issues
      'Network request failed',
      'Failed to fetch',
      // User-caused
      'Canceled',
    ],
    
    // Before sending hook for custom filtering
    beforeSend(event, _hint) {
      // Filter out development errors
      if (import.meta.env.DEV) {
        return null;
      }
      
      // Add custom context
      if (event.user) {
        // Sanitize PII - only keep ID
        event.user = { id: event.user.id };
      }
      
      return event;
    },
  });
}

/**
 * Set user context for Sentry
 * Call this after successful authentication
 */
export function setSentryUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      // Only include non-PII data
      role: user.role,
      restaurant_id: user.restaurant_id,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(category, message, data = {}) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Capture exception manually
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message for logging important events
 */
export function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

// Export Sentry for advanced usage
export { Sentry };
