const CACHE='medex-v41.22-fresh-cache';
const APP_SHELL=['./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;

  // Never let the service worker pin HTML, JS, CSS, or the service worker itself.
  // These files must always be refreshed after a deployment.
  if(req.mode==='navigate' || req.destination==='document' ||
     req.destination==='script' || req.destination==='style' ||
     url.pathname.endsWith('.html') || url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') || url.pathname.includes('sw-')){
    event.respondWith(fetch(req).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); }
        return res;
      });
    })
  );
});
