/**
 * Adaptateur: Convertit les filtres AI en query params pour /api/events
 * SPRINT 1: Bridge entre AI filters et API events
 */

import { SearchFilters } from './searchToFilters';

export interface EventQueryParams {
  startAt?: string;
  endAt?: string;
  categories?: string[];
  tags?: string[];
  isFree?: boolean;
  ageRestriction?: string;
  language?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}

/**
 * Convertit SearchFilters en EventQueryParams pour /api/events
 */
export function filtersToEventQueryParams(
  filters: SearchFilters,
  userLat?: number,
  userLng?: number,
  options: { limit?: number; offset?: number } = {}
): EventQueryParams {
  const params: EventQueryParams = {
    ...options,
  };

  // Time scope -> dates
  const now = new Date();
  const montrealTZ = 'America/Montreal';

  switch (filters.timeScope) {
    case 'today': {
      const today = new Date(now.toLocaleString('en-US', { timeZone: montrealTZ }));
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.startAt = today.toISOString();
      params.endAt = tomorrow.toISOString();
      break;
    }
    case 'weekend': {
      const today = new Date(now.toLocaleString('en-US', { timeZone: montrealTZ }));
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      const saturday = new Date(today);
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
      const monday = new Date(saturday);
      monday.setDate(monday.getDate() + 2);
      params.startAt = today.toISOString();
      params.endAt = monday.toISOString();
      break;
    }
    case 'dateRange': {
      if (filters.rangeStart) params.startAt = filters.rangeStart;
      if (filters.rangeEnd) params.endAt = filters.rangeEnd;
      break;
    }
    case 'all':
    default:
      // Pas de filtre de date
      break;
  }

  // Catégories
  if (filters.categories && filters.categories.length > 0) {
    // Mapper vers les catégories Prisma
    const categoryMap: Record<string, string> = {
      music: 'MUSIC',
      culture: 'THEATRE',
      family: 'FAMILY',
      sports: 'SPORT',
      exhibition: 'EXHIBITION',
      community: 'COMMUNITY',
      education: 'EDUCATION',
      nightlife: 'NIGHTLIFE',
      other: 'OTHER',
    };
    params.categories = filters.categories.map((c) => categoryMap[c] || 'OTHER');
  }

  // Tags (genres musicaux + autres tags)
  const tags: string[] = [];
  if (filters.musicGenres) {
    tags.push(...filters.musicGenres);
  }
  if (filters.tags) {
    tags.push(...filters.tags);
  }
  if (tags.length > 0) {
    params.tags = tags;
  }

  // Autres filtres
  if (filters.isFree !== undefined) {
    params.isFree = filters.isFree;
  }

  if (filters.ageRestriction && filters.ageRestriction !== 'all') {
    params.ageRestriction = filters.ageRestriction;
  }

  if (filters.language) {
    params.language = filters.language.toUpperCase();
  }

  // Géolocalisation
  if (filters.radiusKm && userLat && userLng) {
    params.lat = userLat;
    params.lng = userLng;
    params.radiusKm = filters.radiusKm;
  }

  return params;
}

