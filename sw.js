const CACHE='medex-v41.59-local-flashcards-log-optimization';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(APP_SHELL.map(async path=>{try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response);}catch(_){}}));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('medex-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(req).then(response => {
      if (response && response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(req,copy)); }
      return response;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
    if (response && response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(req,copy)); }
    return response;
  })));
});
