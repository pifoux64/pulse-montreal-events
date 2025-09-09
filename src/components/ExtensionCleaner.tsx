'use client';

import { useEffect, useState } from 'react';

export default function ExtensionCleaner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marquer que nous sommes côté client pour éviter l'hydratation mismatch
    setIsClient(true);

    // Suppression immédiate et continue des attributs d'extensions
    const cleanAttributes = () => {
      if (typeof document !== 'undefined') {
        const body = document.body;
        if (body) {
          // Suppression des attributs d'extensions courantes
          const extensionAttributes = [
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded', 
            'data-gr-ext-installed',
            'data-gramm',
            'data-gramm_editor',
            'data-enable-grammarly',
            'data-lt-installed',
            'spellcheck'
          ];
          
          extensionAttributes.forEach(attr => {
            if (body.hasAttribute(attr)) {
              body.removeAttribute(attr);
            }
          });
        }
      }
    };

    // Prévention des erreurs ethereum/crypto wallet
    const preventCryptoErrors = () => {
      if (typeof window !== 'undefined') {
        // Créer un proxy pour window.ethereum si nécessaire
        if (!window.ethereum) {
          try {
            Object.defineProperty(window, 'ethereum', {
              value: null,
              writable: false,
              configurable: false
            });
          } catch (e) {
            // Ignore si déjà défini
          }
        }
      }
    };

    // Nettoyage immédiat
    cleanAttributes();
    preventCryptoErrors();

    // Nettoyage périodique moins agressif
    const interval = setInterval(cleanAttributes, 500);

    // Nettoyage agressif pendant les 3 premières secondes seulement
    const aggressiveInterval = setInterval(cleanAttributes, 100);
    setTimeout(() => clearInterval(aggressiveInterval), 3000);

    // Observer pour les mutations DOM
    let observer: MutationObserver | null = null;
    
    if (typeof window !== 'undefined' && 'MutationObserver' in window) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLElement;
            if (target.tagName === 'BODY') {
              cleanAttributes();
            }
          }
        });
      });

      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: [
            'cz-shortcut-listen', 
            'data-new-gr-c-s-check-loaded', 
            'data-gr-ext-installed',
            'data-gramm',
            'data-lt-installed'
          ]
        });
      }
    }

    // Filtrage amélioré des erreurs console
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      const suppressedErrors = [
        'evmAsk.js',
        'requestProvider.js',
        'Cannot redefine property: ethereum',
        'Cannot set property ethereum',
        'which has only a getter',
        'runtime.lastError',
        'Could not establish connection',
        'Receiving end does not exist',
        'cz-shortcut-listen',
        'Extension context invalidated',
        'Failed to fetch',
        'Load failed'
      ];

      if (suppressedErrors.some(error => message.includes(error))) {
        return; // Supprimer ces erreurs
      }
      
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      const suppressedWarnings = [
        'evmAsk.js',
        'requestProvider.js',
        'ethereum',
        'cz-shortcut-listen',
        'Extension context',
        'chrome-extension'
      ];

      if (suppressedWarnings.some(warning => message.includes(warning))) {
        return; // Supprimer ces avertissements
      }
      
      originalWarn.apply(console, args);
    };

    // Cleanup function
    return () => {
      clearInterval(interval);
      if (observer) {
        observer.disconnect();
      }
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Retourner null uniquement côté client pour éviter l'hydratation mismatch
  if (!isClient) {
    return null;
  }

  return null;
}
