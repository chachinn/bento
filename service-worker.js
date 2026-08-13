const CACHE='bento-shell-v0.8.0-v22';
const SHELL_PREFIX='bento-shell-';
const ASSET_VERSION='22';
const CORE=[
  './index.html',
  './style.css?v=22',
  './data/recipes-data.js?v=22',
  './data/photo-index.js?v=22',
  './data/library_manifest.json',
  './manifest.json',
  './data/korean-runtime.js?v=22',
  './data/korean-recipes-00.js?v=22',
  './data/korean-recipes-01.js?v=22',
  './data/korean-recipes-02.js?v=22',
  './data/korean-recipes-03.js?v=22',
  './data/korean-recipes-04.js?v=22',
  './data/korean-recipes-05.js?v=22',
  './data/korean-recipes-06.js?v=22',
  './data/korean-recipes-07.js?v=22',
  './data/korean-recipes-08.js?v=22',
  './data/korean-recipes-09.js?v=22',
  './data/anime-runtime.js?v=22',
  './data/anime-recipes-00.js?v=22',
  './data/anime-recipes-01.js?v=22',
  './data/anime-recipes-02.js?v=22',
  './data/anime-recipes-03.js?v=22',
  './data/anime-recipes-04.js?v=22',
  './data/anime-recipes-05.js?v=22',
  './data/anime-recipes-06.js?v=22',
  './data/anime-recipes-07.js?v=22',
  './data/anime-recipes-08.js?v=22',
  './data/anime-recipes-09.js?v=22',
  './app.js?v=22'
];
const OPTIONAL_ICONS=[
  './icon/apple-touch-icon.png',
  './icon/icon-72.png',
  './icon/icon-96.png',
  './icon/icon-128.png',
  './icon/icon-144.png',
  './icon/icon-152.png',
  './icon/icon-180.png',
  './icon/icon-192.png',
  './icon/icon-384.png',
  './icon/icon-512.png',
  './icon/icon-maskable-192.png',
  './icon/icon-maskable-512.png'
];

async function cacheFresh(cache,asset){
  const response=await fetch(asset,{cache:'no-store'});
  if(!response.ok)throw new Error(`Failed to cache ${asset}`);
  await cache.put(asset,response);
}
async function cacheInBatches(cache,assets,size=4){
  for(let i=0;i<assets.length;i+=size){
    await Promise.all(assets.slice(i,i+size).map(asset=>cacheFresh(cache,asset)));
    await new Promise(resolve=>setTimeout(resolve,0));
  }
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cacheInBatches(cache,CORE,4);
    await Promise.allSettled(OPTIONAL_ICONS.map(asset=>cacheFresh(cache,asset)));
  })());
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(SHELL_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
function fetchWithTimeout(request,ms=4000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return fetch(request,{cache:'no-store',signal:controller.signal}).finally(()=>clearTimeout(timer));
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetchWithTimeout(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',response.clone()));return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  const versioned=url.searchParams.get('v')===ASSET_VERSION;
  if(versioned){
    event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);if(hit)return hit;const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{if(response.ok)cache.put(event.request,response.clone());return response}).catch(()=>hit);return hit||fresh}));
});
