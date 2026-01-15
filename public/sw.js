const CACHE_NAME = 'connect-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.jpg',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests for same-origin or non-API calls
    if (event.request.method !== 'GET' || event.request.url.includes('.supabase.co') || event.request.url.includes('/rest/v1/')) {
        return;
    }

    // Only handle document/asset requests
    const isNavigation = event.request.mode === 'navigate';
    const isAsset = event.request.destination === 'image' ||
        event.request.destination === 'script' ||
        event.request.destination === 'style' ||
        event.request.destination === 'font';

    if (!isNavigation && !isAsset) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
