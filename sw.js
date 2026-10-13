const CACHE='medex-v41.58-admin-only-materials';
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
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const isHtml=request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname==='/'||url.pathname.endsWith('/');
  if(isHtml){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}
        return response;
      }catch(error){const cached=await caches.match(request)||await caches.match('./index.html')||await caches.match('./');if(cached)return cached;throw error;}
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);const cached=await cache.match(request);
    if(cached)return cached;
    try{const response=await fetch(request);if(response&&response.ok)await cache.put(request,response.clone());return response;}catch(error){return cached||Response.error();}
  })());
});
