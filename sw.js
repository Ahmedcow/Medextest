/* MedEx service worker — v41.61
   Strategy:
   - App shell is precached (tolerant: one missing file never blocks install).
   - Navigations: network-first with a short timeout, falling back to the cached shell (fast + works offline).
   - Same-origin static files: stale-while-revalidate (instant, refreshed in the background).
   - Supabase JS + Google Fonts (cross-origin): stale-while-revalidate so the app can boot offline.
   - Never cached: /api/*, /_vercel/*, non-GET, partial (206) or error responses.
*/
const VERSION = 'v41.61';
const CACHE = 'medex-' + VERSION + '-shell';
const RUNTIME = 'medex-' + VERSION + '-runtime';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icons/medex-192.png', './icons/medex-512.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const NAV_TIMEOUT_MS = 4000;
const RUNTIME_MAX_ENTRIES = 80;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const res = await fetch(path, { cache: 'reload' });
        if (res.ok) await cache.put(path, res);
      } catch (_) { /* offline during install: shell fills in on first visit */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE, RUNTIME]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('medex-') && !keep.has(k)).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const cacheable = res => res && (res.ok || res.type === 'opaque') && res.status !== 206;

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const network = fetch(event.request).then(res => {
    if (cacheable(res)) { cache.put(event.request, res.clone()).then(() => trimCache(cacheName, RUNTIME_MAX_ENTRIES)).catch(() => {}); }
    return res;
  }).catch(() => null);
  if (cached) { event.waitUntil(network); return cached; }
  const res = await network;
  return res || new Response('', { status: 504, statusText: 'Offline' });
}

async function networkFirstNavigation(event) {
  const cache = await caches.open(CACHE);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NAV_TIMEOUT_MS));
    const res = preload || await Promise.race([fetch(event.request), timeout]);
    if (res && res.ok) { cache.put('./index.html', res.clone()).catch(() => {}); }
    return res;
  } catch (_) {
    return (await cache.match('./index.html')) || (await cache.match('./')) || new Response('<h1>MedEx is offline</h1><p>Reconnect and reload.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return; // always live
    if (req.mode === 'navigate') { event.respondWith(networkFirstNavigation(event)); return; }
    if (req.headers.has('range')) return;                                                  // let media/PDF range requests pass
    event.respondWith(staleWhileRevalidate(event, CACHE));
    return;
  }
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event, RUNTIME));
  }
  // Supabase REST/auth/storage calls are intentionally not intercepted.
});
