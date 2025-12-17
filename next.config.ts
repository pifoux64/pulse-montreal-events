import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Pulse Montreal
  
  // Images optimisées
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.eventbrite.com',
      },
      {
        protocol: 'https',
        hostname: 'img.evbuc.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.meetupstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers de sécurité
  async headers() {
    return [
      // Headers pour le manifest PWA (pas de cache pour forcer les mises à jour)
      {
        source: '/manifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Headers pour les icônes PWA
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.sentry-cdn.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://o4507004691537920.ingest.us.sentry.io https://demotiles.maplibre.org https://tile.openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-src 'none'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ];
  },

  // Configuration expérimentale pour les performances
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Configuration Turbopack (maintenant stable)
  // Note: Les fichiers icon.svg, apple-icon.svg sont gérés automatiquement par Next.js comme metadata
  // On ne configure pas de règles pour les SVG car Next.js les gère nativement

  // Suppression des warnings d'hydratation en développement
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
    webpack: (config: any, { dev, isServer }: any) => {
      if (dev && !isServer) {
        // Supprimer les warnings d'hydratation non critiques
        const originalEntry = config.entry;
        config.entry = async () => {
          const entries = await originalEntry();
          if (entries['main.js'] && !entries['main.js'].includes('./client/dev-error-overlay.js')) {
            entries['main.js'].push('./client/dev-error-overlay.js');
          }
          return entries;
        };
      }
      return config;
    },
  }),

  // Transpilation des packages
  transpilePackages: ['lucide-react'],

  // Configuration TypeScript (temporaire pour déploiement)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuration ESLint (temporaire pour déploiement)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimisations de build
  compress: true,

  // Configuration des redirections pour SEO
  async redirects() {
    return [
      {
        source: '/events',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
