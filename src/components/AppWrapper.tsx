'use client';

import { useState, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import Navigation from './Navigation';
import Footer from './Footer';
import CookieConsent from './CookieConsent';
import PWAInstallPrompt from './PWAInstallPrompt';
import { locales, type Locale, defaultLocale } from '@/lib/i18n';
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

interface AppWrapperProps {
  children: React.ReactNode;
}

const messages: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
  es: esMessages,
};

// Fonction pour lire le cookie côté client
function getCookieLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const cookieLocale = document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1] as Locale | undefined;
  
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  
  return defaultLocale;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  // Lire la locale depuis le cookie immédiatement
  const [locale, setLocale] = useState<Locale>(() => {
    // Essayer de lire le cookie même au premier rendu si on est côté client
    if (typeof window !== 'undefined') {
      return getCookieLocale();
    }
    // Au premier rendu serveur, utiliser defaultLocale pour éviter les erreurs d'hydratation
    return defaultLocale;
  });

  // Lire la locale depuis le cookie après le montage
  useEffect(() => {
    const cookieLocale = getCookieLocale();
    if (cookieLocale !== locale) {
      setLocale(cookieLocale);
    }
  }, [locale]);

  // Écouter les changements de cookie (quand la langue change)
  useEffect(() => {
    const checkCookie = () => {
      const cookieLocale = document.cookie
        .split('; ')
        .find((row) => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] as Locale | undefined;
      
      if (cookieLocale && locales.includes(cookieLocale) && cookieLocale !== locale) {
        setLocale(cookieLocale);
      }
    };

    // Vérifier le cookie toutes les secondes (pour détecter les changements)
    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  return (
    <SessionProvider>
      <NextIntlClientProvider 
        locale={locale} 
        messages={messages[locale]} 
        timeZone="America/Montreal"
      >
        <Navigation suppressHydrationWarning />
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Footer suppressHydrationWarning />
        <CookieConsent />
        <PWAInstallPrompt />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
