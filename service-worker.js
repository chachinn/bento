const CACHE = 'bento-shell-v0.5.8-filipino';
const SHELL_PREFIX = 'bento-shell-';
const CORE = [
  './','./index.html','./style.css?v=18','./data/recipes-data.js?v=18','./data/photo-index.js?v=18','./data/library_manifest.json','./app.js?v=18','./manifest.json'
];
const OPTIONAL_ICONS = [
  './icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png',
  './icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png',
  './icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL_ICONS.map(asset=>cache.add(asset)));
  })());
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(SHELL_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
function fetchWithTimeout(request,ms=2500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return fetch(request,{cache:'no-store',signal:controller.signal}).finally(()=>clearTimeout(timer));
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isVersionedCore=/\/(?:app\.js|style\.css|data\/(?:recipes-data|photo-index)\.js)$/.test(url.pathname)&&url.searchParams.has('v');
  if(event.request.mode==='navigate'){
    event.respondWith(fetchWithTimeout(event.request).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',response.clone()));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(isVersionedCore){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(event.request);
      if(cached)return cached;
      const response=await fetch(event.request);
      if(response.ok)cache.put(event.request,response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request);
    const fresh=fetch(event.request).then(response=>{
      if(response.ok)cache.put(event.request,response.clone());
      return response;
    }).catch(()=>cached);
    return cached||fresh;
  }));
});
