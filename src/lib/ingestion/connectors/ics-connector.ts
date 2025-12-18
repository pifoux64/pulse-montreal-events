/**
 * Connecteur ICS (iCalendar) générique
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import { parseICS, CalendarComponent, Event as ICSEvent } from 'ical';
import { BaseConnector } from '../base-connector';
import {
  IConnector,
  NormalizedEvent,
  ConnectorConfig,
  ConnectorImportResult,
} from '../types';
import { EventCategory, EventLanguage } from '@prisma/client';

export class ICSConnector extends BaseConnector implements IConnector {
  getName(): string {
    return 'ICS Connector';
  }

  getType(): 'ICS' {
    return 'ICS';
  }

  isConfigured(): boolean {
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

    if (!config.url) {
      result.errors.push({
        error: 'URL du flux ICS requise',
      });
      return result;
    }

    try {
      const response = await fetch(config.url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.statusText}`);
      }

      const icsText = await response.text();
      const calendar = parseICS(icsText);

      for (const key in calendar) {
        const component = calendar[key];
        if (this.isEvent(component)) {
          try {
            const event = this.mapICSEventToEvent(component, config);
            if (!event) {
              result.skipped++;
              continue;
            }

            // Filtrer par date si sinceDate est fourni
            if (sinceDate && event.startDateTime < sinceDate) {
              result.skipped++;
              continue;
            }

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
          } catch (error: any) {
            result.skipped++;
            result.errors.push({
              title: component.summary || 'Unknown',
              error: `Erreur lors du mapping: ${error.message}`,
            });
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push({
        error: `Erreur lors de la récupération du flux ICS: ${error.message}`,
      });
      return result;
    }
  }

  /**
   * Vérifie si un composant est un événement
   */
  private isEvent(component: CalendarComponent): component is ICSEvent {
    return component.type === 'VEVENT';
  }

  /**
   * Mappe un événement ICS vers un événement normalisé
   */
  private mapICSEventToEvent(
    icsEvent: ICSEvent,
    config: ConnectorConfig
  ): NormalizedEvent | null {
    if (!icsEvent.summary) {
      return null;
    }

    // Dates
    const startDateTime = icsEvent.start ? new Date(icsEvent.start) : null;
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      return null;
    }

    const endDateTime = icsEvent.end ? new Date(icsEvent.end) : undefined;

    // Lieu
    let venueName = 'Lieu à confirmer';
    let address: string | undefined;
    let lat: number | undefined;
    let lon: number | undefined;

    if (icsEvent.location) {
      // Le champ location peut contenir le nom du lieu et/ou l'adresse
      const locationParts = icsEvent.location.split(',').map((p) => p.trim());
      venueName = locationParts[0] || 'Lieu à confirmer';
      if (locationParts.length > 1) {
        address = locationParts.slice(1).join(', ');
      }
    }

    // Coordonnées géographiques (si disponibles dans GEO)
    if (icsEvent.geo) {
      lat = icsEvent.geo.lat;
      lon = icsEvent.geo.lon;
    }

    // Description
    const description = this.cleanHtml(icsEvent.description || icsEvent.summary || '');

    // URL
    const sourceUrl = icsEvent.url;

    // Organisateur
    let organizerName: string | undefined;
    if (icsEvent.organizer) {
      // Format: "CN=Nom Organisateur:mailto:email@example.com"
      const organizerMatch = icsEvent.organizer.match(/CN=([^:]+)/);
      if (organizerMatch) {
        organizerName = organizerMatch[1].trim();
      }
    }

    // Catégorie et tags
    const category = this.inferCategory(icsEvent.summary, description);
    const tags: string[] = [];
    if (icsEvent.categories) {
      tags.push(...icsEvent.categories);
    }

    const event: NormalizedEvent = {
      externalId: icsEvent.uid || `${config.sourceId || 'ics'}-${Date.now()}-${Math.random()}`,
      sourceUrl,
      title: icsEvent.summary.trim(),
      description,
      startDateTime,
      endDateTime,
      timezone: icsEvent.start?.tz || 'America/Montreal',
      venueName: venueName.trim(),
      address,
      city: 'Montréal',
      lat,
      lon,
      category,
      language: this.inferLanguage(icsEvent.summary, description),
      tags: tags.length > 0 ? tags : undefined,
      organizerName,
      status: icsEvent.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
    };

    // Prix (peut être dans la description)
    const priceMatch = description.match(/(?:prix|price|tarif|gratuit|free)[:\s]+([^\n<]+)/i);
    if (priceMatch) {
      const priceText = priceMatch[1].toLowerCase();
      if (priceText.includes('gratuit') || priceText.includes('free')) {
        event.isFree = true;
      } else {
        const price = this.parsePrice(priceText);
        if (price !== null) {
          event.priceMin = price;
          event.priceMax = price;
          event.currency = 'CAD';
        }
      }
    }

    return event;
  }

  /**
   * Infère la catégorie depuis le titre et la description
   */
  private inferCategory(title: string, description: string): EventCategory {
    const text = `${title} ${description}`.toLowerCase();

    if (text.match(/\b(musique|music|concert|festival|dj|live|band)\b/i)) {
      return EventCategory.MUSIC;
    }
    if (text.match(/\b(théâtre|theatre|spectacle|pièce|play)\b/i)) {
      return EventCategory.THEATRE;
    }
    if (text.match(/\b(exposition|exhibition|art|musée|museum|galerie|gallery)\b/i)) {
      return EventCategory.EXHIBITION;
    }
    if (text.match(/\b(famille|family|enfant|kid|children|jeunesse)\b/i)) {
      return EventCategory.FAMILY;
    }
    if (text.match(/\b(sport|athlétisme|course|running|football|soccer|basketball)\b/i)) {
      return EventCategory.SPORT;
    }
    if (text.match(/\b(éducation|education|formation|workshop|atelier|conférence|conference)\b/i)) {
      return EventCategory.EDUCATION;
    }
    if (text.match(/\b(communauté|community|quartier|neighborhood)\b/i)) {
      return EventCategory.COMMUNITY;
    }

    return EventCategory.OTHER;
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

  /**
   * Parse un prix depuis une chaîne
   */
  private parsePrice(priceStr: string): number | null {
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : Math.round(price * 100); // Convertir en cents
  }
}

