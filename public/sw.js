/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'moulana-restaurant-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Install Event - Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching Core Shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic caching with specific strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Skip non-GET requests & socket connections (HMR)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Ignore Firebase Firestore and Auth calls
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('identitytoolkit')) {
    return;
  }

  // 3. SPA Navigation Fallback: for URLs without file extensions (like /?view=customer or any client route), serve '/' (index.html) from cache
  const isNavigation = request.mode === 'navigate';
  const hasNoExtension = !url.pathname.includes('.');
  if (isNavigation || hasNoExtension) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          console.log('[Service Worker] Offline fallback serving index.html');
          return caches.match('/');
        })
    );
    return;
  }

  // 4. Default strategy: Network first, fallback to cached copies
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache valid successful network assets dynamically
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline, try matching the cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Specially support caching external fonts & images
          if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('img.icons8.com') || url.hostname.includes('images.unsplash.com')) {
            return caches.match(request);
          }

          // General offline failure response
          return new Response('الاتصال بالإنترنت مطلوب حالياً لعرض المحتوى المتجدد.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
