const CACHE='medex-v41.57-flashcards-cache-refresh';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.all(APP_SHELL.map(async url=>{try{const r=await fetch(url,{cache:'reload'});if(r.ok)await c.put(url,r);}catch(_){}});await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('medex-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==location.origin)return;
 // Always revalidate navigations and the HTML shell online, so a deployed release is not hidden by an old cache.
 const isHTML=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname==='/'||url.pathname.endsWith('/');
 if(isHTML){event.respondWith((async()=>{try{const response=await fetch(req,{cache:'no-store'});if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone());}return response;}catch(e){const cached=await caches.match(req)||await caches.match('./index.html')||await caches.match('./');if(cached)return cached;throw e;}})());return;}
 event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const response=await fetch(req);if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone());}return response;}catch(e){return cached||Response.error();}})());
});
