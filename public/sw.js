/**
 * Service Worker for Praahis
 * Provides offline support and caching strategies
 */

const CACHE_NAME = 'praahis-v2';
const STATIC_CACHE = 'praahis-static-v2';
const DYNAMIC_CACHE = 'praahis-dynamic-v2';
const API_CACHE = 'praahis-api-v2';

// Assets to cache immediately on install
const STATIC_ASSETS = ['/', '/index.html', '/logo.svg', '/manifest.json'];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/rest\/v1\/menu_items/,
  /\/rest\/v1\/menu_categories/,
  /\/rest\/v1\/restaurants/,
];

// Max age for different cache types (in seconds)
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60, // 7 days
  api: 5 * 60, // 5 minutes
  dynamic: 24 * 60 * 60, // 1 day
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('praahis-') &&
                name !== CACHE_NAME &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== API_CACHE
              );
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Check if request is for API
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.hostname.includes('supabase')
  );
}

/**
 * Check if API response should be cached
 */
function shouldCacheApiResponse(request) {
  const url = new URL(request.url);
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

/**
 * Network-first strategy for API calls
 */
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);

    // Only cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();

      // Add timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      const cacheTime = parseInt(cachedResponse.headers.get('sw-cache-time') || '0');
      const age = (Date.now() - cacheTime) / 1000;

      // Return cached if not too old
      if (age < maxAge) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
    }

    // Return offline response for HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
      return (
        caches.match('/offline.html') ||
        new Response('<h1>Offline</h1><p>Please check your connection.</p>', {
          headers: { 'Content-Type': 'text/html' },
        })
      );
    }

    throw error;
  }
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Fetch event handler
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip external requests (Google Fonts, CDNs, etc.) - let browser handle them directly
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests
  if (isApiRequest(request)) {
    if (shouldCacheApiResponse(request)) {
      event.respondWith(networkFirst(request, API_CACHE, CACHE_MAX_AGE.api));
    }
    return;
  }

  // Handle static assets (JS, CSS, images)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, CACHE_MAX_AGE.dynamic));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

/**
 * Background sync for offline form submissions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

/**
 * Sync pending orders when back online
 */
async function syncPendingOrders() {
  // This would sync any orders stored in IndexedDB while offline
  console.log('[SW] Syncing pending orders...');
  // Implementation would depend on your offline storage strategy
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: data.url ? { url: data.url } : null,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Praahis', options));
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

console.log('[SW] Service Worker loaded');
