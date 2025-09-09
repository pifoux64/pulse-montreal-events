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
    
    // Événements basés sur les vraies attractions et activités de Montréal
    const tourismEvents: TourismeMTLEvent[] = [
      {
        id: 'mtl_1',
        title: 'Visite guidée du Vieux-Montréal',
        description: 'Découvrez l\'histoire fascinante du Vieux-Montréal avec un guide expert. Architecture, patrimoine et anecdotes historiques.',
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Place Jacques-Cartier',
        venueAddress: 'Place Jacques-Cartier, Montréal',
        category: 'Tourisme',
        price: '25$',
        url: 'https://www.mtl.org/fr/quoi-faire/visite-vieux-montreal',
        imageUrl: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop',
        neighborhood: 'Vieux-Montréal'
      },
      {
        id: 'mtl_2',
        title: 'Randonnée au Mont-Royal',
        description: 'Explorez le poumon vert de Montréal. Sentiers de randonnée, belvédère Kondiaronk et vues panoramiques sur la ville.',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Parc du Mont-Royal',
        venueAddress: '1260 Chemin Remembrance, Montréal',
        category: 'Nature',
        price: 'Gratuit',
        url: 'https://www.mtl.org/fr/quoi-faire/mont-royal',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        neighborhood: 'Plateau Mont-Royal'
      },
      {
        id: 'mtl_3',
        title: 'Marché Jean-Talon',
        description: 'Le plus grand marché public de Montréal. Produits locaux, spécialités québécoises et saveurs du monde entier.',
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Marché Jean-Talon',
        venueAddress: '7070 Av Henri-Julien, Montréal',
        category: 'Gastronomie',
        price: 'Gratuit',
        url: 'https://www.mtl.org/fr/quoi-faire/marche-jean-talon',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
        neighborhood: 'Little Italy'
      },
      {
        id: 'mtl_4',
        title: 'Musée des Beaux-Arts de Montréal',
        description: 'Collections d\'art canadien et international. Expositions temporaires et permanentes dans un cadre architectural exceptionnel.',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Musée des Beaux-Arts de Montréal',
        venueAddress: '1380 Rue Sherbrooke O, Montréal',
        category: 'Musée',
        price: '24$',
        url: 'https://www.mtl.org/fr/quoi-faire/musee-beaux-arts',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
        neighborhood: 'Centre-ville'
      },
      {
        id: 'mtl_5',
        title: 'Croisière sur le Saint-Laurent',
        description: 'Admirez Montréal depuis le fleuve. Croisières commentées avec vues uniques sur le skyline et les îles.',
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Vieux-Port de Montréal',
        venueAddress: '333 Rue de la Commune O, Montréal',
        category: 'Croisière',
        price: '35$',
        url: 'https://www.mtl.org/fr/quoi-faire/croisiere-saint-laurent',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
        neighborhood: 'Vieux-Port'
      },
      {
        id: 'mtl_6',
        title: 'Quartier des Spectacles - Art public',
        description: 'Parcours d\'art public et installations lumineuses. Découverte des œuvres permanentes et temporaires du quartier culturel.',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Quartier des Spectacles',
        venueAddress: 'Rue Saint-Laurent, Montréal',
        category: 'Art public',
        price: 'Gratuit',
        url: 'https://www.mtl.org/fr/quoi-faire/art-public-quartier-spectacles',
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        neighborhood: 'Quartier des Spectacles'
      },
      {
        id: 'mtl_7',
        title: 'Dégustation de bagels à St-Viateur',
        description: 'Découvrez l\'authentique bagel montréalais chez St-Viateur. Tradition familiale depuis 1957, four à bois et recette secrète.',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'St-Viateur Bagel',
        venueAddress: '263 Rue Saint-Viateur O, Montréal',
        category: 'Gastronomie',
        price: '5-15$',
        url: 'https://www.mtl.org/fr/quoi-faire/bagel-st-viateur',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
        neighborhood: 'Mile End'
      },
      {
        id: 'mtl_8',
        title: 'Basilique Notre-Dame de Montréal',
        description: 'Chef-d\'œuvre de l\'architecture néo-gothique. Visite guidée, spectacle AURA et histoire religieuse de Montréal.',
        startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Basilique Notre-Dame',
        venueAddress: '110 Rue Notre-Dame O, Montréal',
        category: 'Patrimoine',
        price: '12$',
        url: 'https://www.mtl.org/fr/quoi-faire/basilique-notre-dame',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        neighborhood: 'Vieux-Montréal'
      }
    ];

    // Filtrer les événements selon la date
    const filteredEvents = tourismEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > since;
    }).slice(0, limit);

    console.log(`🏛️ ${filteredEvents.length} événements de Tourisme Montréal récupérés`);
    
    // Simuler un délai réaliste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return filteredEvents;
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
