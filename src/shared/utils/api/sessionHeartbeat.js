/**
 * Session Heartbeat Manager
 * Keeps Supabase session alive by periodically refreshing the token
 * during active user sessions
 */

import { supabase } from './supabaseClient';
import { supabaseOwner } from './supabaseOwnerClient';

class SessionHeartbeat {
  constructor() {
    this.heartbeatInterval = null;
    this.lastActivity = Date.now();
    this.HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes (refresh before 1hr expiry)
    this.INACTIVITY_TIMEOUT = 1 * 60 * 60 * 1000; // 1 hour
  }

  start() {
    if (this.heartbeatInterval) {
      return; // Already running
    }

    console.log('🫀 Session heartbeat started');

    // Track user activity
    this.setupActivityTracking();

    // Periodically refresh token
    this.heartbeatInterval = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;

      // If user has been inactive for more than 1 hour, stop heartbeat
      if (timeSinceLastActivity > this.INACTIVITY_TIMEOUT) {
        console.log('⏱️ User inactive for 1+ hour, stopping heartbeat');
        this.stop();
        return;
      }

      // Refresh both sessions if they exist
      try {
        const { data: managerSession } = await supabase.auth.getSession();
        if (managerSession?.session) {
          await supabase.auth.refreshSession();
          console.log('🔄 Manager session refreshed');
        }

        const { data: ownerSession } = await supabaseOwner.auth.getSession();
        if (ownerSession?.session) {
          await supabaseOwner.auth.refreshSession();
          console.log('🔄 Owner session refreshed');
        }
      } catch (error) {
        console.error('❌ Failed to refresh session:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.removeActivityTracking();
      console.log('💔 Session heartbeat stopped');
    }
  }

  setupActivityTracking() {
    // Update last activity timestamp on user interactions
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };

    // Track various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Store events for cleanup
    this.activityEvents = { events, handler: updateActivity };
  }

  removeActivityTracking() {
    if (this.activityEvents) {
      const { events, handler } = this.activityEvents;
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
      this.activityEvents = null;
    }
  }

  resetActivity() {
    this.lastActivity = Date.now();
  }
}

// Create singleton instance
const sessionHeartbeat = new SessionHeartbeat();

// Auto-start on authenticated state
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    sessionHeartbeat.start();
    sessionHeartbeat.resetActivity();
  } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    sessionHeartbeat.stop();
  }
});

supabaseOwner.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    sessionHeartbeat.start();
    sessionHeartbeat.resetActivity();
  } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    sessionHeartbeat.stop();
  }
});

export default sessionHeartbeat;
