/**
 * Service Worker Registration
 * Handles registration, updates, and communication with the service worker
 */

const SW_PATH = '/sw.js';

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    console.log('[SW] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[SW] New version available');
            dispatchUpdateEvent();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[SW] Unregistered:', success);
    return success;
  } catch (error) {
    console.error('[SW] Unregister failed:', error);
    return false;
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting() {
  const registration = await navigator.serviceWorker.ready;

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Dispatch update event for UI to handle
 */
function dispatchUpdateEvent() {
  window.dispatchEvent(new CustomEvent('sw-update-available'));
}

/**
 * Check if app is running in standalone mode (PWA)
 */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

/**
 * Check if online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[SW] Notifications not supported');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(vapidPublicKey) {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[SW] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[SW] Push subscription failed:', error);
    return null;
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

/**
 * Get cache storage usage
 */
export async function getCacheUsage() {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage || 0,
    quota: estimate.quota || 0,
    usedMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
    quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
    percentUsed: (((estimate.usage || 0) / (estimate.quota || 1)) * 100).toFixed(2),
  };
}

export default {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  skipWaiting,
  isSupported: isServiceWorkerSupported,
  isStandalone,
  isOnline,
  onNetworkChange,
  requestNotificationPermission,
  subscribeToPush,
  clearAllCaches,
  getCacheUsage,
};
