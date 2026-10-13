const CACHE='medex-v41.62-flashcards-supabase-layout';
const APP_SHELL=['./','./index.html'];
const MAX_RUNTIME_ENTRIES=80;
const CDN_HOSTS=new Set(['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com']);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(APP_SHELL.map(async path=>{try{const response=await fetch(path,{cache:'reload'});if(response.ok&&response.status===200)await cache.put(path,response);}catch(_){}}));
  // Intentionally do not call skipWaiting here. The page shows an update prompt first.
})()));
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('medex-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
async function cacheSuccessful(cache,request,response){
  if(!response||!response.ok||response.status!==200||response.type==='opaque')return;
  try{await cache.put(request,response.clone());await trimRuntimeCache(cache);}catch(_){}
}
async function trimRuntimeCache(cache){
  const keys=await cache.keys();
  if(keys.length<=MAX_RUNTIME_ENTRIES)return;
  await Promise.all(keys.slice(0,keys.length-MAX_RUNTIME_ENTRIES).map(key=>cache.delete(key)));
}
function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('Network timeout')),ms));}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  // Never cache API calls, Vercel internals, Supabase data/auth, or partial content.
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/')||url.hostname.endsWith('.supabase.co')||request.headers.get('range'))return;
  const isOwn=url.origin===self.location.origin;
  const isCdn=CDN_HOSTS.has(url.hostname);
  if(!isOwn&&!isCdn)return;
  const isNavigation=isOwn&&(request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname==='/'||url.pathname.endsWith('/'));
  if(isNavigation){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await Promise.race([fetch(request,{cache:'no-store'}),timeout(4000)]);
        if(response&&response.ok&&response.status===200)event.waitUntil(cacheSuccessful(cache,request,response));
        return response;
      }catch(error){const cached=await cache.match(request)||await cache.match('./index.html')||await cache.match('./');if(cached)return cached;throw error;}
    })());
    return;
  }
  // Stale-while-revalidate for app assets and the explicitly allowed CDN dependencies.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    const network=fetch(request).then(response=>{if(response&&response.ok&&response.status===200)event.waitUntil(cacheSuccessful(cache,request,response));return response;});
    if(cached){event.waitUntil(network.catch(()=>{}));return cached;}
    try{return await network;}catch(error){return cached||Response.error();}
  })());
});
