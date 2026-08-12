const CACHE = 'bento-shell-v0.5.6-inazuma';
const SHELL_PREFIX = 'bento-shell-';
const ASSETS = [
  './','./index.html','./style.css?v=16','./data/recipes-data.js?v=16','./data/photo-index.js?v=16','./data/library_manifest.json','./app.js?v=16','./manifest.json',
  './icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png',
  './icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png',
  './icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(SHELL_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isCore=/\/(?:app\.js|style\.css|data\/(?:recipes-data|photo-index)\.js)$/.test(url.pathname);
  if(event.request.mode==='navigate'||isCore){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request.mode==='navigate'?'./index.html':event.request,copy))}return r}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):caches.match(event.request)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(cached=>{
    const fresh=fetch(event.request).then(r=>{if(r.ok)cache.put(event.request,r.clone());return r}).catch(()=>cached);
    return cached||fresh;
  })));
});
