/* MedEx service worker — v42
 * Fixes vs v41.62:
 *  - Runtime trimming no longer evicts the app shell (separate caches).
 *  - cdnjs.cloudflare.com (pdf.js / pdf-lib) is now cached for offline reading.
 *  - Manifest + icons are precached; offline navigation falls back to the shell.
 *  - Cache name is a single constant to bump on release.
 */
const VERSION='v42.1';
const SHELL_CACHE='medex-shell-'+VERSION;
const RUNTIME_CACHE='medex-runtime-'+VERSION;
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/medex-192.png','./icons/medex-512.png'];
const MAX_RUNTIME_ENTRIES=80;
const CDN_HOSTS=new Set(['cdn.jsdelivr.net','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com']);

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(SHELL_CACHE);
  await Promise.all(SHELL.map(async path=>{
    try{const res=await fetch(path,{cache:'reload'});if(res.ok&&res.status===200)await cache.put(path,res);}catch(_){}
  }));
  // No skipWaiting here: the page shows an "update available" prompt first.
})()));

self.addEventListener('message',event=>{ if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting(); });

self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keep=new Set([SHELL_CACHE,RUNTIME_CACHE]);
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('medex-')&&!keep.has(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));

async function putRuntime(request,response){
  if(!response||!response.ok||response.status!==200||response.type==='opaque')return;
  try{
    const cache=await caches.open(RUNTIME_CACHE);
    await cache.put(request,response.clone());
    const keys=await cache.keys();
    if(keys.length>MAX_RUNTIME_ENTRIES)await Promise.all(keys.slice(0,keys.length-MAX_RUNTIME_ENTRIES).map(k=>cache.delete(k)));
  }catch(_){}
}
const timeout=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('Network timeout')),ms));

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||req.headers.get('range'))return;
  const url=new URL(req.url);
  // Never cache APIs, Vercel internals, or Supabase (data + auth).
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/')||url.hostname.endsWith('.supabase.co'))return;
  const isOwn=url.origin===self.location.origin;
  if(!isOwn&&!CDN_HOSTS.has(url.hostname))return;

  // Page loads: network first (fresh deploys), fall back to the cached shell when offline/slow.
  if(isOwn&&req.mode==='navigate'){
    event.respondWith((async()=>{
      const shell=await caches.open(SHELL_CACHE);
      try{
        const res=await Promise.race([fetch(req),timeout(4000)]);
        if(res&&res.ok&&res.status===200)event.waitUntil(shell.put('./index.html',res.clone()));
        return res;
      }catch(err){
        const cached=await shell.match('./index.html')||await shell.match('./');
        if(cached)return cached;
        return new Response('<h1>You are offline</h1><p>Open MedEx once while online to enable offline use.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  // Everything else: stale-while-revalidate.
  event.respondWith((async()=>{
    const cached=(await caches.match(req,{ignoreSearch:false}));
    const network=fetch(req).then(res=>{event.waitUntil(putRuntime(req,res));return res;});
    if(cached){event.waitUntil(network.catch(()=>{}));return cached;}
    try{return await network;}catch(_){return Response.error();}
  })());
});


// Web Push display/click handling. Delivery requires a push server and VAPID setup.
self.addEventListener('push',event=>{
 let data={title:'MedEx',body:'You have a new MedEx update.',url:'./'};
 try{if(event.data)data={...data,...event.data.json()};}catch(_){try{if(event.data)data.body=event.data.text();}catch(__){}}
 event.waitUntil(self.registration.showNotification(data.title||'MedEx',{body:data.body||'You have a new MedEx update.',icon:data.icon||'./icons/medex-192.png',badge:data.badge||'./icons/medex-192.png',tag:data.tag||'medex-push',data:{url:data.url||'./'},renotify:false}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const target=new URL(event.notification.data?.url||'./',self.location.origin).href;
 event.waitUntil((async()=>{const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of list){if(new URL(client.url).origin===self.location.origin){await client.focus();if('navigate' in client)await client.navigate(target);return;}}if(self.clients.openWindow)await self.clients.openWindow(target);})());
});
