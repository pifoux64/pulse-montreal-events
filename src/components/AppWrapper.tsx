'use client';

import Navigation from './Navigation';
import CookieConsent from './CookieConsent';
import PWAInstallPrompt from './PWAInstallPrompt';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <CookieConsent />
      <PWAInstallPrompt />
    </>
  );
}
