'use client';

import { useEffect, useState } from 'react';
import AppWrapper from './AppWrapper';

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
        })
        .catch((error) => {
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
      {children}
    </AppWrapper>
  );
}
