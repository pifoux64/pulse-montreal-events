/**
 * Connecteur AllEvents pour Pulse Montreal
 * Source d'agrégation d'événements montréalais
 * 
 * AllEvents (https://allevents.in/montreal) est une plateforme qui agrège
 * des événements de diverses sources à Montréal.
 * 
 * NOTE: AllEvents ne semble pas avoir d'API publique officielle.
 * Ce connecteur peut être étendu pour:
 * - Scraping du site (avec respect des robots.txt et rate limiting)
 * - Contact avec AllEvents pour un partenariat API
 * - Utilisation d'un flux RSS si disponible
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage } from '@prisma/client';
import * as cheerio from 'cheerio';

/**
 * Interface pour un événement brut d'AllEvents
 */
interface AllEventsEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress?: string;
  category: string;
  price?: string;
  url: string;
  imageUrl?: string;
  neighborhood?: string;
  organizer?: string;
  interested?: number;
}

/**
 * Connecteur pour AllEvents
 * Plateforme d'agrégation d'événements - utilisation respectueuse des données publiques
 */
export class AllEventsConnector extends BaseConnector {
  private readonly baseUrl = 'https://allevents.in';
  private readonly eventsUrl = 'https://allevents.in/montreal';

  constructor() {
    super(EventSource.ALLEVENTS, undefined, 'https://allevents.in', 2); // 2 secondes entre requêtes
  }

  /**
   * Récupère les événements depuis une date donnée
   * 
   * TODO: Implémenter le scraping réel du site si nécessaire
   * Pour l'instant, utilise des données d'exemple basées sur les types d'événements
   * que AllEvents liste généralement (concerts, festivals, théâtre, etc.)
   */
  async listUpdatedSince(since: Date, limit: number = 50): Promise<AllEventsEvent[]> {
    console.log('📅 Récupération des événements d\'AllEvents...');
    
    // ⚠️ TODO: Implémenter un vrai scraper ou API pour récupérer les événements depuis allevents.in
    // Pour l'instant, cette source retourne un tableau vide
    // Ne pas utiliser d'événements hardcodés/mockés
    
    console.warn('⚠️ Connecteur AllEvents non implémenté - aucun événement récupéré');
    
    return [];
  }


  /**
   * Mappe un événement AllEvents vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: AllEventsEvent): Promise<UnifiedEvent> {
    const startDate = new Date(rawEvent.startDate);
    const endDate = rawEvent.endDate ? new Date(rawEvent.endDate) : this.estimateEndTime(startDate);

    // Géocoder l'adresse du venue
    const coordinates = await this.geocodeAddress(rawEvent.venueAddress || rawEvent.venue, 'Montréal');

    // Parser le prix
    const priceInfo = this.parsePrice(rawEvent.price || '');

    return {
      sourceId: rawEvent.id,
      source: EventSource.ALLEVENTS,
      title: rawEvent.title,
      description: rawEvent.description,
      startAt: startDate,
      endAt: endDate,
      timezone: 'America/Montreal',
      venue: {
        name: rawEvent.venue,
        address: rawEvent.venueAddress || rawEvent.venue,
        city: 'Montréal',
        postalCode: '',
        lat: coordinates?.lat || 45.5088,
        lon: coordinates?.lon || -73.5673,
        neighborhood: rawEvent.neighborhood,
      },
      url: rawEvent.url,
      priceMin: priceInfo.min,
      priceMax: priceInfo.max,
      currency: priceInfo.currency,
      language: this.inferLanguage(rawEvent.title, rawEvent.description),
      imageUrl: rawEvent.imageUrl,
      tags: this.generateTags(rawEvent.title, rawEvent.category, rawEvent.neighborhood),
      category: this.mapCategory(rawEvent.category),
      subcategory: rawEvent.category,
      accessibility: this.inferAccessibility(rawEvent.venue),
      ageRestriction: this.inferAgeRestriction(rawEvent.category),
    };
  }

  /**
   * Mappe les catégories AllEvents vers nos catégories
   */
  private mapCategory(alleventsCategory: string): EventCategory {
    const category = alleventsCategory.toLowerCase();
    
    if (category.includes('music') || category.includes('concert')) {
      return EventCategory.MUSIC;
    }
    if (category.includes('theatre') || category.includes('théâtre')) {
      return EventCategory.THEATER;
    }
    if (category.includes('dance') || category.includes('danse')) {
      return EventCategory.DANCE;
    }
    if (category.includes('comedy') || category.includes('comédie')) {
      return EventCategory.SHOW;
    }
    if (category.includes('festival')) {
      return EventCategory.FESTIVAL;
    }
    if (category.includes('exhibition') || category.includes('exposition')) {
      return EventCategory.EXHIBITION;
    }
    if (category.includes('performance')) {
      return EventCategory.SHOW;
    }
    if (category.includes('meetup') || category.includes('workshop')) {
      return EventCategory.COMMUNITY;
    }
    if (category.includes('party') || category.includes('nightlife')) {
      return EventCategory.SHOW;
    }
    if (category.includes('food') || category.includes('drink')) {
      return EventCategory.FOOD;
    }
    
    return EventCategory.SHOW; // Par défaut
  }

  /**
   * Infère la langue selon le contenu
   */
  private inferLanguage(title: string, description: string): EventLanguage {
    const text = `${title} ${description}`.toLowerCase();
    
    // Mots français communs
    const frenchWords = ['montreal', 'montréal', 'théâtre', 'spectacle', 'festival', 'concert', 'musique'];
    const frenchCount = frenchWords.filter(word => text.includes(word)).length;
    
    // Mots anglais communs
    const englishWords = ['the', 'and', 'with', 'for', 'theatre', 'show', 'event'];
    const englishCount = englishWords.filter(word => text.includes(word)).length;
    
    // Si plus de mots français, c'est probablement FR, sinon EN
    return frenchCount > englishCount ? EventLanguage.FR : EventLanguage.EN;
  }

  /**
   * Estime l'heure de fin pour les événements
   */
  private estimateEndTime(startTime: Date): Date {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // 2 heures par défaut
    return endTime;
  }

  /**
   * Génère des tags automatiques
   */
  private generateTags(title: string, category: string, neighborhood?: string): string[] {
    const tags = ['allevents', 'montreal', 'event'];
    
    if (neighborhood) tags.push(neighborhood.toLowerCase());
    
    const text = `${title} ${category}`.toLowerCase();
    
    // Tags spécifiques
    const commonTags = [
      'concert', 'music', 'festival', 'theatre', 'comedy', 'dance',
      'performance', 'meetup', 'workshop', 'exhibition', 'party',
      'nightlife', 'food', 'drink', 'montreal', 'quebec'
    ];
    
    commonTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return [...new Set(tags)]; // Supprimer les doublons
  }

  /**
   * Infère l'accessibilité selon le type de venue
   */
  private inferAccessibility(venue: string): string[] {
    const accessibility = [];
    const venueLower = venue.toLowerCase();
    
    // Les grandes salles sont généralement accessibles
    if (venueLower.includes('theatre') || venueLower.includes('théâtre') || 
        venueLower.includes('centre') || venueLower.includes('center') ||
        venueLower.includes('salle') || venueLower.includes('hall')) {
      accessibility.push('wheelchair_accessible');
    }
    
    return accessibility;
  }

  /**
   * Infère les restrictions d'âge selon la catégorie
   */
  private inferAgeRestriction(category: string): string {
    const cat = category.toLowerCase();
    
    if (cat.includes('party') || cat.includes('nightlife') || cat.includes('bar')) {
      return '18+'; // Événements de nuit généralement 18+
    }
    if (cat.includes('comedy') && cat.includes('adult')) {
      return '18+';
    }
    
    return 'Tout public'; // Par défaut
  }

  /**
   * TODO: Implémenter le scraping réel du site allevents.in/montreal
   * 
   * Exemple de structure pour un scraping:
   * 
   * async listUpdatedSince(since: Date, limit: number = 50): Promise<AllEventsEvent[]> {
   *   try {
   *     const response = await fetch(this.eventsUrl, {
   *       headers: {
   *         'User-Agent': 'Pulse Montreal Bot 1.0',
   *       },
   *     });
   *     
   *     if (!response.ok) {
   *       throw new Error(`HTTP ${response.status}`);
   *     }
   *     
   *     const html = await response.text();
   *     const $ = cheerio.load(html);
   *     
   *     const events: AllEventsEvent[] = [];
   *     
   *     // Parser le HTML pour extraire les événements
   *     $('.event-card, .event-item').each((i, elem) => {
   *       const event = {
   *         id: $(elem).attr('data-id') || `allevents_${i}`,
   *         title: $(elem).find('.event-title, h3').text().trim(),
   *         description: $(elem).find('.event-description, .description').text().trim(),
   *         startDate: $(elem).find('.event-date, .date').attr('data-date') || '',
   *         venue: $(elem).find('.venue-name, .location').text().trim(),
   *         // ... extraire autres champs
   *       };
   *       events.push(event);
   *     });
   *     
   *     return events.filter(e => new Date(e.startDate) > since).slice(0, limit);
   *   } catch (error) {
   *     console.error('Erreur lors du scraping AllEvents:', error);
   *     return []; // Retourner vide en cas d'erreur
   *   }
   * }
   */
}


