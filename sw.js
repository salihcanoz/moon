// Service worker: makes the page installable and usable offline.
// Bump CACHE when the list of files changes, so old caches are cleared.
const CACHE = 'moon-v1';

// The page's own files (relative to this file's folder)
const APP_FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'translations.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'favicon.ico', 'icons/favicon-32.png'
];
// Libraries and map data from the CDN. Their URLs contain a version, so they never change.
const CDN_FILES = [
  'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
  'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // each file on its own, so one failed download does not block the install
      .then(cache => Promise.all([...APP_FILES, ...CDN_FILES].map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Own files: fresh copy when online (so edits show up at once), saved copy when offline.
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
    );
  } else if (CDN_FILES.includes(req.url)) {
    // Versioned CDN files: saved copy first, download only if we do not have it yet.
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
