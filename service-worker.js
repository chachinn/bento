const CACHE='bento-shell-v0.6.0-anime-repair1';
const SHELL_PREFIX='bento-shell-';
const CORE=[
  './style.css?v=20','./data/recipes-data.js?v=20','./data/photo-index.js?v=20','./data/library_manifest.json','./manifest.json',
  './data/korean-runtime.js?v=20','./data/korean-recipes-00.js?v=20','./data/korean-recipes-01.js?v=20','./data/korean-recipes-02.js?v=20','./data/korean-recipes-03.js?v=20','./data/korean-recipes-04.js?v=20','./data/korean-recipes-05.js?v=20','./data/korean-recipes-06.js?v=20','./data/korean-recipes-07.js?v=20','./data/korean-recipes-08.js?v=20','./data/korean-recipes-09.js?v=20',
  './data/anime-runtime.js?v=20','./data/anime-recipes-00.js?v=20','./data/anime-recipes-01.js?v=20','./data/anime-recipes-02.js?v=20','./data/anime-recipes-03.js?v=20','./data/anime-recipes-04.js?v=20','./data/anime-recipes-05.js?v=20','./data/anime-recipes-06.js?v=20','./data/anime-recipes-07.js?v=20','./data/anime-recipes-08.js?v=20','./data/anime-recipes-09.js?v=20',
  './v20-ui.js?v=20','./v20-ui.css?v=20','./app.js?v=20','./index.html'
];
const OPTIONAL_ICONS=['./icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png','./icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png','./icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png'];
const KOREAN='<script src="data/korean-runtime.js?v=20" defer></script>'+Array.from({length:10},(_,i)=>`<script src="data/korean-recipes-${String(i).padStart(2,'0')}.js?v=20" defer></script>`).join('');
const ANIME='<script src="data/anime-runtime.js?v=20" defer></script>'+Array.from({length:10},(_,i)=>`<script src="data/anime-recipes-${String(i).padStart(2,'0')}.js?v=20" defer></script>`).join('');
function upgradeHtml(html){
  let out=String(html||'')
    .replace(/<link[^>]+href=["']v19-cuisine\.css[^>]*>\s*/gi,'')
    .replace(/<link[^>]+href=["']v20-ui\.css[^>]*>\s*/gi,'')
    .replace(/<script[^>]+src=["']v19-ui\.js[^>]*><\/script>\s*/gi,'')
    .replace(/<script[^>]+src=["']v20-ui\.js[^>]*><\/script>\s*/gi,'')
    .replace(/<script[^>]+src=["']data\/korean-(?:runtime|recipes-\d{2})\.js[^>]*><\/script>\s*/gi,'')
    .replace(/<script[^>]+src=["']data\/anime-(?:runtime|library|recipes-\d{2})\.js[^>]*><\/script>\s*/gi,'')
    .replace(/style\.css\?v=\d+/g,'style.css?v=20')
    .replace(/data\/recipes-data\.js\?v=\d+/g,'data/recipes-data.js?v=20')
    .replace(/data\/photo-index\.js\?v=\d+/g,'data/photo-index.js?v=20')
    .replace(/app\.js\?v=\d+/g,'app.js?v=20');
  out=out.replace('</head>','  <link rel="stylesheet" href="v20-ui.css?v=20" />\n</head>');
  out=out.replace('<script src="app.js?v=20" defer></script>',`${KOREAN}${ANIME}<script src="app.js?v=20" defer></script><script src="v20-ui.js?v=20" defer></script>`);
  return out;
}
function upgradeApp(js){return String(js||'').replace(/const VERSION = \d+;/,'const VERSION = 20;')}
function responseWith(body,response,type){const h=new Headers(response?.headers||{});h.set('content-type',type);h.delete('content-length');return new Response(body,{status:response?.status||200,statusText:response?.statusText||'OK',headers:h})}
async function cacheUpgradedApp(cache){const r=await fetch('./app.js?v=20',{cache:'no-store'});if(!r.ok)throw new Error('app fetch failed');await cache.put('./app.js?v=20',responseWith(upgradeApp(await r.text()),r,'application/javascript; charset=utf-8'))}
async function cacheUpgradedIndex(cache){const r=await fetch('./index.html',{cache:'no-store'});if(!r.ok)throw new Error('index fetch failed');await cache.put('./index.html',responseWith(upgradeHtml(await r.text()),r,'text/html; charset=utf-8'))}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(CACHE);const assets=CORE.filter(x=>x!=='./app.js?v=20'&&x!=='./index.html');await Promise.all(assets.map(async x=>{const r=await fetch(x,{cache:'no-store'});if(!r.ok)throw new Error(`core fetch failed: ${x}`);await c.put(x,r.clone())}));await cacheUpgradedApp(c);await cacheUpgradedIndex(c);await Promise.allSettled(OPTIONAL_ICONS.map(async x=>{const r=await fetch(x,{cache:'no-store'});if(r.ok)await c.put(x,r.clone())}))})());self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(SHELL_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});await Promise.allSettled(windows.map(async client=>{try{const u=new URL(client.url);if(u.origin===self.location.origin)await client.navigate(client.url)}catch{}}))})())});
function fetchWithTimeout(request,ms=3500){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);return fetch(request,{cache:'no-store',signal:controller.signal}).finally(()=>clearTimeout(timer))}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){event.respondWith(fetchWithTimeout(event.request).then(async r=>{if(!r.ok)return r;const upgraded=responseWith(upgradeHtml(await r.text()),r,'text/html; charset=utf-8');caches.open(CACHE).then(c=>c.put('./index.html',upgraded.clone()));return upgraded}).catch(()=>caches.match('./index.html')));return}
  const v20=url.searchParams.get('v')==='20';
  const core=v20&&(/\/(?:app\.js|style\.css|v20-ui\.js|v20-ui\.css)$/.test(url.pathname)||/\/data\/(?:recipes-data|photo-index|korean-runtime|korean-recipes-\d{2}|anime-runtime|anime-recipes-\d{2})\.js$/.test(url.pathname));
  if(core){event.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(event.request);if(hit)return hit;const r=await fetch(event.request);if(r.ok)c.put(event.request,r.clone());return r}));return}
  event.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(event.request);const fresh=fetch(event.request).then(r=>{if(r.ok)c.put(event.request,r.clone());return r}).catch(()=>hit);return hit||fresh}));
});