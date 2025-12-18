/**
 * Connecteur Bandsintown (API officielle)
 * SPRINT B: Architecture d'ingestion légale et durable
 * 
 * Documentation: https://artists.bandsintown.com/support/bandsintown-api
 */

import { BaseConnector } from '../base-connector';
import {
  IConnector,
  NormalizedEvent,
  ConnectorConfig,
  ConnectorImportResult,
} from '../types';
import { EventCategory, EventLanguage } from '@prisma/client';

interface BandsintownEvent {
  id: string;
  artist_id: string;
  url: string;
  on_sale_datetime: string | null;
  datetime: string;
  description: string | null;
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
    latitude: string | null;
    longitude: string | null;
  };
  lineup: string[];
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  title: string | null;
}

interface BandsintownResponse {
  events: BandsintownEvent[];
}

export class BandsintownConnector extends BaseConnector implements IConnector {
  getName(): string {
    return 'Bandsintown API';
  }

  getType(): 'API' {
    return 'API';
  }

  isConfigured(): boolean {
    // Bandsintown API ne nécessite pas de clé API pour les recherches publiques
    return true;
  }

  async fetchEvents(
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<ConnectorImportResult> {
    const result: ConnectorImportResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      events: [],
    };

    try {
      // Configuration
      const city = (config.city as string) || 'Montreal';
      const dateRange = this.calculateDateRange(sinceDate);
      const appId = (config.appId as string) || 'pulse-montreal'; // Identifiant de l'app (requis par Bandsintown)

      // Construire l'URL de l'API
      const apiUrl = new URL('https://rest.bandsintown.com/artists/events');
      apiUrl.searchParams.set('app_id', appId);
      apiUrl.searchParams.set('date', dateRange);
      apiUrl.searchParams.set('location', city);

      // Récupérer les événements
      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur Bandsintown API: ${response.statusText}`);
      }

      const data: BandsintownEvent[] | BandsintownResponse = await response.json();
      
      // Bandsintown peut retourner soit un tableau directement, soit un objet avec events
      const events = Array.isArray(data) ? data : (data as any).events || [];

      // Mapper les événements
      for (const bandsintownEvent of events) {
        try {
          const event = this.mapBandsintownEventToEvent(bandsintownEvent, config);
          if (event) {
            // Valider l'événement
            const validation = this.validateEvent(event);
            if (!validation.valid) {
              result.skipped++;
              result.errors.push({
                externalId: event.externalId,
                title: event.title,
                error: validation.errors.join('; '),
              });
              continue;
            }

            result.events.push(event);
          }
        } catch (error: any) {
          result.skipped++;
          result.errors.push({
            externalId: bandsintownEvent.id || 'unknown',
            title: bandsintownEvent.title || 'Unknown',
            error: `Erreur lors du mapping: ${error.message}`,
          });
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push({
        error: `Erreur lors de la récupération Bandsintown: ${error.message}`,
      });
      return result;
    }
  }

  /**
   * Calcule la plage de dates pour l'API Bandsintown
   * Format: "upcoming" ou "YYYY-MM-DD,YYYY-MM-DD"
   */
  private calculateDateRange(sinceDate?: Date): string {
    if (!sinceDate) {
      return 'upcoming'; // Tous les événements à venir
    }

    const start = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const end = new Date();
    end.setDate(end.getDate() + 60); // 60 jours dans le futur
    const endStr = end.toISOString().split('T')[0];

    return `${start},${endStr}`;
  }

  /**
   * Mappe un événement Bandsintown vers un événement normalisé
   */
  private mapBandsintownEventToEvent(
    bandsintownEvent: BandsintownEvent,
    config: ConnectorConfig
  ): NormalizedEvent | null {
    // Parser la date
    const startDateTime = new Date(bandsintownEvent.datetime);
    if (isNaN(startDateTime.getTime())) {
      return null;
    }

    // Construire le titre (artist + venue ou title si disponible)
    const title = bandsintownEvent.title || 
      `${bandsintownEvent.lineup.join(', ')} @ ${bandsintownEvent.venue.name}`;

    // Description
    const description = bandsintownEvent.description || 
      `Concert de ${bandsintownEvent.lineup.join(', ')} à ${bandsintownEvent.venue.name}`;

    // Coordonnées
    let lat: number | undefined;
    let lon: number | undefined;
    if (bandsintownEvent.venue.latitude && bandsintownEvent.venue.longitude) {
      lat = parseFloat(bandsintownEvent.venue.latitude);
      lon = parseFloat(bandsintownEvent.venue.longitude);
    }

    // URL de ticket
    let ticketUrl: string | undefined;
    const ticketOffer = bandsintownEvent.offers?.find(
      (offer) => offer.type === 'Tickets' && offer.status === 'available'
    );
    if (ticketOffer) {
      ticketUrl = ticketOffer.url;
    }

    // Prix (non disponible dans l'API Bandsintown publique)
    // On laisse undefined, l'enrichissement IA pourra peut-être l'inférer

    const event: NormalizedEvent = {
      externalId: bandsintownEvent.id,
      sourceUrl: bandsintownEvent.url,
      title: title.trim(),
      description: description.trim(),
      startDateTime,
      timezone: 'America/Montreal',
      venueName: bandsintownEvent.venue.name,
      city: bandsintownEvent.venue.city || 'Montréal',
      lat,
      lon,
      category: EventCategory.MUSIC, // Bandsintown = toujours musique
      language: this.inferLanguage(title, description),
      lineup: bandsintownEvent.lineup,
      ticketUrl,
      status: 'SCHEDULED',
    };

    return event;
  }

  /**
   * Infère la langue depuis le texte
   */
  private inferLanguage(title: string, description: string): EventLanguage {
    const text = `${title} ${description}`;
    const frenchWords = /\b(le|la|les|de|du|des|et|ou|avec|pour|dans|sur|sous|par|un|une)\b/i;
    const englishWords = /\b(the|a|an|and|or|with|for|in|on|under|by)\b/i;

    const frenchCount = (text.match(frenchWords) || []).length;
    const englishCount = (text.match(englishWords) || []).length;

    if (frenchCount > englishCount * 2) {
      return EventLanguage.FR;
    } else if (englishCount > frenchCount * 2) {
      return EventLanguage.EN;
    } else {
      return EventLanguage.BOTH;
    }
  }
}

