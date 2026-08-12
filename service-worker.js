const CACHE = 'bento-shell-v0.4.8-detailed-recipes';
const ASSETS = [
  './','./index.html','./style.css','./data/recipes-data.js','./data/photo-index.js','./data/library_manifest.json','./app.js','./manifest.json',
  './icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png',
  './icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png',
  './icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    const fresh=fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy))}return r}).catch(()=>cached);
    return cached||fresh;
  }));
});
