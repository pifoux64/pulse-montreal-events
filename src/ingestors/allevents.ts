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
    
    // TODO: Remplacer par un vrai scraping ou API
    // Exemple de structure basée sur les événements réels listés sur AllEvents
    const alleventsEvents: AllEventsEvent[] = [
      {
        id: 'allevents_1',
        title: 'Samay Raina "Still Alive" - Montreal',
        description: 'Stand-up comedy show avec Samay Raina. Un spectacle hilarant qui explore la vie moderne avec humour et authenticité.',
        startDate: new Date(Date.now() + 78 * 24 * 60 * 60 * 1000).toISOString(), // 13 Feb 2026
        endDate: new Date(Date.now() + 78 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Rialto Theatre',
        venueAddress: 'Rialto Theatre, Montreal',
        category: 'Comedy',
        price: 'CAD 53',
        url: 'https://allevents.in/montreal/samay-raina-still-alive',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
        neighborhood: 'Plateau Mont-Royal',
        organizer: 'Rialto Theatre',
        interested: 171
      },
      {
        id: 'allevents_2',
        title: '2026 New Year\'s Eve "Blackout Party!"',
        description: 'Célébrez le Nouvel An 2026 avec une soirée mémorable. Musique, danse et ambiance festive pour accueillir la nouvelle année.',
        startDate: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString(), // 31 Dec 2025
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Yia Sou Greek Grill + Bar',
        venueAddress: 'Queen Mary Road, Montreal, QC, Canada',
        category: 'Parties & Nightlife',
        price: 'CAD 50',
        url: 'https://allevents.in/montreal/new-year-eve-blackout-party',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
        neighborhood: 'Côte-des-Neiges',
        organizer: 'Yia Sou',
        interested: 0
      },
      {
        id: 'allevents_3',
        title: 'Concert - Orchestre symphonique CAMMAC',
        description: 'Concert classique avec l\'orchestre symphonique CAMMAC. Programme de musique classique et contemporaine.',
        startDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 13 Dec
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Eglise Saint-Edouard',
        venueAddress: 'Eglise Saint-Edouard, Montreal',
        category: 'Music',
        price: 'Free',
        url: 'https://allevents.in/montreal/orchestre-symphonique-cammac',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Montreal',
        organizer: 'CAMMAC',
        interested: 6
      },
      {
        id: 'allevents_4',
        title: 'Joé Dwèt Filé in Montreal',
        description: 'Concert de Joé Dwèt Filé, artiste haïtien de renom. Musique compas et rara dans une ambiance festive.',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 12 Dec
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venue: 'Centre Bell',
        venueAddress: '1909 Av. des Canadiens-de-Montréal, Montreal',
        category: 'Music',
        price: 'Variable',
        url: 'https://allevents.in/montreal/joe-dwet-file',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Centre-ville',
        organizer: 'Evenko',
        interested: 4
      },
      {
        id: 'allevents_5',
        title: 'ODYSSEE EN EGYPTE',
        description: 'Spectacle immersif sur l\'Égypte ancienne. Voyage dans le temps à travers l\'art, la musique et la danse.',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 30 Nov
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Espace St-Denis',
        venueAddress: 'Espace St-Denis, Montreal',
        category: 'Performances',
        price: 'Variable',
        url: 'https://allevents.in/montreal/odyssee-en-egypte',
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
        neighborhood: 'Quartier Latin',
        organizer: 'Espace St-Denis',
        interested: 185
      },
      {
        id: 'allevents_6',
        title: 'Marché de Noël / Christmas Market',
        description: 'Marché de Noël avec artisans locaux, produits artisanaux et spécialités de saison. Ambiance festive et chaleureuse.',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 29 Nov
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        venue: 'Nueva Era',
        venueAddress: 'Nueva Era, Montreal',
        category: 'Festivals',
        price: 'Free',
        url: 'https://allevents.in/montreal/marche-de-noel',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
        neighborhood: 'Montreal',
        organizer: 'Nueva Era',
        interested: 141
      },
      {
        id: 'allevents_7',
        title: 'Moist | Théâtre Beanfield',
        description: 'Concert du groupe rock canadien Moist. Retour sur scène avec leurs plus grands succès.',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 11 Dec
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
        venue: 'Théâtre Beanfield',
        venueAddress: 'Théâtre Beanfield, Montreal',
        category: 'Music',
        price: 'Variable',
        url: 'https://allevents.in/montreal/moist-beanfield',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Théâtre Beanfield',
        interested: 965
      },
      {
        id: 'allevents_8',
        title: 'The Beths at Beanfield Theatre',
        description: 'Concert du groupe indie rock néo-zélandais The Beths. Musique énergique et mélodies accrocheuses.',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 29 Nov
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Beanfield Theatre',
        venueAddress: 'Beanfield Theatre, Montreal',
        category: 'Music',
        price: 'Variable',
        url: 'https://allevents.in/montreal/the-beths-beanfield',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles',
        organizer: 'Beanfield Theatre',
        interested: 0
      },
      {
        id: 'allevents_9',
        title: 'Wrapped in Self Care: A Holiday Market',
        description: 'Marché de Noël axé sur le bien-être et l\'auto-soin. Produits artisanaux, ateliers et activités de détente.',
        startDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 13 Dec
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        venue: 'Centre culturel Georges-Vanier',
        venueAddress: 'Centre culturel Georges-Vanier, Montreal',
        category: 'Festivals',
        price: 'Free',
        url: 'https://allevents.in/montreal/wrapped-self-care-market',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
        neighborhood: 'Saint-Henri',
        organizer: 'Centre culturel Georges-Vanier',
        interested: 0
      },
      {
        id: 'allevents_10',
        title: 'Tantra Speed Date® - Montreal!',
        description: 'Rencontre rapide pour célibataires avec une approche basée sur la connexion authentique et le tantra.',
        startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 6 Dec
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue: 'Ashtanga Yoga Montreal',
        venueAddress: 'Ashtanga Yoga Montreal, Montreal',
        category: 'Meetups',
        price: 'CAD 45',
        url: 'https://allevents.in/montreal/tantra-speed-date',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        neighborhood: 'Montreal',
        organizer: 'Ashtanga Yoga Montreal',
        interested: 0
      }
    ];

    // Filtrer les événements selon la date
    const filteredEvents = alleventsEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > since;
    }).slice(0, limit);

    console.log(`📅 ${filteredEvents.length} événements d'AllEvents récupérés`);
    
    // Simuler un délai réaliste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return filteredEvents;
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


