import { MetadataRoute } from 'next'

// Génère automatiquement une version unique à chaque build
function getAppVersion(): string {
  // Sur Vercel, utilise le hash de commit Git
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 8);
  }
  // Sinon, utilise un timestamp (pour dev/local)
  return Date.now().toString(36);
}

export default function manifest(): MetadataRoute.Manifest {
  // Version automatique basée sur le commit Git ou timestamp
  const version = getAppVersion();
  
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
        src: '/Pulse_Logo_only_heart.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/Pulse_Logo_only_heart.png',
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
