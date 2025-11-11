'use client';

import { NextIntlClientProvider } from 'next-intl';
import Navigation from './Navigation';
import CookieConsent from './CookieConsent';
import PWAInstallPrompt from './PWAInstallPrompt';
import frMessages from '../../messages/fr.json';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <CookieConsent />
      <PWAInstallPrompt />
    </NextIntlClientProvider>
  );
}
