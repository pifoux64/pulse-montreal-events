// Service Worker pour PWA - Force les mises à jour
// Le CACHE_NAME change automatiquement à chaque nouveau déploiement
// (le fichier sw.js change, donc le service worker se met à jour)
const CACHE_NAME = 'pulse-montreal-' + Date.now().toString(36);

// Installation du service worker
self.addEventListener('install', (event) => {
  // Force l'activation immédiate du nouveau service worker
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  // Prend le contrôle de toutes les pages immédiatement
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprime les anciens caches
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prend le contrôle de toutes les pages
      return self.clients.claim();
    })
  );
});

// Stratégie de cache: Network First, puis Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réussit, met à jour le cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si la requête échoue, essaie le cache
        return caches.match(event.request);
      })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

