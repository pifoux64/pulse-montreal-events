/**
 * Recommendation Engine - Moteur de recommandations personnalisées
 * Basé sur les goûts musicaux, préférences et historique utilisateur
 */

import { prisma } from '@/lib/prisma';
import { buildUserMusicProfile, UserMusicProfile } from './userProfileBuilder';
import { Event } from '@prisma/client';
import { recommendationCache, getRecommendationCacheKey } from './cache';

export interface RecommendationResult {
  event: Event & {
    venue: any;
    organizer: any;
    eventTags: Array<{ category: string; value: string }>;
    _count?: { favorites: number };
  };
  score: number;
  reasons: string[]; // Explications de la recommandation
}

export interface RecommendationOptions {
  limit?: number;
  genre?: string;
  style?: string;
  scope?: 'today' | 'weekend' | 'all';
  minScore?: number; // Score minimum pour inclure une recommandation
}

/**
 * Génère des recommandations personnalisées pour un utilisateur
 */
export async function getPersonalizedRecommendations(
  userId: string,
  options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
  const {
    limit = 20,
    genre,
    style,
    scope = 'all',
    minScore = 0.1,
  } = options;

  // Vérifier le cache (TTL 1 heure)
  const cacheKey = getRecommendationCacheKey(userId, { genre, style, scope });
  const cached = recommendationCache.get<RecommendationResult[]>(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  // Construire le profil utilisateur
  const userProfile = await buildUserMusicProfile(userId);

  // Si l'utilisateur n'a aucun intérêt, retourner des événements populaires
  if (
    userProfile.genres.size === 0 &&
    userProfile.styles.size === 0 &&
    userProfile.types.size === 0 &&
    userProfile.ambiances.size === 0
  ) {
    console.log(`[Recommendations] User ${userId} has no profile, returning popular events`);
    return await getPopularEvents(limit, scope);
  }

  // Construire les filtres de date
  const now = new Date();
  const dateFilter = buildDateFilter(scope, now);

  // Récupérer les événements futurs avec leurs tags
  // Inclure SCHEDULED et UPDATED (les deux sont des événements valides)
  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: dateFilter,
      ...(genre && {
        eventTags: {
          some: {
            category: 'genre',
            value: genre,
          },
        },
      }),
      ...(style && {
        eventTags: {
          some: {
            category: 'style',
            value: style,
          },
        },
      }),
    },
    include: {
      venue: true,
      organizer: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      eventTags: true,
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: {
      startAt: 'asc',
    },
    take: 200, // Récupérer plus d'événements pour filtrer par score
  });

  // Si aucun événement trouvé, retourner des événements populaires
  if (events.length === 0) {
    console.log(`[Recommendations] No events found for user ${userId}, returning popular events`);
    return await getPopularEvents(limit, scope);
  }

  // Calculer les scores pour chaque événement
  const scoredEvents: RecommendationResult[] = events
    .map((event) => {
      const score = calculateEventScore(event, userProfile);
      const reasons = generateReasons(event, userProfile, score);
      return {
        event,
        score,
        reasons,
      };
    })
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Si après filtrage il n'y a plus d'événements, retourner des événements populaires
  if (scoredEvents.length === 0) {
    console.log(`[Recommendations] No scored events above minScore ${minScore} for user ${userId}, returning popular events`);
    return await getPopularEvents(limit, scope);
  }

  // Mettre en cache (TTL 1 heure)
  recommendationCache.set(cacheKey, scoredEvents, 3600);

  return scoredEvents;
}

/**
 * Calcule un score de pertinence pour un événement (0-1)
 * Algorithme :
 * - Score de genre (40%) : Correspondance avec les genres préférés
 * - Score de style (30%) : Correspondance avec les styles préférés
 * - Score d'historique (20%) : Basé sur les favoris similaires
 * - Score de popularité (10%) : Nombre de favoris
 */
export function calculateEventScore(
  event: Event & {
    eventTags: Array<{ category: string; value: string }>;
    _count?: { favorites: number };
  },
  userProfile: UserMusicProfile
): number {
  let genreScore = 0;
  let styleScore = 0;
  let typeScore = 0;
  let ambianceScore = 0;
  let historyScore = 0;
  let popularityScore = 0;

  // Extraire les tags de l'événement
  const eventGenres = event.eventTags.filter((t) => t.category === 'genre').map((t) => t.value);
  const eventStyles = event.eventTags.filter((t) => t.category === 'style').map((t) => t.value);
  const eventTypes = event.eventTags.filter((t) => t.category === 'type').map((t) => t.value);
  const eventAmbiances = event.eventTags.filter((t) => t.category === 'ambiance').map((t) => t.value);

  // Score de genre (40%)
  if (eventGenres.length > 0 && userProfile.genres.size > 0) {
    let maxGenreMatch = 0;
    for (const genre of eventGenres) {
      const weight = userProfile.genres.get(genre) || 0;
      maxGenreMatch = Math.max(maxGenreMatch, weight);
    }
    genreScore = maxGenreMatch;
  }

  // Score de style (30%)
  if (eventStyles.length > 0 && userProfile.styles.size > 0) {
    let maxStyleMatch = 0;
    for (const style of eventStyles) {
      const weight = userProfile.styles.get(style) || 0;
      maxStyleMatch = Math.max(maxStyleMatch, weight);
    }
    styleScore = maxStyleMatch;
  }

  // Score de type (10% - bonus)
  if (eventTypes.length > 0 && userProfile.types.size > 0) {
    let maxTypeMatch = 0;
    for (const type of eventTypes) {
      const weight = userProfile.types.get(type) || 0;
      maxTypeMatch = Math.max(maxTypeMatch, weight);
    }
    typeScore = maxTypeMatch * 0.1; // Bonus de 10%
  }

  // Score d'ambiance (10% - bonus)
  if (eventAmbiances.length > 0 && userProfile.ambiances.size > 0) {
    let maxAmbianceMatch = 0;
    for (const ambiance of eventAmbiances) {
      const weight = userProfile.ambiances.get(ambiance) || 0;
      maxAmbianceMatch = Math.max(maxAmbianceMatch, weight);
    }
    ambianceScore = maxAmbianceMatch * 0.1; // Bonus de 10%
  }

  // Score d'historique (20%) : basé sur les favoris similaires
  if (userProfile.favoriteEventIds.length > 0) {
    // Si l'utilisateur a des favoris avec des genres/styles similaires
    const matchingGenres = eventGenres.filter((g) => userProfile.favoriteGenres.includes(g));
    const matchingStyles = eventStyles.filter((s) => userProfile.favoriteStyles.includes(s));
    
    if (matchingGenres.length > 0 || matchingStyles.length > 0) {
      historyScore = 0.2; // Bonus fixe si correspondance avec favoris
    }
  }

  // Score de popularité (10%)
  const favoriteCount = event._count?.favorites || 0;
  // Normaliser : 0 favoris = 0, 10+ favoris = 1
  popularityScore = Math.min(1, favoriteCount / 10) * 0.1;

  // Score final pondéré
  const finalScore =
    genreScore * 0.4 +
    styleScore * 0.3 +
    typeScore +
    ambianceScore +
    historyScore +
    popularityScore;

  return Math.min(1, finalScore); // S'assurer que le score est entre 0 et 1
}

/**
 * Génère les explications pour une recommandation
 */
export function generateReasons(
  event: Event & {
    eventTags: Array<{ category: string; value: string }>;
  },
  userProfile: UserMusicProfile,
  score: number
): string[] {
  const reasons: string[] = [];

  // Vérifier les genres correspondants
  const eventGenres = event.eventTags.filter((t) => t.category === 'genre').map((t) => t.value);
  for (const genre of eventGenres) {
    if (userProfile.genres.has(genre)) {
      const source = userProfile.sources.spotify ? 'Spotify' : 
                     userProfile.sources.appleMusic ? 'Apple Music' : 
                     userProfile.sources.manual ? 'vos préférences' : '';
      if (source) {
        reasons.push(`Vous aimez le ${genre} (${source})`);
      } else {
        reasons.push(`Vous aimez le ${genre}`);
      }
      break; // Une seule raison par genre
    }
  }

  // Vérifier les styles correspondants
  const eventStyles = event.eventTags.filter((t) => t.category === 'style').map((t) => t.value);
  for (const style of eventStyles) {
    if (userProfile.styles.has(style)) {
      reasons.push(`Style ${style} correspondant à vos goûts`);
      break; // Une seule raison par style
    }
  }

  // Vérifier les favoris similaires
  const matchingGenres = eventGenres.filter((g) => userProfile.favoriteGenres.includes(g));
  if (matchingGenres.length > 0) {
    reasons.push(`Similaire à vos événements favoris`);
  }

  // Si aucune raison spécifique, raison générique
  if (reasons.length === 0 && score > 0.3) {
    reasons.push('Événement qui pourrait vous plaire');
  }

  return reasons;
}

/**
 * Récupère des événements populaires (fallback si pas de profil)
 */
async function getPopularEvents(limit: number, scope: 'today' | 'weekend' | 'all') {
  const now = new Date();
  const dateFilter = buildDateFilter(scope, now);

  console.log(`[getPopularEvents] Fetching popular events, scope: ${scope}, limit: ${limit}`);

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: dateFilter,
    },
    include: {
      venue: true,
      organizer: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      eventTags: true,
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy: [
      {
        _count: {
          favorites: 'desc',
        },
      },
      {
        startAt: 'asc',
      },
    ],
    take: limit,
  });

  console.log(`[getPopularEvents] Found ${events.length} popular events`);

  return events.map((event) => ({
    event,
    score: 0.5, // Score neutre pour les événements populaires
    reasons: ['Événement populaire'],
  }));
}

/**
 * Construit un filtre de date selon le scope
 */
function buildDateFilter(scope: 'today' | 'weekend' | 'all', now: Date) {
  const montrealTZ = 'America/Montreal';
  const today = new Date(now.toLocaleString('en-US', { timeZone: montrealTZ }));
  today.setHours(0, 0, 0, 0);

  switch (scope) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        gte: today,
        lt: tomorrow,
      };
    }
    case 'weekend': {
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      const saturday = new Date(today);
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
      saturday.setHours(0, 0, 0, 0);
      const monday = new Date(saturday);
      monday.setDate(monday.getDate() + 2);
      monday.setHours(0, 0, 0, 0);
      return {
        gte: today,
        lt: monday,
      };
    }
    case 'all':
    default:
      return {
        gte: now,
      };
  }
}

/**
 * Récupère des recommandations par genre spécifique
 */
export async function getRecommendationsByGenre(
  userId: string,
  genre: string,
  limit: number = 10
): Promise<RecommendationResult[]> {
  return getPersonalizedRecommendations(userId, {
    genre,
    limit,
  });
}

/**
 * Récupère des recommandations par style spécifique
 */
export async function getRecommendationsByStyle(
  userId: string,
  style: string,
  limit: number = 10
): Promise<RecommendationResult[]> {
  return getPersonalizedRecommendations(userId, {
    style,
    limit,
  });
}

