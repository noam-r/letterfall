const CACHE_NAME = 'letterfall-v1';
const STATIC_CACHE = 'letterfall-static-v1';
const DYNAMIC_CACHE = 'letterfall-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// Assets to cache on demand
const CACHEABLE_EXTENSIONS = [
  '.js',
  '.css',
  '.woff2',
  '.woff',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.mp3',
  '.ogg',
  '.wav'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/data\/topics\//
];

// Cache-first resources (try cache first, fallback to network)
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff2?|ttf)$/,
  /\/assets\//
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (unless they're for assets)
  if (url.origin !== location.origin && !isCacheableAsset(url.pathname)) {
    return;
  }

  // Determine caching strategy
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network-first strategy: Try network first, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for HTML requests
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Cache-first strategy: Try cache first, fallback to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch', request.url, error);
    throw error;
  }
}

// Stale-while-revalidate strategy: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('Service Worker: Background fetch failed', request.url, error);
    });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return networkResponsePromise;
}

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isCacheableAsset(pathname) {
  return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

// Handle background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('Service Worker: Handling background sync');
  // Implement retry logic for failed requests if needed
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push notification received', data);
    
    // Handle push notifications if needed
  }
});

// Clean up old caches periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanOldCaches());
  }
});

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('letterfall-') && 
    name !== STATIC_CACHE && 
    name !== DYNAMIC_CACHE
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log('Service Worker: Cleaned old caches', oldCaches);
}