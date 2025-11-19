// Notification Service with Sound Alerts
// Handles browser notifications and sound playback for kitchen and service staff

class NotificationService {
  constructor() {
    this.audioContext = null;
    this.isUnlocked = false;
    this._unlockHandlersAttached = false;
    this.notificationPermission = 'default';
    this.init();
  }

  // Initialize audio context and request notification permission
  async init() {
    try {
      // Do NOT create AudioContext here to avoid autoplay warnings.
      // We'll create it only after a user gesture via registerUserGestureUnlock().

      // Request notification permission
      if ('Notification' in window) {
        this.notificationPermission = await Notification.requestPermission();
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Attach one-time listeners to unlock audio on first user gesture
  registerUserGestureUnlock() {
    if (this.isUnlocked || this._unlockHandlersAttached) return;

    const unlock = async () => {
      // Only proceed if this is an actual user activation (prevents synthetic events)
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        return;
      }
      try {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // With a real user gesture it's safe to resume; ensures 'running' state on Chrome/Safari
        if (this.audioContext.state !== 'running') {
          await this.audioContext.resume().catch(() => {});
        }
        this.isUnlocked = this.audioContext.state === 'running';
      } catch {
        // Swallow errors; user can try again with another gesture
      } finally {
        // Remove listeners regardless to avoid leaks; if not unlocked, next call will reattach
        window.removeEventListener('click', unlock, true);
        window.removeEventListener('touchstart', unlock, true);
        window.removeEventListener('keydown', unlock, true);
        this._unlockHandlersAttached = false;
      }
    };

    window.addEventListener('click', unlock, true);
    window.addEventListener('touchstart', unlock, true);
    window.addEventListener('keydown', unlock, true);
    this._unlockHandlersAttached = true;
  }

  // Whether audio can be played without violating autoplay policy
  isAudioAvailable() {
    return !!this.audioContext && this.isUnlocked && this.audioContext.state === 'running';
  }

  // Play notification sound
  playSound(type = 'default') {
    // Only attempt if audio is unlocked and running; otherwise skip silently
    if (!this.isAudioAvailable()) return;

    try {
      const sounds = {
        newOrder: { frequency: 800, duration: 0.3, pattern: [0, 0.15, 0.3] }, // Triple beep
        foodReady: { frequency: 600, duration: 0.5, pattern: [0, 0.6] }, // Double beep
        urgent: { frequency: 1000, duration: 0.2, pattern: [0, 0.1, 0.2, 0.3] }, // Four fast beeps
        success: { frequency: 700, duration: 0.4, pattern: [0] }, // Single beep
      };

      const sound = sounds[type] || sounds.default;
      
      sound.pattern.forEach(delay => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.value = sound.frequency;
          oscillator.type = 'sine';
          
          const now = this.audioContext.currentTime;
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + sound.duration);
          
          oscillator.start(now);
          oscillator.stop(now + sound.duration);
        }, delay * 1000);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // Show browser notification
  showNotification(title, options = {}) {
    if (this.notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/vite.svg',
          badge: '/vite.svg',
          vibrate: [200, 100, 200],
          ...options,
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    return null;
  }

  // Chef receives new order
  notifyNewOrder(orderNumber, tableNumber) {
    this.playSound('newOrder');
    this.showNotification('🔔 New Order Received!', {
      body: `Order #${orderNumber} from Table ${tableNumber}`,
      tag: 'new-order',
      requireInteraction: true,
    });
  }

  // Waiter receives new order notification
  notifyWaiterNewOrder(orderNumber, tableNumber) {
    this.playSound('newOrder');
    this.showNotification('📋 New Order Placed!', {
      body: `Table ${tableNumber} placed Order #${orderNumber}`,
      tag: 'waiter-new-order',
    });
  }

  // Food is ready for pickup
  notifyFoodReady(orderNumber, tableNumber) {
    this.playSound('foodReady');
    this.showNotification('✅ Order Ready!', {
      body: `Order #${orderNumber} for Table ${tableNumber} is ready to serve`,
      tag: 'food-ready',
      requireInteraction: true,
    });
  }

  // Order status update
  notifyStatusUpdate(orderNumber, status) {
    this.playSound('success');
    this.showNotification('📢 Order Update', {
      body: `Order #${orderNumber} is now ${status}`,
      tag: 'status-update',
    });
  }

  // Test notification
  testNotification() {
    this.playSound('newOrder');
    this.showNotification('🔔 Test Notification', {
      body: 'Notification system is working correctly!',
      tag: 'test',
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Export individual methods for convenience
export const {
  playSound,
  showNotification,
  notifyNewOrder,
  notifyWaiterNewOrder,
  notifyFoodReady,
  notifyStatusUpdate,
  testNotification,
} = notificationService;
