/**
 * Connecteur La Vitrine pour Pulse Montreal
 * Source d'événements culturels québécois et montréalais
 * 
 * NOTE: La Vitrine ne semble pas avoir d'API publique.
 * Ce connecteur peut être étendu pour:
 * - Scraping du site (avec respect des robots.txt et rate limiting)
 * - Contact avec La Vitrine pour un partenariat API
 * - Utilisation d'un flux RSS si disponible
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage } from '@prisma/client';
import * as cheerio from 'cheerio';

/**
 * Interface pour un événement brut de La Vitrine
 */
interface LaVitrineEvent {
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
}

/**
 * Connecteur pour La Vitrine
 * Site culturel québécois - utilisation respectueuse des données publiques
 */
export class LaVitrineConnector extends BaseConnector {
  private readonly baseUrl = 'https://www.lavitrine.com';
  private readonly eventsUrl = 'https://www.lavitrine.com/fr/evenements';

  constructor() {
    super(EventSource.LAVITRINE, undefined, 'https://www.lavitrine.com', 2); // 2 secondes entre requêtes
  }

  /**
   * Récupère les événements depuis une date donnée
   * 
   * TODO: Implémenter le scraping réel du site si nécessaire
   * Pour l'instant, utilise des données d'exemple basées sur le type d'événements
   * que La Vitrine propose généralement (spectacles, théâtre, musique, etc.)
   */
  async listUpdatedSince(since: Date, limit: number = 50): Promise<LaVitrineEvent[]> {
    console.log('🎭 Récupération des événements de La Vitrine...');
    
    // ⚠️ TODO: Implémenter un vrai scraper ou API pour récupérer les événements depuis lavitrine.com
    // Pour l'instant, cette source retourne un tableau vide
    // Ne pas utiliser d'événements hardcodés/mockés
    
    console.warn('⚠️ Connecteur LaVitrine non implémenté - aucun événement récupéré');
    
    return [];
  }

  // Méthode supprimée - contenait des événements hardcodés
  /*
  async listUpdatedSince_OLD(since: Date, limit: number = 50): Promise<LaVitrineEvent[]> {
    const vitrineEvents: LaVitrineEvent[] = [
      {
        id: 'vitrine_1',
        title: 'Spectacle de théâtre - Les Belles-Sœurs',
        description: 'Représentation de la pièce emblématique de Michel Tremblay. Une comédie sociale qui explore la vie des femmes québécoises des années 1960.',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Théâtre du Nouveau Monde',
        venueAddress: '84 Rue Sainte-Catherine O, Montréal',
        category: 'Théâtre',
        price: '35-65$',
        url: 'https://www.lavitrine.com/fr/evenement/belles-soeurs',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Théâtre du Nouveau Monde'
      },
      {
        id: 'vitrine_2',
        title: 'Concert - Les Cowboys Fringants',
        description: 'Groupe emblématique de la musique québécoise en concert. Chansons engagées et festives dans une ambiance électrisante.',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venue: 'Place Bell',
        venueAddress: '1950 Rue Claude-Gagné, Laval',
        category: 'Musique',
        price: '55-95$',
        url: 'https://www.lavitrine.com/fr/evenement/cowboys-fringants',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Laval',
        organizer: 'Evenko'
      },
      {
        id: 'vitrine_3',
        title: 'Festival de Jazz de Montréal',
        description: 'Le plus grand festival de jazz au monde. Des centaines de concerts gratuits et payants dans toute la ville.',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Quartier des Spectacles',
        venueAddress: 'Quartier des Spectacles, Montréal',
        category: 'Festival',
        price: 'Gratuit et payant',
        url: 'https://www.lavitrine.com/fr/evenement/festival-jazz-montreal',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Festival International de Jazz de Montréal'
      },
      {
        id: 'vitrine_4',
        title: 'Exposition - Riopelle au Musée',
        description: 'Rétrospective majeure de l\'œuvre de Jean-Paul Riopelle. Plus de 100 œuvres du maître de l\'automatisme québécois.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Musée des Beaux-Arts de Montréal',
        venueAddress: '1380 Rue Sherbrooke O, Montréal',
        category: 'Exposition',
        price: '24$',
        url: 'https://www.lavitrine.com/fr/evenement/riopelle-mbam',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
        neighborhood: 'Centre-ville',
        organizer: 'MBAM'
      },
      {
        id: 'vitrine_5',
        title: 'Spectacle de danse - Les Grands Ballets',
        description: 'Compagnie de danse classique et contemporaine. Programme de ballets classiques et créations modernes.',
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Place des Arts',
        venueAddress: '175 Rue Sainte-Catherine O, Montréal',
        category: 'Danse',
        price: '40-80$',
        url: 'https://www.lavitrine.com/fr/evenement/grands-ballets',
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Les Grands Ballets Canadiens'
      },
      {
        id: 'vitrine_6',
        title: 'Comédie musicale - Notre-Dame de Paris',
        description: 'Adaptation québécoise du spectacle musical français. Musique de Riccardo Cocciante, mise en scène grandiose.',
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
        venue: 'Salle Wilfrid-Pelletier',
        venueAddress: '175 Rue Sainte-Catherine O, Montréal',
        category: 'Comédie musicale',
        price: '50-120$',
        url: 'https://www.lavitrine.com/fr/evenement/notre-dame-paris',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Place des Arts'
      },
      {
        id: 'vitrine_7',
        title: 'Festival Juste pour rire',
        description: 'Le plus grand festival d\'humour au monde. Stand-up, spectacles, galas et événements comiques partout à Montréal.',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Divers lieux',
        venueAddress: 'Montréal',
        category: 'Festival',
        price: 'Variable',
        url: 'https://www.lavitrine.com/fr/evenement/juste-pour-rire',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
        neighborhood: 'Montréal',
        organizer: 'Juste pour rire'
      },
      {
        id: 'vitrine_8',
        title: 'Spectacle - Cirque du Soleil',
        description: 'Nouvelle création du Cirque du Soleil. Acrobaties époustouflantes, musique originale et mise en scène spectaculaire.',
        startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Grand Chapiteau',
        venueAddress: 'Quai Jacques-Cartier, Montréal',
        category: 'Cirque',
        price: '65-150$',
        url: 'https://www.lavitrine.com/fr/evenement/cirque-soleil',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
        neighborhood: 'Vieux-Port',
        organizer: 'Cirque du Soleil'
      }
    ];

    // Filtrer les événements selon la date
    const filteredEvents = vitrineEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > since;
    }).slice(0, limit);

    console.log(`🎭 ${filteredEvents.length} événements de La Vitrine récupérés`);
    
    // Simuler un délai réaliste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return filteredEvents;
  }

  /**
   * Mappe un événement La Vitrine vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: LaVitrineEvent): Promise<UnifiedEvent> {
    const startDate = new Date(rawEvent.startDate);
    const endDate = rawEvent.endDate ? new Date(rawEvent.endDate) : this.estimateEndTime(startDate);

    // Géocoder l'adresse du venue
    const coordinates = await this.geocodeAddress(rawEvent.venueAddress || rawEvent.venue, 'Montréal');

    // Parser le prix
    const priceInfo = this.parsePrice(rawEvent.price || '');

    return {
      sourceId: rawEvent.id,
      source: EventSource.LAVITRINE,
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
      language: EventLanguage.FR, // La Vitrine est principalement francophone
      imageUrl: rawEvent.imageUrl,
      tags: this.generateTags(rawEvent.title, rawEvent.category, rawEvent.neighborhood),
      category: this.mapCategory(rawEvent.category),
      subcategory: rawEvent.category,
      accessibility: this.inferAccessibility(rawEvent.venue),
      ageRestriction: this.inferAgeRestriction(rawEvent.category),
    };
  }

  /**
   * Mappe les catégories La Vitrine vers nos catégories
   */
  private mapCategory(vitrineCategory: string): EventCategory {
    const category = vitrineCategory.toLowerCase();
    
    if (category.includes('théâtre') || category.includes('theatre') || category.includes('comédie')) {
      return EventCategory.THEATER;
    }
    if (category.includes('musique') || category.includes('concert')) {
      return EventCategory.MUSIC;
    }
    if (category.includes('danse') || category.includes('ballet')) {
      return EventCategory.DANCE;
    }
    if (category.includes('exposition') || category.includes('art')) {
      return EventCategory.EXHIBITION;
    }
    if (category.includes('festival')) {
      return EventCategory.FESTIVAL;
    }
    if (category.includes('cirque')) {
      return EventCategory.SHOW;
    }
    
    return EventCategory.SHOW; // Par défaut pour les spectacles
  }

  /**
   * Estime l'heure de fin pour les spectacles
   */
  private estimateEndTime(startTime: Date): Date {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // 2 heures par défaut pour un spectacle
    return endTime;
  }

  /**
   * Génère des tags automatiques
   */
  private generateTags(title: string, category: string, neighborhood?: string): string[] {
    const tags = ['lavitrine', 'culture québécoise', 'spectacle', 'montreal'];
    
    if (neighborhood) tags.push(neighborhood.toLowerCase());
    
    const text = `${title} ${category}`.toLowerCase();
    
    // Tags spécifiques à la culture québécoise
    const cultureTags = [
      'théâtre', 'theatre', 'musique', 'danse', 'ballet', 'cirque',
      'festival', 'exposition', 'spectacle', 'comédie', 'comedie',
      'quebec', 'quebecois', 'montreal', 'culture', 'art'
    ];
    
    cultureTags.forEach(tag => {
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
    
    // Les grandes salles sont généralement accessibles
    if (venueLower.includes('place des arts') || venueLower.includes('théâtre') || 
        venueLower.includes('theatre') || venueLower.includes('musée') || 
        venueLower.includes('salle')) {
      accessibility.push('wheelchair_accessible');
    }
    
    return accessibility;
  }

  /**
   * Infère les restrictions d'âge selon la catégorie
   */
  private inferAgeRestriction(category: string): string {
    const cat = category.toLowerCase();
    
    if (cat.includes('comédie') || cat.includes('humour') || cat.includes('stand-up')) {
      return '13+'; // Certains spectacles d'humour peuvent être pour adultes
    }
    
    return 'Tout public'; // Par défaut
  }

  /**
   * TODO: Implémenter le scraping réel du site lavitrine.com
   * 
   * Exemple de structure pour un scraping:
   * 
   * async listUpdatedSince(since: Date, limit: number = 50): Promise<LaVitrineEvent[]> {
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
   *     const events: LaVitrineEvent[] = [];
   *     
   *     // Parser le HTML pour extraire les événements
   *     $('.event-card').each((i, elem) => {
   *       const event = {
   *         id: $(elem).attr('data-id') || `vitrine_${i}`,
   *         title: $(elem).find('.event-title').text().trim(),
   *         description: $(elem).find('.event-description').text().trim(),
   *         // ... extraire autres champs
   *       };
   *       events.push(event);
   *     });
   *     
   *     return events.filter(e => new Date(e.startDate) > since).slice(0, limit);
   *   } catch (error) {
   *     console.error('Erreur lors du scraping La Vitrine:', error);
   *     return []; // Retourner vide en cas d'erreur
   *   }
   * }
   */
}









