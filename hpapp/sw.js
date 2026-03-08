// ═══════════════════════════════════════════════════════════════
//  sw.js  —  Hogwarts PWA Service Worker
//
//  Strategy: Cache-first (serve instantly from cache), then
//  silently fetch a fresh version in the background. When a new
//  version is found the app shows a toast; tapping it activates
//  the new worker and reloads.
//
//  Bump CACHE_NAME whenever you deploy a new version.
//  The old cache is deleted automatically on activation.
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'hogwarts-v1';

// Everything the app needs to work offline
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Google Fonts — cached on first visit, served offline after that
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600&display=swap',
];

// ── Install: pre-cache all shell assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Use {cache: 'reload'} so we always get a fresh copy on install,
      // not a stale HTTP-cached one
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {
            // Don't fail the whole install if a font CDN is unreachable
            console.warn('SW: could not pre-cache', url);
          })
        )
      )
    )
  );
  // Do NOT call self.skipWaiting() here — we want the user to
  // consciously choose when to activate the new version (via the toast).
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: stale-while-revalidate ──
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      // Kick off a background network fetch regardless
      const networkFetch = fetch(event.request)
        .then(response => {
          // Cache valid responses (not opaque errors)
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null); // silently swallow network errors

      // Return cached version immediately if we have one,
      // otherwise wait for the network
      return cached || networkFetch;
    })
  );
});

// ── Message: allow the page to trigger activation ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
