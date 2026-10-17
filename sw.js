// Service worker: lưu sẵn các file để mô phỏng chạy được khi mất mạng.
// Mỗi lần sửa code hoặc thêm bài, TĂNG số phiên bản CACHE để máy học sinh tải bản mới.
const CACHE = 'khtn-lab-v1';
const SHELL = [
  '/',
  '/index.html',
  '/thau-kinh/',
  '/thau-kinh/index.html',
  '/assets/css/lab.css',
  '/assets/js/engine.js',
  '/assets/js/lessons.js',
  '/assets/js/lessons/thau-kinh.js',
  '/assets/icon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return; // trợ lý AI luôn cần mạng

  // Trang HTML: ưu tiên mạng để luôn có bản mới, mất mạng thì lấy bản đã lưu
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match(url.pathname.endsWith('/') ? url.pathname + 'index.html' : '/index.html')))
    );
    return;
  }

  // File tĩnh và phông chữ: dùng bản đã lưu ngay, đồng thời cập nhật ngầm
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
