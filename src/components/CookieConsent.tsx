'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const t = useTranslations('cookies');
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('pulse-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('pulse-cookie-consent', JSON.stringify(fullConsent));
    setIsVisible(false);
    
    // Initialiser les services analytics si acceptés
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    }
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('pulse-cookie-consent', JSON.stringify(consent));
    setIsVisible(false);
    
    // Configurer les services selon les préférences
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
      });
    }
  };

  const handleDeclineAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('pulse-cookie-consent', JSON.stringify(minimalConsent));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Cookie className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Gestion des cookies
            </h2>
          </div>
          <button
            onClick={handleDeclineAll}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300">
              Nous utilisons des cookies pour améliorer votre expérience sur Pulse Montreal. 
              Certains cookies sont essentiels au fonctionnement du site, tandis que d'autres 
              nous aident à comprendre comment vous utilisez notre plateforme.
            </p>
          </div>

          {showDetails && (
            <div className="space-y-4">
              {/* Cookies nécessaires */}
              <div className="flex items-start space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Cookies nécessaires
                    </h3>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Toujours activé
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Ces cookies sont indispensables au fonctionnement du site. Ils incluent 
                    la gestion de votre session, vos préférences de langue et la sécurité.
                  </p>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Cookies analytiques
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          analytics: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Ces cookies nous aident à comprendre comment vous utilisez le site 
                    pour améliorer nos services. Aucune donnée personnelle n'est collectée.
                  </p>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="flex items-start space-x-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <Cookie className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-teal-900 dark:text-teal-100">
                      Cookies marketing
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          marketing: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                    Ces cookies permettent de personnaliser les publicités et le contenu 
                    selon vos intérêts. Ils sont utilisés par nos partenaires publicitaires.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toggle details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium text-sm transition-colors"
          >
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </button>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Accepter tous les cookies
            </button>
            {showDetails && (
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Sauvegarder mes préférences
              </button>
            )}
          </div>
          <button
            onClick={handleDeclineAll}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Refuser les cookies non-essentiels
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            En continuant à utiliser ce site, vous acceptez notre{' '}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              politique de confidentialité
            </a>{' '}
            et nos{' '}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              conditions d'utilisation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
