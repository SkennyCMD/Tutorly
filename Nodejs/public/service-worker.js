const CACHE_NAME = 'tutorly-cache-v1-' + new Date().toISOString().split('T')[0];
const STATIC_ASSETS = [
    '/css/home.css',
    '/js/homeScript.js',
    '/js/itemDetailsModal.js',
    '/js/modalShared.js',
    '/icons/icon.svg',
    '/offline.html',
    '/manifest.json'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Network-First for API/HTML, Cache-First for static
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Exclude Admin routes from SW
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/adminLogin')) {
        return;
    }

    // Static Assets: Stale-While-Revalidate
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // API & Navigation: Network-First
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Determine if we should cache this response
                // Cache successful GET requests for navigation or API
                if (event.request.method === 'GET' && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If navigation request and no cache, show offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                    return null;
                });
            })
    );
});
