import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://pulse-mtl.vercel.app' 
    : 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/_next/',
          '/private/',
          '*.json',
        ],
      },
      // Règles spéciales pour les bots de réseaux sociaux
      {
        userAgent: ['Twitterbot', 'facebookexternalhit'],
        allow: [
          '/',
          '/evenement/*',
          '/organisateur/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
