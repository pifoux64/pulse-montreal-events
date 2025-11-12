/**
 * Connecteur Eventbrite pour l'ingestion d'événements - Pulse Montreal
 * Utilise l'API Eventbrite v3 pour récupérer les événements de Montréal
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventLanguage } from '@prisma/client';

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  url: string;
  vanity_url?: string;
  created: string;
  changed: string;
  published: string;
  status: string;
  currency: string;
  online_event: boolean;
  organizer_id: string;
  venue_id?: string;
  category_id?: string;
  subcategory_id?: string;
  format_id?: string;
  resource_uri: string;
  is_series: boolean;
  is_series_parent: boolean;
  inventory_type: string;
  show_remaining: boolean;
  logo?: {
    id: string;
    url: string;
    crop_mask?: any;
    original: {
      url: string;
      width: number;
      height: number;
    };
  };
  ticket_availability: {
    has_available_tickets: boolean;
    minimum_ticket_price?: {
      currency: string;
      value: number;
      major_value: string;
      display: string;
    };
    maximum_ticket_price?: {
      currency: string;
      value: number;
      major_value: string;
      display: string;
    };
    is_sold_out: boolean;
    start_sales_date?: {
      timezone: string;
      local: string;
      utc: string;
    };
  };
}

interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1?: string;
    address_2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
    localized_address_display?: string;
    localized_area_display?: string;
    localized_multi_line_address_display?: string[];
  };
  resource_uri: string;
}

interface EventbriteCategory {
  id: string;
  resource_uri: string;
  name: string;
  name_localized: string;
  short_name: string;
  short_name_localized: string;
}

export class EventbriteConnector extends BaseConnector {
  private venues: Map<string, EventbriteVenue> = new Map();
  private categories: Map<string, EventbriteCategory> = new Map();

  constructor(apiKey: string) {
    super(
      EventSource.EVENTBRITE,
      apiKey,
      'https://www.eventbriteapi.com/v3',
      2 // 2 requêtes par seconde
    );
  }

  /**
   * Récupère les événements depuis une date donnée
   */
  async listUpdatedSince(since: Date, limit: number = 100): Promise<EventbriteEvent[]> {
    const events: EventbriteEvent[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && events.length < limit) {
      try {
        await this.rateLimit();

        const params = new URLSearchParams({
          'location.address': 'Montreal, QC, Canada',
          'location.within': '25km', // Réduire le rayon pour mieux cibler Montréal
          'start_date.range_start': since.toISOString(),
          'start_date.range_end': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours dans le futur
          'status': 'live',
          'order_by': 'start_asc', // Trier par date de début
          'expand': 'venue,category,subcategory,format,organizer,logo,ticket_availability',
          'page': page.toString(),
          'token': this.apiKey!,
        });

        const response = await fetch(`${this.baseUrl}/events/search?${params}`);
        
        if (!response.ok) {
          throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.events) {
          events.push(...data.events);
        }

        hasMore = data.pagination.has_more_items;
        page++;

        console.log(`Eventbrite: Page ${page - 1}, ${data.events?.length || 0} événements récupérés`);

      } catch (error) {
        console.error(`Erreur lors de la récupération des événements Eventbrite (page ${page}):`, error);
        hasMore = false;
      }
    }

    return events.slice(0, limit);
  }

  /**
   * Récupère les détails d'un venue
   */
  private async getVenue(venueId: string): Promise<EventbriteVenue | null> {
    if (this.venues.has(venueId)) {
      return this.venues.get(venueId)!;
    }

    try {
      await this.rateLimit();

      const response = await fetch(`${this.baseUrl}/venues/${venueId}?token=${this.apiKey}`);
      
      if (!response.ok) {
        console.warn(`Impossible de récupérer le venue ${venueId}: ${response.status}`);
        return null;
      }

      const venue = await response.json();
      this.venues.set(venueId, venue);
      return venue;

    } catch (error) {
      console.error(`Erreur lors de la récupération du venue ${venueId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les détails d'une catégorie
   */
  private async getCategory(categoryId: string): Promise<EventbriteCategory | null> {
    if (this.categories.has(categoryId)) {
      return this.categories.get(categoryId)!;
    }

    try {
      await this.rateLimit();

      const response = await fetch(`${this.baseUrl}/categories/${categoryId}?token=${this.apiKey}`);
      
      if (!response.ok) {
        console.warn(`Impossible de récupérer la catégorie ${categoryId}: ${response.status}`);
        return null;
      }

      const category = await response.json();
      this.categories.set(categoryId, category);
      return category;

    } catch (error) {
      console.error(`Erreur lors de la récupération de la catégorie ${categoryId}:`, error);
      return null;
    }
  }

  /**
   * Mappe un événement Eventbrite vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: EventbriteEvent): Promise<UnifiedEvent> {
    const event: Partial<UnifiedEvent> = {
      sourceId: rawEvent.id,
      source: EventSource.EVENTBRITE,
      title: rawEvent.name.text,
      description: rawEvent.description.text || rawEvent.description.html || '',
      startAt: new Date(rawEvent.start.utc),
      endAt: rawEvent.end ? new Date(rawEvent.end.utc) : undefined,
      timezone: rawEvent.start.timezone || 'America/Montreal',
      url: rawEvent.vanity_url || rawEvent.url,
      currency: rawEvent.currency || 'CAD',
      imageUrl: rawEvent.logo?.original?.url,
      lastModified: new Date(rawEvent.changed),
    };

    // Traitement du venue
    if (rawEvent.venue_id && !rawEvent.online_event) {
      const venue = await this.getVenue(rawEvent.venue_id);
      if (venue && venue.address) {
        const addr = venue.address;
        
        // Géocodage si coordonnées manquantes
        let lat = addr.latitude ? parseFloat(addr.latitude) : undefined;
        let lon = addr.longitude ? parseFloat(addr.longitude) : undefined;
        
        if (!lat || !lon) {
          const address = addr.localized_address_display || 
                          `${addr.address_1 || ''} ${addr.city || 'Montreal'}`;
          const coords = await this.geocodeAddress(address, addr.city || 'Montreal');
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          }
        }

        if (lat && lon) {
          event.venue = {
            name: venue.name,
            address: addr.localized_address_display || `${addr.address_1 || ''}, ${addr.city || ''}`,
            city: addr.city || 'Montreal',
            postalCode: addr.postal_code || '',
            lat,
            lon,
          };
        }
      }
    }

    // Traitement des prix
    if (rawEvent.ticket_availability) {
      const ticketing = rawEvent.ticket_availability;
      if (ticketing.minimum_ticket_price) {
        event.priceMin = Math.round(ticketing.minimum_ticket_price.value * 100); // Convertir en cents
      }
      if (ticketing.maximum_ticket_price) {
        event.priceMax = Math.round(ticketing.maximum_ticket_price.value * 100);
      }
      
      // Ne pas mettre 0 par défaut si le prix n'est pas disponible
      // On laisse undefined pour indiquer que le prix n'est pas connu
      // Seulement si l'API indique explicitement "is_free" ou "free", on met 0
      if (rawEvent.is_free === true || rawEvent.ticket_availability?.is_free === true) {
        event.priceMin = 0;
        event.priceMax = 0;
      }
    }

    // Catégorisation automatique
    const categoryText = rawEvent.category_id ? 
      (await this.getCategory(rawEvent.category_id))?.name || '' : '';
    
    event.category = this.categorizeEvent(
      event.title || '',
      event.description || '',
      [categoryText]
    );

    // Extraction des tags
    event.tags = this.extractTags(event.title || '', event.description || '');
    
    // Si c'est gratuit, ajouter le tag
    if (event.priceMin === 0 && event.priceMax === 0) {
      event.tags.push('gratuit');
    }

    // Détection de la langue
    event.language = this.detectLanguage(event.title || '', event.description || '');

    // Accessibilité (basique, basé sur la description)
    event.accessibility = [];
    const desc = (event.description || '').toLowerCase();
    if (desc.includes('wheelchair') || desc.includes('accessible')) {
      event.accessibility.push('wheelchair');
    }
    if (desc.includes('sign language') || desc.includes('asl')) {
      event.accessibility.push('sign-language');
    }

    return event as UnifiedEvent;
  }
}
