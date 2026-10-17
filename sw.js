// Service worker "tự gỡ": dự án đã bỏ chế độ offline.
// Máy nào từng cài bản cũ (khtn-lab-v1) sẽ tải file này, xóa hết cache rồi tự gỡ đăng kí,
// để các lần mở sau luôn lấy bản mới từ mạng. Giữ file này một thời gian rồi mới xóa.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
  })());
});
