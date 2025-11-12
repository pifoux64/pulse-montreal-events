import { Poppins } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClientLayout from '@/components/ClientLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ExtensionCleaner from '@/components/ExtensionCleaner';
import DevErrorSuppressor from '@/components/DevErrorSuppressor';
import QueryProvider from '@/components/QueryProvider';
import { suppressHydrationWarnings } from '@/lib/suppressHydrationWarnings';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Pulse - Découvrez les événements de Montréal',
  description: 'Plateforme Pulse pour découvrir et organiser des événements culturels, sportifs et festifs à Montréal. Concerts, festivals, expositions, spectacles et plus encore.',
  keywords: ['événements', 'Montréal', 'concerts', 'festivals', 'culture', 'spectacles', 'sorties'],
  authors: [{ name: 'Pulse Montreal' }],
  creator: 'Pulse Montreal',
  publisher: 'Pulse Montreal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://pulse-mtl.vercel.app' : 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-CA': '/fr',
      'en-CA': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: '/',
    title: 'Pulse Montreal - Événements & Culture',
    description: 'Découvrez les meilleurs événements culturels, concerts, festivals et spectacles à Montréal. Votre agenda culturel complet.',
    siteName: 'Pulse Montreal',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pulse Montreal - Événements & Culture',
      },
      {
        url: '/Pulse_Logo.png',
        width: 400,
        height: 400,
        alt: 'Logo Pulse Montreal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse Montreal - Événements & Culture',
    description: 'Découvrez les meilleurs événements culturels, concerts, festivals et spectacles à Montréal.',
    images: ['/og-image.png'],
    creator: '@PulseMontreal',
    site: '@PulseMontreal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supprimer les warnings d'hydratation en développement
  if (typeof window !== 'undefined') {
    suppressHydrationWarnings();
  }

  return (
    <html lang="fr" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Sentry Script */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN && (
          <script
            src="https://js.sentry-cdn.com/your-sentry-key.min.js"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-poppins antialiased" suppressHydrationWarning>
        {process.env.NODE_ENV === 'development' && <DevErrorSuppressor />}
        <ExtensionCleaner />
        <ErrorBoundary>
          <QueryProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <CookieBanner />
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
