/**
 * Connecteur Tourisme Montréal pour Pulse Montreal
 * Source officielle des événements touristiques de Montréal
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage } from '@prisma/client';

/**
 * Interface pour un événement brut de Tourisme Montréal
 */
interface TourismeMTLEvent {
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
}

/**
 * Connecteur pour Tourisme Montréal
 * Site officiel - utilisation respectueuse des données publiques
 */
export class TourismeMontrealaConnector extends BaseConnector {
  private readonly baseUrl = 'https://www.mtl.org';
  private readonly eventsUrl = 'https://www.mtl.org/fr/quoi-faire/';

  constructor() {
    super(EventSource.TOURISME_MONTREAL, undefined, 'https://www.mtl.org', 2); // 2 secondes entre requêtes
  }

  /**
   * Récupère les événements depuis une date donnée
   */
  async listUpdatedSince(since: Date, limit: number = 50): Promise<TourismeMTLEvent[]> {
    console.log('🏛️ Récupération des événements de Tourisme Montréal...');
    
    // ⚠️ TODO: Implémenter un vrai scraper ou API pour récupérer les événements depuis mtl.org
    // Pour l'instant, cette source retourne un tableau vide
    // Ne pas utiliser d'événements hardcodés/mockés
    
    console.warn('⚠️ Connecteur Tourisme Montréal non implémenté - aucun événement récupéré');
    
    return [];
  }

  /**
   * Mappe un événement Tourisme MTL vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: TourismeMTLEvent): Promise<UnifiedEvent> {
    const startDate = new Date(rawEvent.startDate);
    const endDate = rawEvent.endDate ? new Date(rawEvent.endDate) : this.estimateEndTime(startDate);

    // Géocoder l'adresse du venue
    const coordinates = await this.geocodeAddress(rawEvent.venueAddress || rawEvent.venue, 'Montréal');

    // Parser le prix
    const priceInfo = this.parsePrice(rawEvent.price || '');

    return {
      sourceId: rawEvent.id,
      source: EventSource.TOURISME_MONTREAL,
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
      language: EventLanguage.FR, // Tourisme MTL est bilingue mais principalement FR
      imageUrl: rawEvent.imageUrl,
      tags: this.generateTags(rawEvent.title, rawEvent.category, rawEvent.neighborhood),
      category: this.mapCategory(rawEvent.category),
      subcategory: rawEvent.category,
      accessibility: this.inferAccessibility(rawEvent.venue),
      ageRestriction: 'Tout public', // Activités touristiques généralement familiales
    };
  }

  /**
   * Mappe les catégories Tourisme MTL vers nos catégories
   */
  private mapCategory(mtlCategory: string): EventCategory {
    const category = mtlCategory.toLowerCase();
    
    if (category.includes('musée') || category.includes('art') || category.includes('patrimoine')) {
      return EventCategory.EXHIBITION;
    }
    if (category.includes('gastronomie') || category.includes('marché')) {
      return EventCategory.FOOD;
    }
    if (category.includes('nature') || category.includes('randonnée')) {
      return EventCategory.SPORT;
    }
    if (category.includes('croisière') || category.includes('tourisme')) {
      return EventCategory.COMMUNITY;
    }
    
    return EventCategory.COMMUNITY; // Par défaut pour les activités touristiques
  }

  /**
   * Estime l'heure de fin pour les activités touristiques
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
    const tags = ['tourisme montreal', 'montreal tourism', 'attraction', 'visite'];
    
    if (neighborhood) tags.push(neighborhood.toLowerCase());
    
    const text = `${title} ${category}`.toLowerCase();
    
    // Tags spécifiques au tourisme
    const tourismTags = [
      'vieux-montreal', 'old montreal', 'mont-royal', 'patrimoine', 'heritage',
      'musée', 'museum', 'gastronomie', 'food', 'croisière', 'cruise',
      'architecture', 'histoire', 'history', 'culture', 'nature', 'parc'
    ];
    
    tourismTags.forEach(tag => {
      if (text.includes(tag.replace('-', ' ')) || text.includes(tag)) {
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
    
    // Les institutions publiques sont généralement accessibles
    if (venueLower.includes('musée') || venueLower.includes('basilique') || 
        venueLower.includes('marché') || venueLower.includes('centre')) {
      accessibility.push('wheelchair_accessible');
    }
    
    return accessibility;
  }
}
