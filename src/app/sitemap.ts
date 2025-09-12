import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') || 'pulse-mtl.vercel.app'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  // Pages statiques
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/carte`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calendrier`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/favoris`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/publier`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // TODO: Ajouter les pages d'événements dynamiques
  // const events = await fetchEvents()
  // const eventPages = events.map(event => ({
  //   url: `${baseUrl}/evenement/${event.id}`,
  //   lastModified: new Date(event.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  // TODO: Ajouter les pages d'organisateurs
  // const organizers = await fetchOrganizers()
  // const organizerPages = organizers.map(org => ({
  //   url: `${baseUrl}/organisateur/${org.id}`,
  //   lastModified: new Date(org.updatedAt),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.5,
  // }))

  return [
    ...staticPages,
    // ...eventPages,
    // ...organizerPages,
  ]
}
