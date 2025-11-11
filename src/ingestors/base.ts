/**
 * Interface de base pour tous les connecteurs d'ingestion - Pulse Montreal
 * Définit le contrat que chaque connecteur doit respecter
 */

import { EventCategory, EventLanguage, EventSource, EventStatus } from '@prisma/client';

/**
 * Interface pour un événement unifié après mapping
 */
export interface UnifiedEvent {
  // Identifiants
  sourceId: string;
  source: EventSource;
  
  // Informations de base
  title: string;
  description: string;
  startAt: Date;
  endAt?: Date;
  timezone: string;
  status?: EventStatus;
  
  // Lieu
  venue?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    lat: number;
    lon: number;
    neighborhood?: string;
    phone?: string;
    website?: string;
  };
  
  // Détails
  url?: string;
  priceMin?: number; // en cents
  priceMax?: number; // en cents
  currency: string;
  language: EventLanguage;
  imageUrl?: string;
  tags: string[];
  category: EventCategory;
  subcategory?: string;
  accessibility: string[];
  ageRestriction?: string;
  
  // Métadonnées
  lastModified?: Date;
}

/**
 * Statistiques d'import pour un connecteur
 */
export interface ImportStats {
  totalFetched: number;
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  totalCancelled: number;
  totalSkipped: number;
  totalErrors: number;
  errors: string[];
  duration: number; // en millisecondes
}

/**
 * Interface de base pour tous les connecteurs
 */
export abstract class BaseConnector {
  protected source: EventSource;
  protected apiKey?: string;
  protected baseUrl: string;
  protected rateLimit: number; // requêtes par seconde
  
  constructor(source: EventSource, apiKey?: string, baseUrl: string = '', rateLimit: number = 1) {
    this.source = source;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.rateLimit = rateLimit;
  }

  /**
   * Récupère les événements nouveaux ou modifiés depuis une date
   */
  abstract listUpdatedSince(since: Date, limit?: number): Promise<any[]>;

  /**
   * Mappe un événement brut vers le format unifié
   */
  abstract mapToUnifiedEvent(rawEvent: any): Promise<UnifiedEvent>;

  /**
   * Valide qu'un événement est valide pour l'import
   */
  protected validateEvent(event: UnifiedEvent): boolean {
    return !!(
      event.title &&
      event.description &&
      event.startAt &&
      event.source &&
      event.sourceId
    );
  }

  /**
   * Applique un délai pour respecter les limites de taux
   */
  protected async rateLimit(): Promise<void> {
    const delay = 1000 / this.rateLimit;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Géocode une adresse en utilisant Nominatim (OpenStreetMap)
   */
  protected async geocodeAddress(address: string, city: string = 'Montréal'): Promise<{ lat: number; lon: number } | null> {
    try {
      const query = encodeURIComponent(`${address}, ${city}, QC, Canada`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=ca`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Pulse-Montreal/1.0 (contact@pulse-montreal.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const results = await response.json();
      
      if (results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return null;
    }
  }

  /**
   * Détermine la catégorie d'un événement basé sur des mots-clés
   */
  protected categorizeEvent(title: string, description: string, tags: string[] = []): EventCategory {
    const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

    // Musique
    const musicKeywords = [
      'concert', 'musique', 'music', 'band', 'groupe', 'festival', 'dj',
      'jazz', 'rock', 'pop', 'classical', 'reggae', 'hip hop', 'electronic',
      'techno', 'house', 'folk', 'country', 'blues', 'metal', 'punk',
      'orchestra', 'symphony', 'choir', 'singing', 'chant'
    ];

    // Théâtre
    const theatreKeywords = [
      'théâtre', 'theater', 'theatre', 'pièce', 'play', 'spectacle',
      'comédie', 'comedy', 'drame', 'drama', 'improvisation', 'improv',
      'one man show', 'monologue', 'cabaret'
    ];

    // Art et expositions
    const artKeywords = [
      'exposition', 'exhibition', 'galerie', 'gallery', 'art', 'artiste',
      'peinture', 'painting', 'sculpture', 'photo', 'photography',
      'vernissage', 'museum', 'musée', 'culture', 'installation'
    ];

    // Famille
    const familyKeywords = [
      'famille', 'family', 'enfant', 'children', 'kids', 'bébé', 'baby',
      'parent', 'tout-petit', 'animation', 'atelier enfant', 'spectacle enfant'
    ];

    // Sport
    const sportKeywords = [
      'sport', 'hockey', 'football', 'soccer', 'basketball', 'tennis',
      'course', 'running', 'marathon', 'triathlon', 'vélo', 'cycling',
      'natation', 'swimming', 'gym', 'fitness', 'yoga', 'match', 'game'
    ];

    // Vie nocturne
    const nightlifeKeywords = [
      'nightclub', 'club', 'bar', 'pub', 'cocktail', 'party', 'soirée',
      'night', 'nocturne', 'dance', 'danse', 'rave', 'after', 'lounge'
    ];

    // Éducation
    const educationKeywords = [
      'conférence', 'conference', 'workshop', 'atelier', 'formation',
      'course', 'class', 'seminar', 'séminaire', 'lecture', 'masterclass',
      'apprentissage', 'learning', 'école', 'university', 'université'
    ];

    // Communauté
    const communityKeywords = [
      'communauté', 'community', 'bénévolat', 'volunteer', 'charity',
      'charité', 'fundraiser', 'collecte', 'social', 'networking',
      'meetup', 'rencontre', 'discussion', 'débat'
    ];

    if (musicKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.MUSIC;
    }
    if (theatreKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.THEATRE;
    }
    if (artKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.EXHIBITION;
    }
    if (familyKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.FAMILY;
    }
    if (sportKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.SPORT;
    }
    if (nightlifeKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.NIGHTLIFE;
    }
    if (educationKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.EDUCATION;
    }
    if (communityKeywords.some(keyword => text.includes(keyword))) {
      return EventCategory.COMMUNITY;
    }

    return EventCategory.OTHER;
  }

  /**
   * Extrait des tags automatiques basés sur le contenu
   */
  protected extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    // Tags de prix
    if (text.includes('gratuit') || text.includes('free') || text.includes('$0')) {
      tags.push('gratuit');
    }
    if (text.includes('donation')) {
      tags.push('donation');
    }

    // Tags d'accessibilité
    if (text.includes('accessible') || text.includes('wheelchair')) {
      tags.push('accessible');
    }
    if (text.includes('sign language') || text.includes('langue des signes')) {
      tags.push('langue-des-signes');
    }

    // Tags d'âge
    if (text.includes('18+') || text.includes('adult only')) {
      tags.push('18+');
    }
    if (text.includes('kids') || text.includes('enfants') || text.includes('famille')) {
      tags.push('famille');
    }

    // Tags de lieu
    if (text.includes('outdoor') || text.includes('plein air') || text.includes('extérieur')) {
      tags.push('plein-air');
    }
    if (text.includes('indoor') || text.includes('intérieur')) {
      tags.push('intérieur');
    }

    return tags;
  }

  /**
   * Parse le prix depuis une chaîne de caractères
   */
  protected parsePrice(priceString: string): { min?: number; max?: number; currency: string } {
    if (!priceString) {
      return { currency: 'CAD' };
    }

    const text = priceString.toLowerCase();
    
    // Gratuit
    if (text.includes('free') || text.includes('gratuit') || text === '$0') {
      return { min: 0, max: 0, currency: 'CAD' };
    }

    // Extraction des prix avec regex
    const priceRegex = /\$?(\d+(?:\.\d{2})?)/g;
    const matches = Array.from(text.matchAll(priceRegex));
    
    if (matches.length === 0) {
      return { currency: 'CAD' };
    }

    const prices = matches.map(match => Math.round(parseFloat(match[1]) * 100)); // Convertir en cents
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: 'CAD',
    };
  }

  /**
   * Détermine la langue d'un événement
   */
  protected detectLanguage(title: string, description: string): EventLanguage {
    const text = `${title} ${description}`.toLowerCase();
    
    // Mots français communs
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'avec', 'pour', 'dans', 'sur', 'par'];
    // Mots anglais communs
    const englishWords = ['the', 'and', 'with', 'for', 'in', 'on', 'at', 'by', 'from', 'to'];
    
    const frenchCount = frenchWords.filter(word => text.includes(` ${word} `)).length;
    const englishCount = englishWords.filter(word => text.includes(` ${word} `)).length;
    
    if (frenchCount > englishCount) {
      return EventLanguage.FR;
    } else if (englishCount > frenchCount) {
      return EventLanguage.EN;
    }
    
    return EventLanguage.BOTH;
  }
}
