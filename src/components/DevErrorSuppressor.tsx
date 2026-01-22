/**
 * Composant pour supprimer les erreurs de développement non critiques - Pulse Montreal
 * Utilisé uniquement en mode développement
 */

'use client';

import { useEffect } from 'react';

export default function DevErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Supprimer les erreurs React DevTools
    const suppressReactErrors = () => {
      const originalError = window.console.error;
      const originalWarn = window.console.warn;

      window.console.error = (...args) => {
        const message = args[0]?.toString() || '';
        
        // Messages d'erreur à supprimer complètement
        const criticalSuppressedErrors = [
          'Hydration failed because the initial UI does not match',
          'There was an error while hydrating',
          'A tree hydrated but some attributes of the server rendered HTML',
          'Text content does not match server-rendered HTML',
          'Prop `className` did not match',
          'Warning: validateDOMNesting',
          'cz-shortcut-listen',
          'requestProvider.js',
          'evmAsk.js',
          'Cannot set property ethereum',
          'which has only a getter',
          'runtime.lastError',
          'Could not establish connection',
          'Receiving end does not exist',
          'Extension context invalidated',
          'keeper-lock',
          'data-keeper-lock-id',
          'Keeper Popup'
        ];

        if (criticalSuppressedErrors.some(error => message.includes(error))) {
          return; // Complètement supprimé
        }

        // Autres erreurs avec préfixe pour indiquer qu'elles sont non critiques
        const nonCriticalErrors = [
          'Failed to fetch',
          'Network request failed',
          'Load failed'
        ];

        if (nonCriticalErrors.some(error => message.includes(error))) {
          originalError.call(console, '🟡 [Non-Critical]', ...args);
          return;
        }

        // Erreurs importantes affichées normalement
        originalError.apply(console, args);
      };

      window.console.warn = (...args) => {
        const message = args[0]?.toString() || '';
        
        const suppressedWarnings = [
          'React does not recognize',
          'validateDOMNesting',
          'cz-shortcut-listen',
          'ethereum',
          'chrome-extension',
          'Extension context'
        ];

        if (suppressedWarnings.some(warning => message.includes(warning))) {
          return;
        }

        originalWarn.apply(console, args);
      };

      return { originalError, originalWarn };
    };

    // Nettoyer les attributs d'extension immédiatement
    const cleanExtensionAttributes = () => {
      if (document.body) {
        const attributesToRemove = [
          'cz-shortcut-listen',
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed',
          'data-gramm',
          'data-gramm_editor',
          'data-enable-grammarly',
          'data-lt-installed'
        ];

        attributesToRemove.forEach(attr => {
          if (document.body.hasAttribute(attr)) {
            document.body.removeAttribute(attr);
          }
        });
      }
    };

    // Prévenir les erreurs crypto wallet
    const preventCryptoErrors = () => {
      if (!window.ethereum && !window.hasOwnProperty('ethereum')) {
        try {
          Object.defineProperty(window, 'ethereum', {
            value: undefined,
            writable: false,
            configurable: false
          });
        } catch (e) {
          // Ignore si déjà défini
        }
      }
    };

    // Initialiser les suppressions
    const consoleRestore = suppressReactErrors();
    cleanExtensionAttributes();
    preventCryptoErrors();

    // Nettoyage périodique des attributs
    const cleanupInterval = setInterval(cleanExtensionAttributes, 1000);

    // Cleanup au démontage
    return () => {
      clearInterval(cleanupInterval);
      if (consoleRestore) {
        window.console.error = consoleRestore.originalError;
        window.console.warn = consoleRestore.originalWarn;
      }
    };
  }, []);

  return null;
}
