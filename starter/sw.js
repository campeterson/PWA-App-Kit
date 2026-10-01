// Bump this version string whenever you change any cached file.
// The old service worker won't re-fetch unless the name changes.
const CACHE_NAME = 'my-app-v1';

const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  // Add any other files your app needs here (data.json, fonts, etc.)
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Clone synchronously, before the response is handed to the page. Cloning inside
// the caches.open() callback fails once the page has started reading the body.
function cacheCopy(request, res) {
  const copy = res.clone();
  caches.open(CACHE_NAME).then(c => c.put(request, copy)).catch(() => {});
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // External resources (fonts, etc.): cache-first with network fallback
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetched = fetch(e.request).then(res => {
          cacheCopy(e.request, res);
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // Same-origin assets: cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
