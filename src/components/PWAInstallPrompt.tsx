'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      const hasDeclined = localStorage.getItem('pwa-install-declined');
      const lastDeclined = hasDeclined ? new Date(hasDeclined) : null;
      const daysSinceDeclined = lastDeclined
        ? (Date.now() - lastDeclined.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      const willShowPrompt = daysSinceDeclined > 7;

      // preventDefault uniquement si on va afficher notre bannière (évite le warning console)
      if (willShowPrompt) {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // Écouter l'événement d'installation réussie
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-declined');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
        localStorage.setItem('pwa-install-declined', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-declined', new Date().toISOString());
  };

  // Ne rien afficher si déjà installé ou pas de prompt disponible
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Installer Pulse Montreal
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              Accédez rapidement aux événements depuis votre écran d'accueil
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <Download className="h-3 w-3" />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook pour vérifier si l'app est installée
export function usePWAInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstallation();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstallation);
    
    return () => {
      mediaQuery.removeEventListener('change', checkInstallation);
    };
  }, []);

  return isInstalled;
}
