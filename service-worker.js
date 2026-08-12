const CACHE = 'bento-shell-v0.5.9-korean';
const SHELL_PREFIX = 'bento-shell-';
const CORE = [
  './style.css?v=19','./data/recipes-data.js?v=19','./data/photo-index.js?v=19','./data/library_manifest.json','./app.js?v=19','./manifest.json',
  './data/korean-runtime.js?v=19','./data/korean-recipes-00.js?v=19','./data/korean-recipes-01.js?v=19','./data/korean-recipes-02.js?v=19','./data/korean-recipes-03.js?v=19','./data/korean-recipes-04.js?v=19','./data/korean-recipes-05.js?v=19','./data/korean-recipes-06.js?v=19','./data/korean-recipes-07.js?v=19','./data/korean-recipes-08.js?v=19','./data/korean-recipes-09.js?v=19','./v19-ui.js?v=19','./v19-cuisine.css?v=19'
];
const OPTIONAL_ICONS = [
  './icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png',
  './icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png',
  './icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png'
];
const KOREAN_SCRIPTS = '<script src="data/korean-runtime.js?v=19" defer></script><script src="data/korean-recipes-00.js?v=19" defer></script><script src="data/korean-recipes-01.js?v=19" defer></script><script src="data/korean-recipes-02.js?v=19" defer></script><script src="data/korean-recipes-03.js?v=19" defer></script><script src="data/korean-recipes-04.js?v=19" defer></script><script src="data/korean-recipes-05.js?v=19" defer></script><script src="data/korean-recipes-06.js?v=19" defer></script><script src="data/korean-recipes-07.js?v=19" defer></script><script src="data/korean-recipes-08.js?v=19" defer></script><script src="data/korean-recipes-09.js?v=19" defer></script>';
function upgradeHtml(html){
  let out=String(html||'')
    .replace(/style\.css\?v=\d+/g,'style.css?v=19')
    .replace(/data\/recipes-data\.js\?v=\d+/g,'data/recipes-data.js?v=19')
    .replace(/data\/photo-index\.js\?v=\d+/g,'data/photo-index.js?v=19')
    .replace(/app\.js\?v=\d+/g,'app.js?v=19');
  if(!out.includes('v19-cuisine.css'))out=out.replace('</head>','  <link rel="stylesheet" href="v19-cuisine.css?v=19" />\n</head>');
  if(!out.includes('data/korean-runtime.js?v=19'))out=out.replace('<script src="app.js?v=19" defer></script>',`${KOREAN_SCRIPTS}<script src="app.js?v=19" defer></script><script src="v19-ui.js?v=19" defer></script>`);
  else if(!out.includes('v19-ui.js?v=19'))out=out.replace('</body>','  <script src="v19-ui.js?v=19" defer></script>\n</body>');
  return out;
}
function upgradeApp(js){return String(js||'').replace(/const VERSION = \d+;/,'const VERSION = 19;')}
function htmlResponse(html,response){const headers=new Headers(response?.headers||{});headers.set('content-type','text/html; charset=utf-8');headers.delete('content-length');return new Response(html,{status:response?.status||200,statusText:response?.statusText||'OK',headers})}
function jsResponse(js,response){const headers=new Headers(response?.headers||{});headers.set('content-type','application/javascript; charset=utf-8');headers.delete('content-length');return new Response(js,{status:response?.status||200,statusText:response?.statusText||'OK',headers})}
async function cacheUpgradedApp(cache){try{const response=await fetch('./app.js?v=19',{cache:'no-store'});if(!response.ok)return;await cache.put('./app.js?v=19',jsResponse(upgradeApp(await response.text()),response))}catch{}}
async function cacheUpgradedIndex(cache){try{const response=await fetch('./index.html',{cache:'no-store'});if(!response.ok)return;const upgraded=htmlResponse(upgradeHtml(await response.text()),response);await cache.put('./index.html',upgraded)}catch{}}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await cacheUpgradedApp(cache);await cacheUpgradedIndex(cache);await Promise.allSettled(OPTIONAL_ICONS.map(asset=>cache.add(asset)))})());self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(SHELL_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
function fetchWithTimeout(request,ms=2500){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);return fetch(request,{cache:'no-store',signal:controller.signal}).finally(()=>clearTimeout(timer))}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  const v19=url.searchParams.get('v')==='19';
  const isVersionedCore=v19&&(/\/(?:app\.js|style\.css|v19-ui\.js|v19-cuisine\.css)$/.test(url.pathname)||/\/data\/(?:recipes-data|photo-index|korean-runtime|korean-recipes-\d{2})\.js$/.test(url.pathname));
  if(event.request.mode==='navigate'){event.respondWith(fetchWithTimeout(event.request).then(async response=>{if(!response.ok)return response;const upgraded=htmlResponse(upgradeHtml(await response.text()),response);caches.open(CACHE).then(cache=>cache.put('./index.html',upgraded.clone()));return upgraded}).catch(()=>caches.match('./index.html')));return}
  if(isVersionedCore){event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}));return}
  event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{if(response.ok)cache.put(event.request,response.clone());return response}).catch(()=>cached);return cached||fresh}));
});
