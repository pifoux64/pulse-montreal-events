'use client';

import { useEffect, useState } from 'react';
import AppWrapper from './AppWrapper';
import LandingViewTracker from './LandingViewTracker';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fonction de nettoyage des attributs d'extensions
    const cleanExtensionAttributes = () => {
      if (typeof document !== 'undefined') {
        const body = document.body;
        if (body) {
          const problematicAttributes = [
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded',
            'data-gr-ext-installed',
            'data-gramm',
            'data-gramm_editor',
            'data-enable-grammarly'
          ];
          
          problematicAttributes.forEach(attr => {
            if (body.hasAttribute(attr)) {
              body.removeAttribute(attr);
            }
          });
        }
      }
    };

    // Nettoyage immédiat
    cleanExtensionAttributes();
    
    // Nettoyage continu toutes les 500ms
    const interval = setInterval(cleanExtensionAttributes, 500);

    // Enregistrement du Service Worker pour PWA (Android et autres)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker enregistré:', registration.scope);
          
          // Écouter les messages du service worker (pour les erreurs de déploiement)
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'FORCE_RELOAD') {
              console.log('Force reload demandé:', event.data.reason);
              if ('caches' in window) {
                caches
                  .keys()
                  .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
                  .then(() => {
                    window.location.reload();
                  });
              } else {
                window.location.reload();
              }
            }

            if (event.data?.type === 'NAVIGATE' && event.data.url) {
              window.location.href = event.data.url;
            }
          });
          
          // Vérifier les mises à jour périodiquement
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouveau service worker disponible, forcer la mise à jour
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  // Recharger la page pour utiliser le nouveau service worker
                  window.location.reload();
                }
              });
            }
          });

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          // Ignorer les erreurs 404 (fichier non trouvé) - c'est normal en développement
          // ou si le Service Worker n'est pas encore déployé
          if (error?.message?.includes('404') || error?.message?.includes('bad HTTP response code')) {
            // Service Worker non disponible, ce n'est pas une erreur critique
            return;
          }
          // Afficher uniquement les autres erreurs
          console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    }

    // Marquer comme monté immédiatement
    setMounted(true);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Afficher le contenu immédiatement
  return (
    <AppWrapper>
      <LandingViewTracker />
      {children}
    </AppWrapper>
  );
}
