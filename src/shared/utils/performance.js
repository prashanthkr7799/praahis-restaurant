/**
 * Performance Monitoring Utilities
 *
 * Utilities for measuring and reporting performance metrics
 */

/**
 * Web Vitals metrics collector
 */
export const webVitals = {
  /**
   * Report a performance metric
   * @param {Object} metric - The metric object from web-vitals
   */
  report(metric) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to analytics in production
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
      });
    }

    // Send to Sentry performance monitoring
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.setMeasurement(
        metric.name,
        metric.value,
        metric.name === 'CLS' ? '' : 'millisecond'
      );
    }
  },

  /**
   * Initialize web vitals collection
   */
  async init() {
    try {
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      onCLS(this.report);
      onFID(this.report);
      onFCP(this.report);
      onLCP(this.report);
      onTTFB(this.report);
      onINP(this.report);
    } catch (error) {
      // web-vitals not available
      console.warn('[Performance] web-vitals not available:', error);
    }
  },
};

/**
 * Custom performance marker
 */
export class PerformanceMarker {
  constructor(name) {
    this.name = name;
    this.startMark = `${name}-start`;
    this.endMark = `${name}-end`;
    this.measureName = `${name}-duration`;
  }

  start() {
    if (typeof performance !== 'undefined') {
      performance.mark(this.startMark);
    }
    return this;
  }

  end() {
    if (typeof performance !== 'undefined') {
      performance.mark(this.endMark);
      try {
        performance.measure(this.measureName, this.startMark, this.endMark);
        const entries = performance.getEntriesByName(this.measureName);
        const duration = entries[entries.length - 1]?.duration || 0;

        if (import.meta.env.DEV) {
          console.log(`[Performance] ${this.name}: ${duration.toFixed(2)}ms`);
        }

        return duration;
      } catch (error) {
        console.warn(`[Performance] Failed to measure ${this.name}:`, error);
        return 0;
      }
    }
    return 0;
  }

  clear() {
    if (typeof performance !== 'undefined') {
      performance.clearMarks(this.startMark);
      performance.clearMarks(this.endMark);
      performance.clearMeasures(this.measureName);
    }
  }
}

/**
 * Measure async function execution time
 * @param {string} name - Name for the measurement
 * @param {Function} fn - Async function to measure
 * @returns {Promise} Result of the function
 */
export async function measureAsync(name, fn) {
  const marker = new PerformanceMarker(name);
  marker.start();
  try {
    const result = await fn();
    return result;
  } finally {
    marker.end();
  }
}

/**
 * Measure sync function execution time
 * @param {string} name - Name for the measurement
 * @param {Function} fn - Sync function to measure
 * @returns {*} Result of the function
 */
export function measureSync(name, fn) {
  const marker = new PerformanceMarker(name);
  marker.start();
  try {
    const result = fn();
    return result;
  } finally {
    marker.end();
  }
}

/**
 * Performance budget checker
 */
export const performanceBudget = {
  budgets: {
    // Time to First Contentful Paint
    FCP: 1800, // 1.8s (good)
    // Largest Contentful Paint
    LCP: 2500, // 2.5s (good)
    // First Input Delay
    FID: 100, // 100ms (good)
    // Cumulative Layout Shift
    CLS: 0.1, // 0.1 (good)
    // Time to Interactive
    TTI: 3800, // 3.8s
    // Total Blocking Time
    TBT: 200, // 200ms
  },

  /**
   * Check if a metric is within budget
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @returns {Object} Budget check result
   */
  check(name, value) {
    const budget = this.budgets[name];
    if (budget === undefined) {
      return { inBudget: true, budget: null, value, diff: null };
    }

    const inBudget = value <= budget;
    const diff = value - budget;

    return {
      inBudget,
      budget,
      value,
      diff,
      percentage: ((value / budget) * 100).toFixed(1),
    };
  },

  /**
   * Set custom budget
   * @param {string} name - Metric name
   * @param {number} value - Budget value
   */
  setBudget(name, value) {
    this.budgets[name] = value;
  },
};

/**
 * Resource timing analyzer
 */
export const resourceTiming = {
  /**
   * Get all resource timing entries
   * @returns {Array} Resource timing entries
   */
  getEntries() {
    if (typeof performance === 'undefined') return [];
    return performance.getEntriesByType('resource');
  },

  /**
   * Get entries by type (script, css, img, etc.)
   * @param {string} type - Resource type
   * @returns {Array} Filtered entries
   */
  getByType(type) {
    return this.getEntries().filter((entry) => entry.initiatorType === type);
  },

  /**
   * Get slow resources (above threshold)
   * @param {number} threshold - Duration threshold in ms
   * @returns {Array} Slow resources
   */
  getSlow(threshold = 500) {
    return this.getEntries()
      .filter((entry) => entry.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  },

  /**
   * Get resource summary
   * @returns {Object} Summary by type
   */
  getSummary() {
    const entries = this.getEntries();
    const summary = {};

    entries.forEach((entry) => {
      const type = entry.initiatorType || 'other';
      if (!summary[type]) {
        summary[type] = { count: 0, totalDuration: 0, totalSize: 0 };
      }
      summary[type].count++;
      summary[type].totalDuration += entry.duration;
      summary[type].totalSize += entry.transferSize || 0;
    });

    // Calculate averages
    Object.keys(summary).forEach((type) => {
      summary[type].avgDuration = summary[type].totalDuration / summary[type].count;
    });

    return summary;
  },

  /**
   * Clear resource timing buffer
   */
  clear() {
    if (typeof performance !== 'undefined') {
      performance.clearResourceTimings();
    }
  },
};

/**
 * Memory usage tracker (Chrome only)
 */
export const memoryUsage = {
  /**
   * Get current memory usage
   * @returns {Object|null} Memory info or null if not available
   */
  get() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedMB: (memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMB: (memory.totalJSHeapSize / 1048576).toFixed(2),
        limitMB: (memory.jsHeapSizeLimit / 1048576).toFixed(2),
        usagePercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1),
      };
    }
    return null;
  },

  /**
   * Log memory usage to console
   */
  log() {
    const memory = this.get();
    if (memory) {
      console.log(
        `[Memory] Used: ${memory.usedMB}MB / ${memory.totalMB}MB (${memory.usagePercent}%)`
      );
    }
  },
};

export default {
  webVitals,
  PerformanceMarker,
  measureAsync,
  measureSync,
  performanceBudget,
  resourceTiming,
  memoryUsage,
};
