// Versi cache pakai timestamp — otomatis berubah setiap sw.js di-edit
// Ganti angka ini setiap deploy baru agar browser langsung update
const CACHE_VERSION = '20260510-1';
const CACHE_NAME = 'lokara-' + CACHE_VERSION;

// Aset statis yang di-cache
const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// CDN assets di-cache terpisah (jarang berubah)
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ==================== INSTALL ====================
self.addEventListener('install', function(event) {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache statis — wajib ada
      return Promise.allSettled([
        ...STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] Skip:', url, e))),
        ...CDN_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] Skip CDN:', url, e)))
      ]);
    }).then(function() {
      // Langsung aktif tanpa tunggu tab lama ditutup
      return self.skipWaiting();
    })
  );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(key => key.startsWith('lokara-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(function() {
      // Paksa semua tab pakai SW baru tanpa perlu reload
      return self.clients.claim();
    }).then(function() {
      // Kirim pesan ke semua tab agar reload otomatis
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// ==================== FETCH ====================
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // Selalu network untuk Google APIs (data realtime)
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return; // biarkan browser handle langsung
  }

  // Untuk file lokal (index.html, config.js, dll): Network First
  // → ambil versi terbaru dari server, fallback ke cache kalau offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(function() {
          // Offline fallback
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Untuk CDN (Font Awesome, Leaflet, Fonts): Cache First
  // → pakai cache agar cepat, update di background
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      const networkFetch = fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// ==================== MESSAGE ====================
// Terima perintah SKIP_WAITING dari client
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
