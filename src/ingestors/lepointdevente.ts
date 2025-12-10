/**
 * Connecteur Lepointdevente.com pour Pulse Montreal
 * Plateforme de billetterie québécoise pour événements culturels
 * 
 * NOTE: Lepointdevente.com ne semble pas avoir d'API publique.
 * Ce connecteur peut être étendu pour:
 * - Scraping du site (avec respect des robots.txt et rate limiting)
 * - Contact avec Lepointdevente.com pour un partenariat API
 * - Utilisation d'un flux RSS si disponible
 * - Exploration des endpoints JSON potentiels
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage } from '@prisma/client';
// Pas de scraping HTML - illégal et non durable
// import * as cheerio from 'cheerio';

/**
 * Interface pour un événement brut de Lepointdevente.com
 */
interface LepointdeventeEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress?: string;
  city?: string;
  postalCode?: string;
  category: string;
  price?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  url: string;
  imageUrl?: string;
  organizer?: string;
  timezone?: string;
}

/**
 * Connecteur pour Lepointdevente.com
 * Plateforme de billetterie québécoise - utilisation respectueuse des données publiques
 */
export class LepointdeventeConnector extends BaseConnector {
  private readonly eventsUrl = 'https://lepointdevente.com/evenements';

  constructor() {
    super('LEPOINTDEVENTE' as EventSource, undefined, 'https://lepointdevente.com', 2); // 2 secondes entre requêtes
  }

  /**
   * Récupère les événements depuis une date donnée
   * 
   * ⚠️ IMPORTANT : Pas de scraping HTML (illégal et non durable)
   * 
   * STRATÉGIES LÉGALES ET DURABLES:
   * 1. API officielle (si disponible) - À demander à Lepointdevente.com
   * 2. Flux RSS (si disponible)
   * 3. Webhooks (si disponibles)
   * 4. Partenariat API avec Lepointdevente.com
   * 
   * TODO: Contacter Lepointdevente.com pour obtenir un accès API légal
   */
  async listUpdatedSince(since: Date, limit: number = 100): Promise<LepointdeventeEvent[]> {
    console.log('🎫 Récupération des événements de Lepointdevente.com...');
    
    // ⚠️ Pas de scraping HTML - illégal et non durable
    
    try {
      // Stratégie 1: Essayer des endpoints API officiels (si disponibles)
      const apiEvents = await this.tryApiEndpoints(since, limit);
      if (apiEvents.length > 0) {
        console.log(`✅ ${apiEvents.length} événements récupérés via API Lepointdevente.com`);
        return apiEvents;
      }

      // Stratégie 2: Essayer un flux RSS (si disponible)
      const rssEvents = await this.tryRssFeed(since, limit);
      if (rssEvents.length > 0) {
        console.log(`✅ ${rssEvents.length} événements récupérés via RSS Lepointdevente.com`);
        return rssEvents;
      }

      console.warn('⚠️ Aucun événement récupéré depuis Lepointdevente.com');
      console.warn('   Contactez Lepointdevente.com pour obtenir un accès API légal');
      console.warn('   Voir docs/LEPOINTDEVENTE_SETUP.md pour plus d\'informations');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des événements Lepointdevente.com:', error);
      return [];
    }
  }

  /**
   * Tente de récupérer les événements via un flux RSS (si disponible)
   */
  private async tryRssFeed(since: Date, limit: number): Promise<LepointdeventeEvent[]> {
    const rssUrls = [
      `${this.baseUrl}/rss`,
      `${this.baseUrl}/feed`,
      `${this.baseUrl}/events/rss`,
      `${this.baseUrl}/events/feed`,
    ];

    for (const rssUrl of rssUrls) {
      try {
        await this.rateLimit();
        
        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Pulse-Montreal/1.0 (contact@pulse-montreal.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
        });

        if (response.ok) {
          const xml = await response.text();
          // TODO: Parser le RSS avec une bibliothèque comme 'rss-parser'
          // Pour l'instant, retourner un tableau vide
          console.log(`⚠️ RSS trouvé à ${rssUrl} mais le parsing n'est pas encore implémenté`);
          return [];
        }
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  // ⚠️ SCRAPING HTML DÉSACTIVÉ - Illégal et non durable
  // Cette méthode a été supprimée pour respecter les conditions d'utilisation
  // Utilisez uniquement des APIs officielles ou des flux RSS autorisés

  /**
   * Tente de récupérer les événements via des endpoints API potentiels
   */
  private async tryApiEndpoints(since: Date, limit: number): Promise<LepointdeventeEvent[]> {
    const potentialEndpoints = [
      '/api/events',
      '/api/v1/events',
      '/events.json',
      '/api/events.json',
      '/api/public/events',
    ];

    for (const endpoint of potentialEndpoints) {
      try {
        await this.rateLimit();
        
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Pulse-Montreal/1.0 (contact@pulse-montreal.com)',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Adapter selon la structure de la réponse API
          if (Array.isArray(data)) {
            return this.parseApiResponse(data, since, limit);
          } else if (data.events && Array.isArray(data.events)) {
            return this.parseApiResponse(data.events, since, limit);
          } else if (data.data && Array.isArray(data.data)) {
            return this.parseApiResponse(data.data, since, limit);
          }
        }
      } catch (error) {
        // Continuer avec le prochain endpoint
        continue;
      }
    }

    return [];
  }

  /**
   * Parse une réponse API en événements LepointdeventeEvent
   */
  private parseApiResponse(data: any[], since: Date, limit: number): LepointdeventeEvent[] {
    const events: LepointdeventeEvent[] = [];

    for (const item of data.slice(0, limit)) {
      try {
        const startDate = new Date(item.startDate || item.start_date || item.date || item.start);
        
        if (startDate >= since) {
          events.push({
            id: item.id || item.eventId || `lepointdevente_${item.slug || Math.random()}`,
            title: item.title || item.name || '',
            description: item.description || item.desc || '',
            startDate: startDate.toISOString(),
            endDate: item.endDate || item.end_date || item.end ? new Date(item.endDate || item.end_date || item.end).toISOString() : undefined,
            venue: item.venue || item.location || item.venueName || '',
            venueAddress: item.address || item.venueAddress || '',
            city: item.city || 'Montréal',
            postalCode: item.postalCode || item.postal_code || '',
            category: item.category || item.type || 'Autre',
            price: item.price || item.priceText,
            priceMin: item.priceMin || item.price_min,
            priceMax: item.priceMax || item.price_max,
            currency: item.currency || 'CAD',
            url: item.url || item.link || item.eventUrl || '',
            imageUrl: item.imageUrl || item.image || item.image_url || '',
            organizer: item.organizer || item.organizerName || '',
            timezone: item.timezone || 'America/Montreal',
          });
        }
      } catch (error) {
        console.warn('Erreur lors du parsing d\'un événement API:', error);
      }
    }

    return events;
  }

  /**
   * Parse une date depuis une chaîne de caractères
   */
  private parseDate(dateText: string, fallback: Date): Date {
    if (!dateText) return fallback;

    // Essayer de parser la date
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Formats de date courants en français
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = dateText.match(pattern);
      if (match) {
        // Parser selon le format
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    return fallback;
  }

  /**
   * Mappe un événement brut vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: LepointdeventeEvent): Promise<UnifiedEvent> {
    // Géocoder l'adresse si disponible
    let lat = 45.5017; // Coordonnées par défaut de Montréal
    let lon = -73.5673;
    
    if (rawEvent.venueAddress) {
      const coords = await this.geocodeAddress(rawEvent.venueAddress, rawEvent.city || 'Montréal');
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    // Extraire les tags
    const tags = this.extractTags(rawEvent.title, rawEvent.description);
    if (rawEvent.category) {
      tags.push(rawEvent.category.toLowerCase().replace(/\s+/g, '-'));
    }

    // Déterminer la catégorie
    const category = this.categorizeEvent(rawEvent.title, rawEvent.description, tags);

    // Déterminer la langue
    const language = this.detectLanguage(rawEvent.title, rawEvent.description);

    // Parser le prix
    const priceInfo = rawEvent.priceMin !== undefined && rawEvent.priceMax !== undefined
      ? { min: rawEvent.priceMin, max: rawEvent.priceMax, currency: rawEvent.currency || 'CAD' }
      : this.parsePrice(rawEvent.price || '');
    const priceMin = priceInfo.min;
    const priceMax = priceInfo.max;
    const currency = priceInfo.currency;

    return {
      sourceId: rawEvent.id,
      source: 'LEPOINTDEVENTE' as EventSource,
      title: rawEvent.title,
      description: rawEvent.description || rawEvent.title,
      startAt: new Date(rawEvent.startDate),
      endAt: rawEvent.endDate ? new Date(rawEvent.endDate) : undefined,
      timezone: rawEvent.timezone || 'America/Montreal',
      venue: rawEvent.venue
        ? {
            name: rawEvent.venue,
            address: rawEvent.venueAddress || rawEvent.venue,
            city: rawEvent.city || 'Montréal',
            postalCode: rawEvent.postalCode || '',
            lat,
            lon,
          }
        : undefined,
      url: rawEvent.url,
      priceMin,
      priceMax,
      currency,
      language,
      imageUrl: rawEvent.imageUrl,
      tags,
      category,
      accessibility: [],
    };
  }
}

