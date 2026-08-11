const CACHE = 'bento-shell-v0.1.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
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

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
