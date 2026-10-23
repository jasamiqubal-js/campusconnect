/* sw.js: service worker. Caches the app shell so the app opens quickly and can show its last screen offline.
   Firebase (Auth, Firestore) and CDN requests are NOT cached here; they go straight to the network. */
const CACHE = 'campusconnect-v2';
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'manifest.json',
  'images/banner.jpg',
  'images/institute.jpg',
  'icons/logo.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

// Network first for our own files: always get the latest version, fall back to the cache when offline
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
