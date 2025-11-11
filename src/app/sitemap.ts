import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';

const CACHE_MAX_EVENTS = 500;
const CACHE_MAX_ORGANIZERS = 200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || 'pulse-mtl.vercel.app';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/carte`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calendrier`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/favoris`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/publier`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [events, organizers] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: EventStatus.SCHEDULED,
        startAt: {
          gte: monthAgo,
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: CACHE_MAX_EVENTS,
    }),
    prisma.organizer.findMany({
      select: {
        id: true,
      },
      orderBy: {
        displayName: 'asc',
      },
      take: CACHE_MAX_ORGANIZERS,
    }),
  ]);

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/evenement/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const organizerPages: MetadataRoute.Sitemap = organizers.map((organizer) => ({
    url: `${baseUrl}/organisateur/${organizer.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...eventPages, ...organizerPages];
}
