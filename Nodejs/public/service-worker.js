// Bump this string (not a computed date - see below) whenever you need to force
// every installed client to drop its old cache and re-fetch everything fresh.
//
// A previous version computed this from `new Date()` intending it to rotate
// daily, but that never actually worked: the browser only re-installs a
// service worker when the WORKER SCRIPT'S BYTES change, and this file's bytes
// were identical every day (only the runtime-computed value differed) - so
// the "daily" cache name was really fixed at whatever day the worker first
// installed, and, combined with the stale-while-revalidate strategy below,
// static assets could stay stale indefinitely on an already-visited device.
const CACHE_NAME = 'tutorly-cache-v2';
const STATIC_ASSETS = [
    '/css/home.css',
    '/js/homeScript.js',
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

// Fetch Event: Network-First for everything (API/HTML/static), falling back
// to cache only when offline. Static assets used to be served cache-first via
// stale-while-revalidate, which could show months-old JS/CSS to a returning
// visitor until a second reload happened to revalidate it - not acceptable
// for an app under active development. Network-first still updates the
// cache on every successful fetch, so offline support is unaffected.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Exclude Admin routes from SW
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/adminLogin')) {
        return;
    }

    // Static Assets: Network-First, cache updated on every successful fetch
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return networkResponse;
                })
                .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(event.request)))
        );
        return;
    }

    // API & Navigation: Network-First
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Determine if we should cache this response
                // Cache successful GET requests for navigation or API, filtering out non-HTTP schemes (like chrome-extension://)
                if (event.request.method === 'GET' && response.status === 200 && event.request.url.startsWith('http')) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch((error) => {
                console.error("Fetch failed; returning offline page instead. Error:", error);
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If navigation request and no cache, show offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html').then((offlineResponse) => {
                            // Ensure we never return null/undefined for navigation requests 
                            // to prevent PWA breakout on self-signed certs
                            return offlineResponse || new Response(
                                '<html><body><h1>Offline</h1><p>Check your connection and try again.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                    }
                    return null;
                });
            })
    );
});
