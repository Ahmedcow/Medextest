const CACHE='medex-v41.23-stable';
const SHELL=['./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
 if(req.mode==='navigate'||req.destination==='document'||req.destination==='script'||req.destination==='style'||/\\.(?:html|js|css)$/.test(u.pathname)||u.pathname.endsWith('/sw.js')){
   event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone())).catch(()=>{});return res;})));
});
