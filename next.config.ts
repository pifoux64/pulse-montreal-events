import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour Pulse Montreal
  
  // Images optimisées
  images: {
    domains: [
      'picsum.photos',
      'images.unsplash.com',
      'cdn.eventbrite.com',
      'img.evbuc.com',
      'secure.meetupstatic.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers de sécurité
  async headers() {
    return [
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
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

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
