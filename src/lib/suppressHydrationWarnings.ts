/**
 * Suppression des warnings d'hydratation non critiques - Pulse Montreal
 * Utilisé uniquement en mode développement
 */

export function suppressHydrationWarnings() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Supprimer les warnings d'hydratation causés par les extensions de navigateur
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      
      // Liste des messages à supprimer
      const suppressedMessages = [
        'Hydration failed because the initial UI does not match',
        'There was an error while hydrating',
        'A tree hydrated but some attributes of the server rendered HTML',
        'Text content does not match server-rendered HTML',
        'cz-shortcut-listen',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'requestProvider.js',
        'evmAsk.js',
        'Cannot set property ethereum',
        'Cannot redefine property: ethereum',
        'runtime.lastError',
        'Could not establish connection',
        'Receiving end does not exist',
        'chrome-extension',
        'Extension context',
        'keeper-lock',
        'data-keeper-lock-id',
        'Keeper Popup',
        'keeper-lock-disabled'
      ];

      // Ne pas afficher l'erreur si elle correspond à un pattern à supprimer
      if (suppressedMessages.some(suppressedMsg => message.includes(suppressedMsg))) {
        return;
      }

      // Afficher les autres erreurs normalement
      originalConsoleError.apply(console, args);
    };

    // Supprimer aussi les warnings React
    const originalConsoleWarn = console.warn;
    
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      
      const suppressedWarnings = [
        'validateDOMNesting',
        'React does not recognize',
        'cz-shortcut-listen',
        'ethereum',
        'chrome-extension'
      ];

      if (suppressedWarnings.some(suppressedMsg => message.includes(suppressedMsg))) {
        return;
      }

      originalConsoleWarn.apply(console, args);
    };
  }
}
