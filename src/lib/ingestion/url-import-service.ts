/**
 * Service d'import volontaire par URL
 * SPRINT B: Import assisté depuis Facebook, Eventbrite, lepointdevente, etc.
 * 
 * IMPORTANT: Pas de scraping automatique. L'utilisateur colle l'URL et remplit
 * manuellement les champs (ou on affiche un formulaire pré-rempli si possible).
 */

import { NormalizedEvent } from './types';
import { EventCategory } from '@prisma/client';

export interface URLImportResult {
  success: boolean;
  event?: Partial<NormalizedEvent>;
  error?: string;
  detectedPlatform?: string;
  suggestedFields?: {
    title?: string;
    description?: string;
    startDate?: string;
    venueName?: string;
    address?: string;
    imageUrl?: string;
  };
}

/**
 * Détecte la plateforme depuis une URL
 */
export function detectPlatform(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      return 'facebook';
    }
    if (hostname.includes('eventbrite.com')) {
      return 'eventbrite';
    }
    if (hostname.includes('lepointdevente.com')) {
      return 'lepointdevente';
    }
    if (hostname.includes('bandsintown.com')) {
      return 'bandsintown';
    }
    if (hostname.includes('ticketmaster.ca') || hostname.includes('ticketmaster.com')) {
      return 'ticketmaster';
    }

    return 'unknown';
  } catch {
    return null;
  }
}

/**
 * Analyse une URL et retourne des suggestions de champs
 * 
 * NOTE: Pour respecter les ToS, on ne fait PAS de fetch automatique.
 * On retourne seulement des suggestions basées sur l'URL elle-même.
 */
export async function analyzeURL(url: string): Promise<URLImportResult> {
  const platform = detectPlatform(url);

  if (!platform || platform === 'unknown') {
    return {
      success: false,
      error: 'Plateforme non reconnue ou URL invalide',
      detectedPlatform: platform || null,
    };
  }

  // Pour chaque plateforme, on peut extraire quelques infos depuis l'URL
  // mais on ne fait PAS de scraping automatique
  const suggestedFields: URLImportResult['suggestedFields'] = {};

  try {
    const urlObj = new URL(url);

    // Pour Facebook Events, l'URL contient parfois l'ID de l'événement
    if (platform === 'facebook') {
      // Format: https://www.facebook.com/events/123456789/
      const eventIdMatch = url.match(/\/events\/(\d+)/);
      if (eventIdMatch) {
        suggestedFields.title = 'Événement Facebook';
        // On ne peut pas récupérer plus d'infos sans API/scraping
      }
    }

    // Pour Eventbrite, l'URL contient parfois le nom de l'événement
    if (platform === 'eventbrite') {
      // Format: https://www.eventbrite.com/e/nom-evenement-tickets-123456789
      const pathParts = urlObj.pathname.split('/');
      const eventSlug = pathParts.find((part) => part && part !== 'e' && !part.startsWith('tickets-'));
      if (eventSlug) {
        suggestedFields.title = eventSlug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    return {
      success: true,
      detectedPlatform: platform,
      suggestedFields,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erreur lors de l'analyse de l'URL: ${error.message}`,
      detectedPlatform: platform,
    };
  }
}

/**
 * Valide et normalise un événement créé depuis une URL
 */
export function validateURLImportEvent(
  eventData: Partial<NormalizedEvent>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push('Le titre est requis');
  }

  if (!eventData.startDateTime) {
    errors.push('La date de début est requise');
  }

  if (!eventData.venueName || eventData.venueName.trim().length === 0) {
    errors.push('Le nom du lieu est requis');
  }

  if (!eventData.city || eventData.city.trim().length === 0) {
    errors.push('La ville est requise');
  }

  if (eventData.startDateTime && eventData.endDateTime) {
    if (eventData.endDateTime < eventData.startDateTime) {
      errors.push('La date de fin doit être après la date de début');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Crée un événement normalisé depuis des données d'import URL
 */
export function createEventFromURLImport(
  eventData: Partial<NormalizedEvent>,
  sourceUrl: string
): NormalizedEvent {
  const platform = detectPlatform(sourceUrl);

  return {
    externalId: `url-import-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    sourceUrl,
    title: eventData.title || 'Événement sans titre',
    description: eventData.description || '',
    startDateTime: eventData.startDateTime || new Date(),
    endDateTime: eventData.endDateTime,
    timezone: eventData.timezone || 'America/Montreal',
    venueName: eventData.venueName || 'Lieu à confirmer',
    address: eventData.address,
    city: eventData.city || 'Montréal',
    postalCode: eventData.postalCode,
    lat: eventData.lat,
    lon: eventData.lon,
    neighborhood: eventData.neighborhood,
    priceMin: eventData.priceMin,
    priceMax: eventData.priceMax,
    currency: eventData.currency || 'CAD',
    isFree: eventData.isFree,
    category: eventData.category || EventCategory.OTHER,
    subcategory: eventData.subcategory,
    tags: eventData.tags,
    language: eventData.language,
    ageRestriction: eventData.ageRestriction,
    accessibility: eventData.accessibility,
    imageUrl: eventData.imageUrl,
    ticketUrl: eventData.ticketUrl || sourceUrl,
    organizerName: eventData.organizerName,
    organizerUrl: eventData.organizerUrl,
    lineup: eventData.lineup,
    status: eventData.status || 'SCHEDULED',
  };
}

