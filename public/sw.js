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
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes chrome-extension:// (extensions Chrome)
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si on reçoit une erreur 404 DEPLOYMENT_NOT_FOUND, vider le cache et recharger
        if (response.status === 404) {
          return response.text().then((text) => {
            if (text.includes('DEPLOYMENT_NOT_FOUND') || text.includes('NOT_FOUND')) {
              // Vider tous les caches et forcer un rechargement
              caches.keys().then((cacheNames) => {
                return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
              }).then(() => {
                // Envoyer un message aux clients pour recharger
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({ type: 'FORCE_RELOAD', reason: 'DEPLOYMENT_NOT_FOUND' });
                  });
                });
              });
              // Retourner une réponse d'erreur pour déclencher le rechargement
              return new Response('Deployment not found. Please reload.', { status: 404 });
            }
            return response;
          });
        }

        // Si la requête réussit, met à jour le cache
        // Ignorer les requêtes chrome-extension:// (extensions Chrome)
        if (response.status === 200 && !event.request.url.startsWith('chrome-extension://')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignorer les erreurs de cache (ex: chrome-extension)
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Si la requête échoue, essaie le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner une erreur
          return new Response('Network error and no cache available', { status: 503 });
        });
      })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Réception des notifications push
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch (error) {
    payload = { title: 'Pulse Montréal', body: event.data?.text() };
  }

  const title = payload.title || 'Pulse Montréal';
  const options = {
    body: payload.body || 'Nouvelle notification',
    data: payload.data || {},
    icon: '/icons/icon-128x128.png',
    badge: '/icons/icon-72x72.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.eventId
    ? `/evenement/${event.notification.data.eventId}`
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

