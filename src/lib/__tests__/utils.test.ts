import { describe, it, expect } from 'vitest';
import { 
  normalizeTitle, 
  stripAccents, 
  computeGeoBucket, 
  computeScore,
  calculateDistance 
} from '../utils';

describe('Utils Functions', () => {
  describe('normalizeTitle', () => {
    it('should normalize title by removing accents and converting to lowercase', () => {
      expect(normalizeTitle('Café de Montréal')).toBe('cafe de montreal');
      expect(normalizeTitle('Théâtre du Nouveau Monde')).toBe('theatre du nouveau monde');
      expect(normalizeTitle('Événement Spécial')).toBe('evenement special');
    });

    it('should handle empty strings', () => {
      expect(normalizeTitle('')).toBe('');
    });

    it('should remove extra spaces', () => {
      expect(normalizeTitle('  Multiple   Spaces  ')).toBe('multiple spaces');
    });
  });

  describe('stripAccents', () => {
    it('should remove French accents', () => {
      expect(stripAccents('àáâãäåæçèéêëìíîïñòóôõöøùúûüý')).toBe('aaaaaaeceeeeiiiinoooooouuuuy');
      expect(stripAccents('ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝ')).toBe('AAAAAAECEEEEIIIINOOOOOOUUUUY');
    });

    it('should preserve non-accented characters', () => {
      expect(stripAccents('Hello World 123')).toBe('Hello World 123');
    });
  });

  describe('computeGeoBucket', () => {
    it('should round coordinates to 3 decimal places', () => {
      expect(computeGeoBucket(45.5088123, -73.5673456)).toBe('45.509,-73.567');
      expect(computeGeoBucket(45.500, -73.600)).toBe('45.500,-73.600');
    });

    it('should handle edge cases', () => {
      expect(computeGeoBucket(0, 0)).toBe('0.000,0.000');
      expect(computeGeoBucket(-45.5088, 73.5673)).toBe('-45.509,73.567');
    });
  });

  describe('computeScore', () => {
    it('should return high score for identical events', () => {
      const event1 = {
        title: 'Jazz Festival Montreal',
        venue: { name: 'Place des Arts', lat: 45.5088, lng: -73.5673 },
        startAt: '2025-07-01T20:00:00Z'
      };
      const event2 = { ...event1 };
      
      expect(computeScore(event1, event2)).toBeGreaterThan(0.9);
    });

    it('should return low score for different events', () => {
      const event1 = {
        title: 'Jazz Festival',
        venue: { name: 'Place des Arts', lat: 45.5088, lng: -73.5673 },
        startAt: '2025-07-01T20:00:00Z'
      };
      const event2 = {
        title: 'Rock Concert',
        venue: { name: 'Olympic Stadium', lat: 45.5579, lng: -73.5514 },
        startAt: '2025-08-01T20:00:00Z'
      };
      
      expect(computeScore(event1, event2)).toBeLessThan(0.3);
    });

    it('should handle missing venue information', () => {
      const event1 = {
        title: 'Jazz Festival',
        venue: null,
        startAt: '2025-07-01T20:00:00Z'
      };
      const event2 = {
        title: 'Jazz Festival',
        venue: { name: 'Place des Arts', lat: 45.5088, lng: -73.5673 },
        startAt: '2025-07-01T20:00:00Z'
      };
      
      const score = computeScore(event1, event2);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Montreal locations', () => {
      // Distance between Place des Arts and Olympic Stadium (approximately 6.5 km)
      const distance = calculateDistance(45.5088, -73.5673, 45.5579, -73.5514);
      expect(distance).toBeGreaterThan(6);
      expect(distance).toBeLessThan(7);
    });

    it('should return 0 for same coordinates', () => {
      expect(calculateDistance(45.5088, -73.5673, 45.5088, -73.5673)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculateDistance(0, 0, 0, 0)).toBe(0);
      expect(calculateDistance(90, 180, -90, -180)).toBeGreaterThan(0);
    });
  });
});
