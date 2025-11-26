import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  // Version basée sur la date/heure pour forcer les mises à jour PWA
  const version = process.env.NEXT_PUBLIC_APP_VERSION || new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return {
    id: `pulse-montreal-${version}`,
    name: 'Pulse Montreal - Événements & Culture',
    short_name: 'Pulse MTL',
    description: 'Découvrez les meilleurs événements culturels, concerts, festivals et spectacles à Montréal',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1abc9c',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'lifestyle', 'music', 'social'],
    lang: 'fr-CA',
    dir: 'ltr',
    scope: '/',
    
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ],
    
    screenshots: [
      {
        src: '/screenshots/desktop-1.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Page d\'accueil Pulse Montreal'
      },
      {
        src: '/screenshots/mobile-1.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Carte des événements mobile'
      },
      {
        src: '/screenshots/mobile-2.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Liste des événements mobile'
      }
    ],
    
    shortcuts: [
      {
        name: 'Carte des événements',
        short_name: 'Carte',
        description: 'Voir tous les événements sur la carte',
        url: '/carte',
        icons: [
          {
            src: '/icons/shortcut-map.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Mes favoris',
        short_name: 'Favoris',
        description: 'Accéder à mes événements favoris',
        url: '/favoris',
        icons: [
          {
            src: '/icons/shortcut-favorites.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Publier un événement',
        short_name: 'Publier',
        description: 'Créer un nouvel événement',
        url: '/publier',
        icons: [
          {
            src: '/icons/shortcut-publish.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ],
    
    related_applications: [
      {
        platform: 'webapp',
        url: 'https://pulse-mtl.vercel.app/manifest'
      }
    ],
    
    prefer_related_applications: false,
    
    edge_side_panel: {
      preferred_width: 400
    }
  }
}
