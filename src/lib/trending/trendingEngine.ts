/**
 * Trending Engine - Calcule les événements tendance
 * Sprint V2: Social proof + trending
 * 
 * Calcul eventTrendScore basé sur:
 * - favorites (weighted)
 * - views/clicks (weighted)
 * - recency decay
 * - diversity constraint (évite 10 événements du même venue)
 */

import { prisma } from '@/lib/prisma';

export interface TrendingEvent {
  id: string;
  title: string;
  description?: string;
  startAt: Date;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    lat: number;
    lon: number;
  };
  category: string;
  tags: string[];
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  imageUrl?: string;
  url?: string;
  source: string;
  trendScore: number;
  favoritesToday: number;
  viewsToday: number;
  eventTags?: {
    category: 'type' | 'genre' | 'ambiance' | 'public' | string;
    value: string;
  }[];
  _count?: {
    favorites: number;
  };
}

export type TrendingScope = 'today' | 'weekend' | 'week';

/**
 * Calcule le score de trending pour un événement
 */
function calculateTrendScore(
  favoritesToday: number,
  viewsToday: number,
  favoritesTotal: number,
  viewsTotal: number,
  hoursUntilEvent: number
): number {
  // Poids pour les différentes métriques
  const FAVORITE_WEIGHT = 3.0; // Un favori vaut 3x une vue
  const VIEW_WEIGHT = 1.0;
  const RECENCY_BOOST = 0.5; // Bonus pour les événements récents

  // Score de base basé sur favorites et views (pondérés)
  const baseScore = (favoritesToday * FAVORITE_WEIGHT) + (viewsToday * VIEW_WEIGHT);
  
  // Normalisation: diviser par le nombre total pour éviter que les anciens événements dominent
  const normalizedScore = baseScore / Math.max(1, (favoritesTotal + viewsTotal) / 100);

  // Recency decay: pénaliser les événements très éloignés dans le temps
  // Mais bonus pour les événements qui arrivent bientôt (dans les 24h)
  let recencyMultiplier = 1.0;
  if (hoursUntilEvent < 0) {
    // Événement passé
    recencyMultiplier = 0.1;
  } else if (hoursUntilEvent <= 24) {
    // Événement dans les 24h prochaines = boost
    recencyMultiplier = 1.0 + RECENCY_BOOST;
  } else if (hoursUntilEvent <= 168) {
    // Événement dans la semaine = normal
    recencyMultiplier = 1.0;
  } else {
    // Événement dans plus d'une semaine = léger decay
    recencyMultiplier = 0.8;
  }

  return normalizedScore * recencyMultiplier;
}

/**
 * Récupère les événements trending pour un scope donné
 */
export async function getTrendingEvents(
  scope: TrendingScope = 'today',
  limit: number = 20
): Promise<TrendingEvent[]> {
  const now = new Date();
  const montrealTZ = 'America/Montreal';
  const today = new Date(now.toLocaleString('en-US', { timeZone: montrealTZ }));
  today.setHours(0, 0, 0, 0);

  // Calculer les dates selon le scope
  let startDate: Date;
  let endDate: Date;

  switch (scope) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      startDate = today;
      endDate = tomorrow;
      break;
    }
    case 'weekend': {
      const dayOfWeek = today.getDay();
      const daysUntilFriday = dayOfWeek === 0 ? 5 : dayOfWeek === 6 ? 6 : 5 - dayOfWeek;
      const friday = new Date(today);
      friday.setDate(today.getDate() + daysUntilFriday);
      friday.setHours(0, 0, 0, 0);
      
      const monday = new Date(friday);
      monday.setDate(friday.getDate() + 3);
      monday.setHours(0, 0, 0, 0);
      
      startDate = today;
      endDate = monday;
      break;
    }
    case 'week': {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      startDate = today;
      endDate = nextWeek;
      break;
    }
  }

  // Convertir en UTC pour la requête
  const startUTC = new Date(startDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const endUTC = new Date(endDate.toLocaleString('en-US', { timeZone: 'UTC' }));

  // Récupérer les événements dans la période
  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: startUTC,
        lt: endUTC,
      },
    },
    include: {
      venue: true,
      eventTags: true,
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    take: 200, // Récupérer plus d'événements pour calculer les scores
  });

  // Calculer les métriques pour chaque événement (24h)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const eventsWithScores = await Promise.all(
    events.map(async (event) => {
      // Compter les favoris ajoutés aujourd'hui
      const favoritesToday = await prisma.favorite.count({
        where: {
          eventId: event.id,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      // Compter les vues aujourd'hui
      const viewsToday = await prisma.eventView.count({
        where: {
          eventId: event.id,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      // Calculer les heures jusqu'à l'événement
      const hoursUntilEvent = (event.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Calculer le score de trending
      const trendScore = calculateTrendScore(
        favoritesToday,
        viewsToday,
        event._count.favorites,
        viewsToday, // Approximation: on utilise viewsToday comme total pour simplifier
        hoursUntilEvent
      );

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startAt: event.startAt,
        venue: event.venue
          ? {
              name: event.venue.name,
              address: event.venue.address,
              city: event.venue.city,
              lat: event.venue.lat,
              lon: event.venue.lon,
            }
          : undefined,
        category: event.category,
        tags: event.tags,
        priceMin: event.priceMin,
        priceMax: event.priceMax,
        currency: event.currency,
        imageUrl: event.imageUrl,
        url: event.url,
        source: event.source,
        trendScore,
        favoritesToday,
        viewsToday,
        eventTags: event.eventTags.map((tag) => ({
          category: tag.category,
          value: tag.value,
        })),
        _count: {
          favorites: event._count.favorites,
        },
      };
    })
  );

  // Trier par score décroissant
  const sorted = eventsWithScores.sort((a, b) => b.trendScore - a.trendScore);

  // Appliquer la contrainte de diversité (éviter trop d'événements du même venue)
  const diverseEvents: TrendingEvent[] = [];
  const venueCounts = new Map<string, number>();
  const MAX_EVENTS_PER_VENUE = 3;

  for (const event of sorted) {
    if (diverseEvents.length >= limit) break;

    const venueKey = event.venue?.name || 'unknown';
    const currentCount = venueCounts.get(venueKey) || 0;

    if (currentCount < MAX_EVENTS_PER_VENUE) {
      diverseEvents.push(event);
      venueCounts.set(venueKey, currentCount + 1);
    }
  }

  return diverseEvents;
}

/**
 * Récupère le nombre de favoris ajoutés aujourd'hui pour un événement
 */
export async function getFavoritesToday(eventId: string): Promise<number> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return prisma.favorite.count({
    where: {
      eventId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });
}

/**
 * Vérifie si un événement est "trending" (score > seuil)
 */
export async function isEventTrending(eventId: string, threshold: number = 0.5): Promise<boolean> {
  const events = await getTrendingEvents('today', 50);
  const event = events.find((e) => e.id === eventId);
  return event ? event.trendScore >= threshold : false;
}

