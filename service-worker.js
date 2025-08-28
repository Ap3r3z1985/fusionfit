// A version number is the key to updating your service worker.
// CHANGE THIS VERSION every time you deploy a new update!
const CACHE_NAME = 'fusionfit-cache-v3';

// List of files that make up the "app shell"
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.png',
  '/manifest.json',
  '/style.css', // <-- Add your main stylesheet
  '/app.js'     // <-- Add your main script
];

// --- INSTALL: Cache the app shell & activate immediately ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // ADDED: This forces the new service worker to activate immediately.
        return self.skipWaiting();
      })
  );
});

// --- ACTIVATE: Clean up old caches & take control ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If the cache name is not our current one, delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // ADDED: This tells the service worker to take control of open pages.
      return self.clients.claim();
    })
  );
});

// --- FETCH: Stale-While-Revalidate Strategy ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Create a promise that fetches the latest version from the network.
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If we get a valid response, update the cache with the new version.
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // Return the cached version immediately if it exists,
        // while the fetch promise runs in the background to get the update.
        return cachedResponse || fetchPromise;
      });
    })
  );
});