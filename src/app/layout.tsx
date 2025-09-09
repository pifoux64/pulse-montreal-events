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
  description: 'Plateforme Pulse pour découvrir et organiser des événements culturels, sportifs et festifs à Montréal',
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
      <body className="font-poppins antialiased" suppressHydrationWarning>
        {process.env.NODE_ENV === 'development' && <DevErrorSuppressor />}
        <ExtensionCleaner />
        <QueryProvider>
          <ErrorBoundary>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
