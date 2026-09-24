const C = 'gasoil-v4';
const conTimeout = (p, ms) => new Promise((res, rej) => {
  const t = setTimeout(() => rej('timeout'), ms);
  p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); });
});
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const esApp = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (esApp) {
    // la app: si hay señal trae la última versión; con señal débil o sin señal, usa la guardada
    const red = fetch(e.request.url, { cache: 'no-store' }).then(res => {
      if (res.ok) { const cl = res.clone(); caches.open(C).then(c => c.put('./index.html', cl)); }
      return res;
    });
    e.respondWith(conTimeout(red, 4000).catch(() => caches.match('./index.html').then(r => r || red)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const cl = res.clone();
      caches.open(C).then(c => c.put(e.request, cl));
      return res;
    }))
  );
});
