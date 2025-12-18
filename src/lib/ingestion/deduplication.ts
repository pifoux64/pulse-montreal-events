/**
 * Système de déduplication multi-sources
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import { prisma } from '@/lib/prisma';
import { NormalizedEvent, DeduplicationKeys } from './types';
import { EventSource } from '@prisma/client';

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingEventId?: string;
  confidence: number; // 0-1, confiance dans la correspondance
  matchReason?: string;
}

/**
 * Génère les clés de déduplication pour un événement
 */
export function generateDeduplicationKeys(event: NormalizedEvent): DeduplicationKeys {
  const normalizedTitle = normalizeTitle(event.title);
  const dateKey = getDateKey(event.startDateTime);
  const venueKey = normalizeVenueName(event.venueName) + '|' + (event.city || 'Montréal');

  return {
    normalizedTitle,
    dateKey,
    venueKey,
    coordinates: event.lat && event.lon ? { lat: event.lat, lon: event.lon } : undefined,
    lineup: event.lineup?.map((artist) => normalizeTitle(artist)),
  };
}

/**
 * Normalise un titre pour la déduplication
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim();
}

/**
 * Normalise un nom de venue
 */
function normalizeVenueName(venueName: string): string {
  return normalizeTitle(venueName);
}

/**
 * Extrait une clé de date (YYYY-MM-DD)
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcule la distance entre deux points (en mètres)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Vérifie si un événement est un doublon d'un événement existant
 */
export async function checkDuplicate(
  event: NormalizedEvent,
  source: EventSource,
  sourceId?: string
): Promise<DeduplicationResult> {
  const keys = generateDeduplicationKeys(event);

  // 1. Recherche exacte par source + externalId (si disponible)
  if (event.externalId && sourceId) {
    const exactMatch = await prisma.event.findFirst({
      where: {
        source,
        sourceId: event.externalId,
      },
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        existingEventId: exactMatch.id,
        confidence: 1.0,
        matchReason: 'exact_source_match',
      };
    }
  }

  // 2. Recherche par clés de déduplication (titre + date + venue)
  const candidates = await prisma.event.findMany({
    where: {
      title: {
        // Recherche approximative par titre (similaire)
        contains: event.title.substring(0, 20), // Premiers 20 caractères
        mode: 'insensitive',
      },
      startAt: {
        gte: new Date(event.startDateTime.getTime() - 24 * 60 * 60 * 1000), // -1 jour
        lte: new Date(event.startDateTime.getTime() + 24 * 60 * 60 * 1000), // +1 jour
      },
    },
    include: {
      venue: true,
      eventSources: true,
    },
    take: 10, // Limiter les candidats
  });

  // 3. Calculer la similarité pour chaque candidat
  let bestMatch: { eventId: string; confidence: number; reason: string } | null = null;

  for (const candidate of candidates) {
    const candidateKeys = generateDeduplicationKeys({
      title: candidate.title,
      startDateTime: candidate.startAt,
      venueName: candidate.venue?.name || '',
      city: candidate.venue?.city || 'Montréal',
      lat: candidate.venue?.lat,
      lon: candidate.venue?.lon,
    } as NormalizedEvent);

    let confidence = 0;
    const reasons: string[] = [];

    // Correspondance de titre (40%)
    if (candidateKeys.normalizedTitle === keys.normalizedTitle) {
      confidence += 0.4;
      reasons.push('titre_identique');
    } else {
      // Similarité partielle (Levenshtein simplifié)
      const similarity = calculateStringSimilarity(
        candidateKeys.normalizedTitle,
        keys.normalizedTitle
      );
      if (similarity > 0.8) {
        confidence += 0.3;
        reasons.push('titre_similaire');
      }
    }

    // Correspondance de date (20%)
    if (candidateKeys.dateKey === keys.dateKey) {
      confidence += 0.2;
      reasons.push('date_identique');
    }

    // Correspondance de venue (20%)
    if (candidateKeys.venueKey === keys.venueKey) {
      confidence += 0.2;
      reasons.push('venue_identique');
    }

    // Correspondance géographique (15%) - si coordonnées disponibles
    if (
      keys.coordinates &&
      candidate.venue?.lat &&
      candidate.venue?.lon
    ) {
      const distance = calculateDistance(
        keys.coordinates.lat,
        keys.coordinates.lon,
        candidate.venue.lat,
        candidate.venue.lon
      );
      if (distance < 100) {
        // Moins de 100 mètres
        confidence += 0.15;
        reasons.push('proximite_geographique');
      } else if (distance < 500) {
        // Moins de 500 mètres
        confidence += 0.1;
        reasons.push('proximite_geographique_moderee');
      }
    }

    // Correspondance de lineup (5%) - pour musique
    if (keys.lineup && keys.lineup.length > 0) {
      // Vérifier si les artistes sont mentionnés dans le titre ou la description
      const candidateText = (
        candidate.title + ' ' + candidate.description
      ).toLowerCase();
      const matchingArtists = keys.lineup.filter((artist) =>
        candidateText.includes(artist.toLowerCase())
      );
      if (matchingArtists.length > 0) {
        confidence += 0.05 * (matchingArtists.length / keys.lineup.length);
        reasons.push('lineup_partiel');
      }
    }

    // Si la confiance est élevée, c'est probablement un doublon
    if (confidence >= 0.7 && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = {
        eventId: candidate.id,
        confidence,
        reason: reasons.join('+'),
      };
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      existingEventId: bestMatch.eventId,
      confidence: bestMatch.confidence,
      matchReason: bestMatch.reason,
    };
  }

  return {
    isDuplicate: false,
    confidence: 0,
  };
}

/**
 * Calcule la similarité entre deux chaînes (simplifié)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  // Distance de Levenshtein simplifiée
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

