'use client';

import { useEffect, useState } from 'react';

export default function ExtensionCleaner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marquer que nous sommes côté client pour éviter l'hydratation mismatch
    setIsClient(true);
    
    // Nettoyage IMMÉDIAT avant même que React ne s'hydrate
    const immediateClean = () => {
      // Supprimer les éléments Keeper
      const keeperLocks = document.querySelectorAll('keeper-lock');
      keeperLocks.forEach(el => el.remove());
      
      // Supprimer les attributs Keeper des inputs
      const inputs = document.querySelectorAll('input[data-keeper-lock-id]');
      inputs.forEach(input => {
        input.removeAttribute('data-keeper-lock-id');
      });
    };
    
    // Nettoyer immédiatement
    immediateClean();
    
    // Nettoyer aussi après un court délai pour capturer les ajouts tardifs
    setTimeout(immediateClean, 0);
    setTimeout(immediateClean, 50);
    setTimeout(immediateClean, 100);

    // Installer le gestionnaire d'erreurs global AVANT tout pour capturer les erreurs d'extensions
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalErrorHandler = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    // Gestionnaire d'erreurs global pour capturer les erreurs d'extensions
    window.onerror = (message, source, lineno, colno, error) => {
      const messageStr = String(message || '');
      if (
        messageStr.includes('Cannot redefine property: ethereum') ||
        messageStr.includes('evmAsk.js') ||
        messageStr.includes('requestProvider.js') ||
        messageStr.includes('chrome-extension')
      ) {
        // Supprimer ces erreurs d'extensions
        return true; // Empêcher la propagation
      }
      // Appeler le gestionnaire original si défini
      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Gestionnaire pour les promesses rejetées non gérées
    window.onunhandledrejection = (event) => {
      const reason = String(event.reason || '');
      if (
        reason.includes('Cannot redefine property: ethereum') ||
        reason.includes('evmAsk.js') ||
        reason.includes('chrome-extension')
      ) {
        event.preventDefault(); // Empêcher l'affichage de l'erreur
        return;
      }
      // Appeler le gestionnaire original si défini
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    // Suppression immédiate et continue des attributs d'extensions
    const cleanAttributes = () => {
      // Supprimer les éléments Keeper ajoutés dynamiquement
      const keeperLocks = document.querySelectorAll('keeper-lock');
      keeperLocks.forEach(el => el.remove());
      
      // Supprimer les attributs Keeper des inputs
      const inputs = document.querySelectorAll('input[data-keeper-lock-id]');
      inputs.forEach(input => {
        input.removeAttribute('data-keeper-lock-id');
      });
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
            'spellcheck',
            'data-keeper-lock-id'
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
        // Ne PAS essayer de définir ethereum si elle existe déjà ou est non-configurable
        // Les extensions crypto wallet la définissent elles-mêmes
        // On installe juste un gestionnaire d'erreurs global pour capturer les conflits
        try {
          // Vérifier si ethereum existe déjà
          const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
          if (descriptor && !descriptor.configurable) {
            // ethereum existe et est non-configurable, ne rien faire
            return;
          }
          
          // Si ethereum n'existe pas, on peut essayer de créer un placeholder
          // mais seulement si configurable
          if (!window.ethereum && (!descriptor || descriptor.configurable)) {
            try {
              Object.defineProperty(window, 'ethereum', {
                value: null,
                writable: true, // Permettre aux extensions de le modifier
                configurable: true // Permettre aux extensions de le redéfinir
              });
            } catch (e) {
              // Ignore si déjà défini par une extension
            }
          }
        } catch (e) {
          // Ignore toute erreur liée à ethereum
        }
      }
    };

    // Nettoyage immédiat AVANT l'hydratation React
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        cleanAttributes();
      });
    } else {
      cleanAttributes();
    }
    
    preventCryptoErrors();

    // Nettoyage périodique moins agressif
    const interval = setInterval(cleanAttributes, 500);

    // Nettoyage agressif pendant les 5 premières secondes (pour Keeper)
    const aggressiveInterval = setInterval(cleanAttributes, 100);
    setTimeout(() => clearInterval(aggressiveInterval), 5000);

    // Observer pour les mutations DOM
    let observer: MutationObserver | null = null;
    
    if (typeof window !== 'undefined' && 'MutationObserver' in window) {
      observer = new MutationObserver((mutations) => {
        let shouldClean = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLElement;
            if (target.tagName === 'BODY' || target.hasAttribute('data-keeper-lock-id')) {
              shouldClean = true;
            }
          } else if (mutation.type === 'childList') {
            // Vérifier si des éléments Keeper ont été ajoutés
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === 'KEEPER-LOCK' || el.querySelector('keeper-lock')) {
                  shouldClean = true;
                }
              }
            });
          }
        });
        if (shouldClean) {
          cleanAttributes();
        }
      });

      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: [
            'cz-shortcut-listen', 
            'data-new-gr-c-s-check-loaded', 
            'data-gr-ext-installed',
            'data-gramm',
            'data-lt-installed',
            'data-keeper-lock-id'
          ]
        });
      }
    }

    // Filtrage amélioré des erreurs console (en plus du gestionnaire global)
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
      window.onerror = originalErrorHandler;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, []);

  // Retourner null uniquement côté client pour éviter l'hydratation mismatch
  if (!isClient) {
    return null;
  }

  return null;
}
