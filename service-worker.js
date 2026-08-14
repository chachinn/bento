const CACHE='bento-shell-v1.0.0-v28p1';
const SHELL_PREFIX='bento-shell-';
const ASSET_VERSION='28p1';
const CORE=[
  './index.html',
  './style.css?v=28p1',
  './data/recipes-data.js?v=28p1',
  './data/japanese-extra-150-170.js?v=28p1',
  './data/japanese-extra-171-189.js?v=28p1',
  './data/filipino-extra-165-184.js?v=28p1',
  './data/photo-index.js?v=28p1',
  './data/library_manifest.json',
  './manifest.json',
  './data/korean-runtime.js?v=28p1',
  './data/korean-recipes-00.js?v=28p1',
  './data/korean-recipes-01.js?v=28p1',
  './data/korean-recipes-02.js?v=28p1',
  './data/korean-recipes-03.js?v=28p1',
  './data/korean-recipes-04.js?v=28p1',
  './data/korean-recipes-05.js?v=28p1',
  './data/korean-recipes-06.js?v=28p1',
  './data/korean-recipes-07.js?v=28p1',
  './data/korean-recipes-08.js?v=28p1',
  './data/korean-recipes-09.js?v=28p1',
  './data/anime-runtime.js?v=28p1',
  './data/anime-recipes-00.js?v=28p1',
  './data/anime-recipes-01.js?v=28p1',
  './data/anime-recipes-02.js?v=28p1',
  './data/anime-recipes-03.js?v=28p1',
  './data/anime-recipes-04.js?v=28p1',
  './data/anime-recipes-05.js?v=28p1',
  './data/anime-recipes-06.js?v=28p1',
  './data/anime-recipes-07.js?v=28p1',
  './data/anime-recipes-08.js?v=28p1',
  './data/anime-recipes-09.js?v=28p1',
  './data/chinese-init.js?v=28p1',
  './data/chinese-recipes-001.js?v=28p1',
  './data/chinese-recipes-002.js?v=28p1',
  './data/chinese-recipes-003.js?v=28p1',
  './data/chinese-recipes-004.js?v=28p1',
  './data/chinese-recipes-005.js?v=28p1',
  './data/chinese-recipes-006.js?v=28p1',
  './data/chinese-recipes-007.js?v=28p1',
  './data/chinese-recipes-008.js?v=28p1',
  './data/chinese-recipes-009.js?v=28p1',
  './data/chinese-recipes-010.js?v=28p1',
  './data/chinese-recipes-011.js?v=28p1',
  './data/chinese-recipes-012.js?v=28p1',
  './data/chinese-recipes-013.js?v=28p1',
  './data/chinese-recipes-014.js?v=28p1',
  './data/chinese-recipes-015.js?v=28p1',
  './data/chinese-recipes-016.js?v=28p1',
  './data/chinese-recipes-017.js?v=28p1',
  './data/chinese-recipes-018.js?v=28p1',
  './data/chinese-recipes-019.js?v=28p1',
  './data/chinese-recipes-020.js?v=28p1',
  './data/chinese-recipes-021.js?v=28p1',
  './data/chinese-recipes-022.js?v=28p1',
  './data/chinese-recipes-023.js?v=28p1',
  './data/chinese-recipes-024.js?v=28p1',
  './data/chinese-recipes-025.js?v=28p1',
  './data/chinese-recipes-026.js?v=28p1',
  './data/chinese-recipes-027.js?v=28p1',
  './data/chinese-recipes-028.js?v=28p1',
  './data/chinese-recipes-029.js?v=28p1',
  './data/chinese-recipes-030.js?v=28p1',
  './data/chinese-recipes-031.js?v=28p1',
  './data/chinese-recipes-032.js?v=28p1',
  './data/chinese-recipes-033.js?v=28p1',
  './data/chinese-recipes-034.js?v=28p1',
  './data/chinese-recipes-035.js?v=28p1',
  './data/chinese-recipes-036.js?v=28p1',
  './data/chinese-recipes-037.js?v=28p1',
  './data/chinese-recipes-038.js?v=28p1',
  './data/chinese-recipes-039.js?v=28p1',
  './data/chinese-recipes-040.js?v=28p1',
  './data/thai-recipes-00.js?v=28p1',
  './data/thai-recipes-01.js?v=28p1',
  './data/thai-recipes-02.js?v=28p1',
  './data/thai-recipes-03.js?v=28p1',
  './data/thai-recipes-04.js?v=28p1',
  './data/thai-recipes-05.js?v=28p1',
  './data/thai-recipes-06.js?v=28p1',
  './data/thai-extra-041-050.js?v=28p1',
  './data/thai-extra-051-060.js?v=28p1',
  './data/cuisine-method-depth.js?v=28p1',
  './data/chinese-runtime.js?v=28p1',
  './data/chinese-extra-041-050.js?v=28p1',
  './data/chinese-extra-051-060.js?v=28p1',
  './data/chinese-extra-061-070.js?v=28p1',
  './data/chinese-extra-071-080.js?v=28p1',
  './data/chinese-extra-081-090.js?v=28p1',
  './data/chinese-meta-core.js?v=28p1',
  './data/chinese-meta-extra.js?v=28p1',
  './data/chinese-photo.js?v=28p1',
  './data/thai-runtime.js?v=28p1',
  './data/vietnamese-runtime.js?v=28p1',
  './data/vietnamese-recipes-001-010.js?v=28p1',
  './data/vietnamese-recipes-011-020.js?v=28p1',
  './data/vietnamese-recipes-021-030.js?v=28p1',
  './data/vietnamese-recipes-031-040.js?v=28p1',
  './data/vietnamese-recipes-041-050.js?v=28p1',
  './data/vietnamese-recipes-051-060.js?v=28p1',
  './data/vietnamese-recipes-061-070.js?v=28p1',
  './data/vietnamese-recipes-071-080.js?v=28p1',
  './data/vietnamese-recipes-081-090.js?v=28p1',
  './data/vietnamese-recipes-091-100.js?v=28p1',
  './data/vietnamese-recipes-101-110.js?v=28p1',
  './data/vietnamese-recipes-111-120.js?v=28p1',
  './data/vietnamese-recipes-121-130.js?v=28p1',
  './data/thai-extra-061-070.js?v=28p1',
  './data/thai-extra-071-080.js?v=28p1',
  './data/thai-extra-081-090.js?v=28p1',
  './data/indian-runtime.js?v=28p1',
  './data/indian-recipes-001-010.js?v=28p1',
  './data/indian-recipes-011-020.js?v=28p1',
  './data/indian-recipes-021-030.js?v=28p1',
  './data/indian-recipes-031-040.js?v=28p1',
  './data/indian-recipes-041-050.js?v=28p1',
  './data/indian-recipes-051-060.js?v=28p1',
  './data/indian-recipes-061-070.js?v=28p1',
  './data/indian-recipes-071-080.js?v=28p1',
  './data/indian-recipes-081-090.js?v=28p1',
  './data/indian-recipes-091-100.js?v=28p1',
  './data/indian-recipes-101-110.js?v=28p1',
  './data/indian-recipes-111-120.js?v=28p1',
  './data/indian-recipes-121-130.js?v=28p1',
  './data/indian-recipes-131-140.js?v=28p1',
  './data/indian-recipes-141-150.js?v=28p1',
  './data/indian-recipes-151-160.js?v=28p1',
  './data/indian-recipes-161-171.js?v=28p1',
  './data/recipe-quality-runtime.js?v=28p1',
  './data/recipe-content-fixes-standard.js?v=28p1',
  './data/recipe-content-fixes-genshin.js?v=28p1',
  './data/recipe-content-fixes-anime.js?v=28p1',
  './data/recipe-content-fixes-final.js?v=28p1',
  './data/recipe-semantic-alias-fixes.js?v=28p1',
  './data/recipe-content-fixes-genshin-identity.js?v=28p1',
  './data/recipe-content-fixes-genshin-unindexed.js?v=28p1',
  './app.js?v=28p1'
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
async function cacheInBatches(cache,assets,size=8){
  for(let i=0;i<assets.length;i+=size){
    await Promise.all(assets.slice(i,i+size).map(asset=>cacheFresh(cache,asset)));
    await new Promise(resolve=>setTimeout(resolve,0));
  }
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cacheInBatches(cache,CORE,8);
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