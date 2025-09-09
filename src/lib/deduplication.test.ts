/**
 * Tests unitaires pour le système de déduplication - Pulse Montreal
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  stripAccents,
  computeGeoBucket,
  levenshteinDistance,
  stringSimilarity,
  calculateGeoDistance,
  generateFuzzyKey,
  computeSimilarityScore,
  findPotentialDuplicates,
  resolveDuplicate,
  type DeduplicationEvent,
} from './deduplication';

describe('Déduplication - Fonctions utilitaires', () => {
  describe('normalizeTitle', () => {
    it('devrait normaliser un titre avec accents', () => {
      expect(normalizeTitle('Festival de Musique Électronique')).toBe('festival de musique electronique');
    });

    it('devrait supprimer la ponctuation', () => {
      expect(normalizeTitle('Concert: Rock & Roll!')).toBe('concert rock roll');
    });

    it('devrait normaliser les espaces multiples', () => {
      expect(normalizeTitle('  Concert    de    Jazz  ')).toBe('concert de jazz');
    });
  });

  describe('stripAccents', () => {
    it('devrait supprimer les accents français', () => {
      expect(stripAccents('Théâtre Québécois')).toBe('Theatre Quebecois');
    });

    it('devrait conserver les caractères sans accents', () => {
      expect(stripAccents('Concert Rock')).toBe('Concert Rock');
    });
  });

  describe('computeGeoBucket', () => {
    it('devrait arrondir les coordonnées à 3 décimales', () => {
      expect(computeGeoBucket(45.508888, -73.567256)).toBe('45.509,-73.567');
    });

    it('devrait gérer les coordonnées négatives', () => {
      expect(computeGeoBucket(-45.123456, -73.987654)).toBe('-45.123,-73.988');
    });
  });

  describe('levenshteinDistance', () => {
    it('devrait calculer la distance pour des chaînes identiques', () => {
      expect(levenshteinDistance('concert', 'concert')).toBe(0);
    });

    it('devrait calculer la distance pour des chaînes différentes', () => {
      expect(levenshteinDistance('concert', 'concer')).toBe(1);
      expect(levenshteinDistance('jazz', 'rock')).toBe(4);
    });

    it('devrait gérer les chaînes vides', () => {
      expect(levenshteinDistance('', 'test')).toBe(4);
      expect(levenshteinDistance('test', '')).toBe(4);
    });
  });

  describe('stringSimilarity', () => {
    it('devrait retourner 1 pour des chaînes identiques', () => {
      expect(stringSimilarity('concert', 'concert')).toBe(1);
    });

    it('devrait retourner une valeur entre 0 et 1', () => {
      const similarity = stringSimilarity('concert jazz', 'concert rock');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('devrait retourner 1 pour des chaînes vides', () => {
      expect(stringSimilarity('', '')).toBe(1);
    });
  });

  describe('calculateGeoDistance', () => {
    it('devrait retourner 0 pour des coordonnées identiques', () => {
      expect(calculateGeoDistance(45.5088, -73.5673, 45.5088, -73.5673)).toBeCloseTo(0, 1);
    });

    it('devrait calculer la distance entre deux points de Montréal', () => {
      // Distance approximative entre Place des Arts et Vieux-Port
      const distance = calculateGeoDistance(45.5088, -73.5673, 45.5017, -73.5540);
      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(2);
    });
  });
});

describe('Déduplication - Logique métier', () => {
  const mockEvent1: DeduplicationEvent = {
    id: '1',
    title: 'Concert de Jazz au Club Soda',
    startAt: new Date('2024-06-15T20:00:00Z'),
    venue: {
      lat: 45.5108,
      lon: -73.5697,
      name: 'Club Soda',
    },
    source: 'INTERNAL',
    sourceId: 'internal-1',
  };

  const mockEvent2: DeduplicationEvent = {
    id: '2',
    title: 'Soirée Jazz - Club Soda',
    startAt: new Date('2024-06-15T20:00:00Z'),
    venue: {
      lat: 45.5108,
      lon: -73.5697,
      name: 'Club Soda',
    },
    source: 'EVENTBRITE',
    sourceId: 'eb-123',
  };

  const mockEvent3: DeduplicationEvent = {
    id: '3',
    title: 'Concert Rock au Métropolis',
    startAt: new Date('2024-06-15T21:00:00Z'),
    venue: {
      lat: 45.5115,
      lon: -73.5626,
      name: 'Métropolis',
    },
    source: 'INTERNAL',
    sourceId: 'internal-3',
  };

  describe('generateFuzzyKey', () => {
    it('devrait générer une clé cohérente', () => {
      const key = generateFuzzyKey(mockEvent1);
      expect(key).toContain('concert de jazz au club soda');
      expect(key).toContain('2024-06-15');
      expect(key).toContain('45.511,-73.57');
    });

    it('devrait gérer les événements sans venue', () => {
      const eventWithoutVenue = { ...mockEvent1, venue: null };
      const key = generateFuzzyKey(eventWithoutVenue);
      expect(key).toContain('unknown');
    });
  });

  describe('computeSimilarityScore', () => {
    it('devrait donner un score élevé pour des événements similaires', () => {
      const score = computeSimilarityScore(mockEvent1, mockEvent2);
      expect(score).toBeGreaterThan(0.8);
    });

    it('devrait donner un score faible pour des événements différents', () => {
      const score = computeSimilarityScore(mockEvent1, mockEvent3);
      expect(score).toBeLessThan(0.5);
    });

    it('devrait gérer les événements sans venue', () => {
      const event1WithoutVenue = { ...mockEvent1, venue: null };
      const event2WithoutVenue = { ...mockEvent2, venue: null };
      const score = computeSimilarityScore(event1WithoutVenue, event2WithoutVenue);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('findPotentialDuplicates', () => {
    it('devrait trouver des doublons potentiels', async () => {
      const existingEvents = [mockEvent2, mockEvent3];
      const duplicates = await findPotentialDuplicates(mockEvent1, existingEvents);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].event.id).toBe('2');
      expect(duplicates[0].score).toBeGreaterThan(0.82);
    });

    it('ne devrait pas trouver de doublons pour des événements différents', async () => {
      const differentEvent: DeduplicationEvent = {
        id: '4',
        title: 'Exposition Art Moderne',
        startAt: new Date('2024-07-01T14:00:00Z'),
        venue: {
          lat: 45.4986,
          lon: -73.5794,
          name: 'Musée des beaux-arts',
        },
        source: 'INTERNAL',
        sourceId: 'internal-4',
      };

      const existingEvents = [mockEvent2, mockEvent3];
      const duplicates = await findPotentialDuplicates(differentEvent, existingEvents);
      
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('resolveDuplicate', () => {
    it('devrait prioriser les sources internes', () => {
      const resolution = resolveDuplicate(mockEvent1, mockEvent2);
      expect(resolution).toBe('replace');
    });

    it('devrait garder les sources internes existantes', () => {
      const resolution = resolveDuplicate(mockEvent2, mockEvent1);
      expect(resolution).toBe('keep_existing');
    });

    it('devrait remplacer pour la même source', () => {
      const sameSourceEvent = { ...mockEvent1, id: '5', sourceId: 'internal-5' };
      const resolution = resolveDuplicate(sameSourceEvent, mockEvent1);
      expect(resolution).toBe('replace');
    });
  });
});
