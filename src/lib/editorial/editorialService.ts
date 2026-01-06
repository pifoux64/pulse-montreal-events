/**
 * Service Éditorial AI - Génération de contenu éditorial (Top 5)
 * 
 * Génère des listes "Top 5" par genre, catégorie ou vibe pour :
 * - Homepage sections
 * - Push notifications (futur)
 * - Social media posts (futur)
 */

import { prisma } from '@/lib/prisma';

export interface Top5Result {
  events: Array<{
    id: string;
    title: string;
    startAt: Date;
    venue?: { name: string; neighborhood?: string } | null;
    imageUrl?: string | null;
    url?: string | null;
  }>;
  theme: string;
  period: 'week' | 'weekend';
  generatedAt: Date;
}

/**
 * Génère un Top 5 d'événements par genre musical
 */
export async function generateTop5ByGenre(
  genre: string,
  period: 'week' | 'weekend' = 'week'
): Promise<Top5Result> {
  const now = new Date();
  const periodStart = new Date(now);
  const periodEnd = new Date(now);

  if (period === 'week') {
    // Du lundi au dimanche de cette semaine
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1
    periodStart.setDate(now.getDate() + diff);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    // Weekend (samedi et dimanche)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) {
      // Dimanche : prendre samedi et dimanche
      periodStart.setDate(now.getDate() - 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate());
      periodEnd.setHours(23, 59, 59, 999);
    } else if (dayOfWeek === 6) {
      // Samedi : prendre samedi et dimanche
      periodStart.setDate(now.getDate());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      // Autre jour : prendre le prochain weekend
      const daysUntilSaturday = 6 - dayOfWeek;
      periodStart.setDate(now.getDate() + daysUntilSaturday);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodStart.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    }
  }

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      eventTags: {
        some: {
          category: 'genre',
          value: genre,
        },
      },
    },
    include: {
      venue: {
        select: {
          name: true,
          neighborhood: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: [
      { _count: { favorites: 'desc' } },
      { startAt: 'asc' },
    ],
    take: 5,
  });

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      venue: e.venue,
      imageUrl: e.imageUrl,
      url: e.url,
    })),
    theme: genre,
    period,
    generatedAt: new Date(),
  };
}

/**
 * Génère un Top 5 d'événements par catégorie
 */
export async function generateTop5ByCategory(
  category: string,
  period: 'week' | 'weekend' = 'week'
): Promise<Top5Result> {
  const now = new Date();
  const periodStart = new Date(now);
  const periodEnd = new Date(now);

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    periodStart.setDate(now.getDate() + diff);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) {
      periodStart.setDate(now.getDate() - 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate());
      periodEnd.setHours(23, 59, 59, 999);
    } else if (dayOfWeek === 6) {
      periodStart.setDate(now.getDate());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      const daysUntilSaturday = 6 - dayOfWeek;
      periodStart.setDate(now.getDate() + daysUntilSaturday);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodStart.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    }
  }

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      eventTags: {
        some: {
          category: 'category',
          value: category,
        },
      },
    },
    include: {
      venue: {
        select: {
          name: true,
          neighborhood: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: [
      { _count: { favorites: 'desc' } },
      { startAt: 'asc' },
    ],
    take: 5,
  });

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      venue: e.venue,
      imageUrl: e.imageUrl,
      url: e.url,
    })),
    theme: category,
    period,
    generatedAt: new Date(),
  };
}

/**
 * Génère un Top 5 d'événements par vibe/ambiance
 */
export async function generateTop5ByVibe(
  vibe: string,
  period: 'week' | 'weekend' = 'week'
): Promise<Top5Result> {
  const now = new Date();
  const periodStart = new Date(now);
  const periodEnd = new Date(now);

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    periodStart.setDate(now.getDate() + diff);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) {
      periodStart.setDate(now.getDate() - 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate());
      periodEnd.setHours(23, 59, 59, 999);
    } else if (dayOfWeek === 6) {
      periodStart.setDate(now.getDate());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(now.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      const daysUntilSaturday = 6 - dayOfWeek;
      periodStart.setDate(now.getDate() + daysUntilSaturday);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodStart.getDate() + 1);
      periodEnd.setHours(23, 59, 59, 999);
    }
  }

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      eventTags: {
        some: {
          category: 'ambiance',
          value: vibe,
        },
      },
    },
    include: {
      venue: {
        select: {
          name: true,
          neighborhood: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: [
      { _count: { favorites: 'desc' } },
      { startAt: 'asc' },
    ],
    take: 5,
  });

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      venue: e.venue,
      imageUrl: e.imageUrl,
      url: e.url,
    })),
    theme: vibe,
    period,
    generatedAt: new Date(),
  };
}

