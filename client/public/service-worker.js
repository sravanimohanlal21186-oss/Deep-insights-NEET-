import * as cacheNames from './cacheNames';

// Install event - cache essential assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(cacheNames.CACHE_VERSION).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/logo192.png',
        '/logo512.png',
      ]).catch(err => console.log('Cache add failed:', err));
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== cacheNames.CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // API requests: network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  }
  // Static assets: cache first, then network
  else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
  }
  // HTML: network first with cache fallback
  else {
    event.respondWith(networkFirstStrategy(request, '/index.html'));
  }
});

// Network first strategy
async function networkFirstStrategy(request, fallback = null) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful API responses
      if (request.url.includes('/api/')) {
        const cache = await caches.open(cacheNames.CACHE_VERSION);
        cache.put(request, response.clone());
      }
      return response;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
  }

  // Try cache
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  // Fallback
  if (fallback) {
    return caches.match(fallback) || new Response('Offline - Page not available', { status: 503 });
  }

  return new Response('Offline - Request failed', { status: 503 });
}

// Cache first strategy
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheNames.CACHE_VERSION);
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
  }

  return new Response('Offline - Asset not available', { status: 503 });
}

// Check if URL is static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/.test(pathname);
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-exam-results') {
    event.waitUntil(syncExamResults());
  }
});

async function syncExamResults() {
  try {
    const db = await openDB();
    const pendingResults = await db.getAll('pendingResults');
    
    for (const result of pendingResults) {
      try {
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
        
        await db.delete('pendingResults', result.id);
      } catch (error) {
        console.log('Sync failed for result:', result.id);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NEETInsights', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    tag: 'neet-notification',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Deep Insights NEET', options));
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
