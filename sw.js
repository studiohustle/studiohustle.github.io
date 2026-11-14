// Offline support. Change VERSION whenever you upload a new build so players get the update.
const VERSION = 'studio-hustle-v217';
const SHELL = ['./', './index.html', './manifest.webmanifest', './art/gem.webp', './art/cash.svg', './icons/icon-192.png', './icons/icon-512.png',
  './music/beat1.mp3', './music/beat2.mp3', './music/beat3.mp3',
  './sfx/tap.wav', './sfx/panel.wav', './sfx/backer.wav', './sfx/album.wav'];
// every art, sound and music file the game uses, filled in by the build, so the whole game works offline
// (a plane, no signal) even for maps or events that weren't opened since the last update
const ASSETS = ["./art/cars/car0.webp", "./art/cars/car1.webp", "./art/cars/car2.webp", "./art/cars/car3.webp", "./art/cars/car4.webp", "./art/cars/car5.webp", "./art/cars/car6.webp", "./art/cars/car7.webp", "./art/cars/car8.webp", "./art/cars/car9.webp", "./art/cash.svg", "./art/evcoin-galaxy-lilac.svg", "./art/evcoin-island-aqua.svg", "./art/evcoin-western-tan.svg", "./art/gem.webp", "./art/gems/gems-1.webp", "./art/gems/gems-2.webp", "./art/gems/gems-3.webp", "./art/gems/gems-4.webp", "./art/gems/gems-5.webp", "./art/gems/gems-6.webp", "./art/maya-celebrating.webp", "./art/maya-explaining.webp", "./art/maya-thinking.webp", "./art/props/beanbag-coral.png", "./art/props/couch-blue.png", "./art/props/m3-beanbag-cyan.png", "./art/props/m3-beanbag-pink.png", "./art/props/m3-plant.png", "./art/props/m3-runner.png", "./art/props/m3-table.png", "./art/props/m4-couch.png", "./art/props/m4-guitar.png", "./art/props/m4-plant.png", "./art/props/m4-runner.png", "./art/props/m5-palm.png", "./art/props/m5-runner.png", "./art/props/m5-sofa.png", "./art/props/m6-couch.png", "./art/props/m6-runner.png", "./art/props/m6-speakers.png", "./art/props/plant-lavender.png", "./art/props/plant-white.png", "./art/props/record-crate-walnut.png", "./art/props/runner-purple.png", "./art/props/runner-teal.png", "./art/shop/boost-15.svg", "./art/shop/boost-60.svg", "./art/shop/frenzy-1.svg", "./art/shop/frenzy-2.svg", "./art/shop/frenzy-3.svg", "./art/shop/monitors.svg", "./art/shop/moon.svg", "./art/shop/skips-1.svg", "./art/shop/skips-2.svg", "./art/shop/skips-3.svg", "./art/splash-logo.webp", "./music/beat1.mp3", "./music/beat2.mp3", "./music/beat3.mp3", "./music/beat4.mp3", "./music/beat5.mp3", "./music/beat6.mp3", "./sfx/album.wav", "./sfx/backer.wav", "./sfx/panel.wav", "./sfx/tap.wav"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all([
  c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))),   // 'reload': never store a stale copy from the browser cache
  // 'no-cache': checks with the server, which answers "unchanged" without re-downloading files the phone already has
  ...ASSETS.map(u => fetch(new Request(u, { cache: 'no-cache' })).then(r => r.ok ? c.put(u, r) : null).catch(() => null))
]))); self.skipWaiting(); });
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
