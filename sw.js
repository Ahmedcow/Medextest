const CACHE='medex-v41.21-cache-recovery';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
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

  // Always try the network first for HTML/navigation so a new deployment
  // cannot remain trapped behind an old cached index.html.
  if(req.mode==='navigate' || req.destination==='document' || url.pathname.endsWith('/index.html')){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match(req).then(cached=>cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for static assets, with network fallback and cache update.
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        return res;
      });
    })
  );
});
