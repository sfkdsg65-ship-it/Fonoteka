const V = 'fonoteka-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const EXTRA_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Сначала отдаём сохранённое (быстро и без сети), в фоне обновляем копию.
function swr(request, key) {
  return caches.open(V).then(cache =>
    cache.match(key || request).then(hit => {
      const net = fetch(request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(key || request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  ).then(r => r || Response.error());
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate' && u.origin === location.origin) {
    e.respondWith(swr(r, './index.html'));
  } else if (u.origin === location.origin || EXTRA_HOSTS.includes(u.hostname)) {
    e.respondWith(swr(r));
  }
});
