// Service worker without file caching. It clears any caches left by earlier
// versions and passes every request straight to the network. The fetch handler
// is kept so the browser still offers the install prompt.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
