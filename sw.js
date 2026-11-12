// Offline support. Change VERSION whenever you upload a new build so players get the update.
const VERSION = 'studio-hustle-v191';
const SHELL = ['./', './index.html', './manifest.webmanifest', './art/gem.webp', './art/cash.svg', './icons/icon-192.png', './icons/icon-512.png',
  './music/beat1.mp3', './music/beat2.mp3', './music/beat3.mp3',
  './sfx/tap.wav', './sfx/panel.wav', './sfx/backer.wav', './sfx/album.wav'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });   // 'reload': never store a stale copy from the browser cache
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // only the game's own files are saved for offline play. Live data (The Charts, profiles, sign-in, stats)
  // always goes straight to the internet, so leaderboards and friends' outfits are never stale
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  // pages: always ask the server for the newest copy (skipping the browser cache); use the saved copy only when offline
  // the app manifest (name, icons, status-bar colors): always the newest copy, the saved one only when offline
  if (url.pathname.endsWith('/manifest.webmanifest')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // everything else (music, icons, fonts): saved copy first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  })));
});
