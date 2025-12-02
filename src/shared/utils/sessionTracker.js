/**
 * Session Activity Tracker
 * Manages periodic activity heartbeats to keep table sessions alive
 */

import { updateSessionActivity } from '@config/supabase';
import logger from '@shared/utils/logger';

class SessionActivityTracker {
  constructor() {
    this.sessionId = null;
    this.intervalId = null;
    this.heartbeatInterval = 45000; // 45 seconds (within 5-minute timeout)
    this.isActive = false;
  }

  /**
   * Start tracking activity for a session
   * @param {string} sessionId - The session ID to track
   */
  start(sessionId) {
    if (!sessionId) {
      logger.warn('⚠️ SessionActivityTracker: No session ID provided');
      return;
    }

    // Stop any existing tracker
    this.stop();

    this.sessionId = sessionId;
    this.isActive = true;

    logger.log('🔄 Started session activity tracker for:', sessionId);

    // Send immediate activity update
    this.sendActivityUpdate();

    // Start periodic heartbeat
    this.intervalId = setInterval(() => {
      if (this.isActive) {
        this.sendActivityUpdate();
      }
    }, this.heartbeatInterval);

    // Track user interactions
    this.attachEventListeners();
  }

  /**
   * Stop tracking activity
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.removeEventListeners();
    this.isActive = false;

    if (this.sessionId) {
      logger.log('🛑 Stopped session activity tracker for:', this.sessionId);
      this.sessionId = null;
    }
  }

  /**
   * Send activity update to backend
   */
  async sendActivityUpdate() {
    if (!this.sessionId || !this.isActive) return;

    try {
      await updateSessionActivity(this.sessionId);
      logger.log('💚 Session activity updated');
    } catch (err) {
      console.error('❌ Failed to update session activity:', err);
    }
  }

  /**
   * Attach event listeners for user interactions
   */
  attachEventListeners() {
    // Update activity on any user interaction
    this.handleUserActivity = () => {
      if (this.isActive) {
        this.sendActivityUpdate();
      }
    };

    // Track various user interactions
    const events = [
      'click',
      'scroll',
      'keypress',
      'touchstart',
      'mousemove',
    ];

    // Throttle to avoid too many calls
    let throttleTimeout = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          this.handleUserActivity();
          throttleTimeout = null;
        }, 5000); // Throttle to max once per 5 seconds
      }
    };

    this.throttledHandler = throttledHandler;

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Track page visibility changes
    this.handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        this.sendActivityUpdate();
      } else if (document.visibilityState === 'hidden' && this.isActive) {
        // Send one last update before going hidden
        this.sendActivityUpdate();
      }
    };

    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Try to send activity before page unload
    this.handleBeforeUnload = () => {
      if (this.isActive && this.sessionId) {
        // Use sendBeacon for reliable sending during unload
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_session_activity`;
        const payload = JSON.stringify({ p_session_id: this.sessionId });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, payload);
        }
      }
    };

    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (this.throttledHandler) {
      const events = [
        'click',
        'scroll',
        'keypress',
        'touchstart',
        'mousemove',
      ];

      events.forEach(event => {
        document.removeEventListener(event, this.throttledHandler);
      });

      this.throttledHandler = null;
    }

    if (this.handleVisibilityChange) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.handleVisibilityChange = null;
    }

    if (this.handleBeforeUnload) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      this.handleBeforeUnload = null;
    }
  }

  /**
   * Check if tracker is currently active
   */
  isTracking() {
    return this.isActive && this.sessionId !== null;
  }
}

// Export singleton instance
export const sessionActivityTracker = new SessionActivityTracker();

// Helper function to start tracking
export const startSessionTracking = (sessionId) => {
  sessionActivityTracker.start(sessionId);
};

// Helper function to stop tracking
export const stopSessionTracking = () => {
  sessionActivityTracker.stop();
};
