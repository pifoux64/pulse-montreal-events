'use client';

import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import Navigation from './Navigation';
import Footer from './Footer';
import CookieConsent from './CookieConsent';
import PWAInstallPrompt from './PWAInstallPrompt';
import frMessages from '../../messages/fr.json';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale="fr" messages={frMessages} timeZone="America/Montreal">
        <Navigation />
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Footer />
        <CookieConsent />
        <PWAInstallPrompt />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
