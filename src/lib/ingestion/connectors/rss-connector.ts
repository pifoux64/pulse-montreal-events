/**
 * Connecteur RSS générique
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import Parser from 'rss-parser';
import { BaseConnector } from '../base-connector';
import {
  IConnector,
  NormalizedEvent,
  ConnectorConfig,
  ConnectorImportResult,
} from '../types';
import { EventCategory, EventLanguage } from '@prisma/client';

export class RSSConnector extends BaseConnector implements IConnector {
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser({
      customFields: {
        item: [
          ['geo:lat', 'geoLat'],
          ['geo:long', 'geoLong'],
          ['event:startdate', 'eventStartDate'],
          ['event:enddate', 'eventEndDate'],
          ['event:location', 'eventLocation'],
        ],
      },
    });
  }

  getName(): string {
    return 'RSS Connector';
  }

  getType(): 'RSS' {
    return 'RSS';
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
        error: 'URL du flux RSS requise',
      });
      return result;
    }

    try {
      const feed = await this.parser.parseURL(config.url);

      for (const item of feed.items || []) {
        try {
          const event = this.mapRSSItemToEvent(item, config);
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
            title: item.title || 'Unknown',
            error: `Erreur lors du mapping: ${error.message}`,
          });
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push({
        error: `Erreur lors de la récupération du flux RSS: ${error.message}`,
      });
      return result;
    }
  }

  /**
   * Mappe un item RSS vers un événement normalisé
   */
  private mapRSSItemToEvent(
    item: Parser.Item,
    config: ConnectorConfig
  ): NormalizedEvent | null {
    if (!item.title) {
      return null;
    }

    // Parser la date de publication ou chercher dans les champs personnalisés
    let startDateTime: Date | null = null;
    if (item.pubDate) {
      startDateTime = new Date(item.pubDate);
    } else if ((item as any).eventStartDate) {
      startDateTime = new Date((item as any).eventStartDate);
    } else if (item.isoDate) {
      startDateTime = new Date(item.isoDate);
    }

    if (!startDateTime || isNaN(startDateTime.getTime())) {
      // Essayer d'extraire la date du titre ou de la description
      startDateTime = this.extractDateFromText(item.title + ' ' + (item.contentSnippet || ''));
      if (!startDateTime) {
        return null; // Pas de date trouvée
      }
    }

    // Extraire le lieu
    let venueName = 'Lieu à confirmer';
    let address: string | undefined;
    let lat: number | undefined;
    let lon: number | undefined;

    if ((item as any).eventLocation) {
      venueName = (item as any).eventLocation;
    } else if (item.content) {
      // Essayer d'extraire le lieu depuis le contenu
      const locationMatch = item.content.match(/lieu[:\s]+([^<\n]+)/i);
      if (locationMatch) {
        venueName = locationMatch[1].trim();
      }
    }

    // Coordonnées géographiques (si disponibles)
    if ((item as any).geoLat && (item as any).geoLong) {
      lat = parseFloat((item as any).geoLat);
      lon = parseFloat((item as any).geoLong);
    }

    // Parser la description
    const description = this.cleanHtml(
      item.contentSnippet || item.content || item.title || ''
    );

    // Extraire le prix si disponible
    let priceMin: number | undefined;
    let priceMax: number | undefined;
    let isFree = false;
    const priceMatch = description.match(/(?:prix|price|tarif|gratuit|free)[:\s]+([^\n<]+)/i);
    if (priceMatch) {
      const priceText = priceMatch[1].toLowerCase();
      if (priceText.includes('gratuit') || priceText.includes('free')) {
        isFree = true;
      } else {
        const price = this.parsePrice(priceText);
        if (price !== null) {
          priceMin = price;
          priceMax = price;
        }
      }
    }

    const event: NormalizedEvent = {
      externalId: item.guid || item.link || `${config.sourceId || 'rss'}-${Date.now()}-${Math.random()}`,
      sourceUrl: item.link,
      title: item.title.trim(),
      description,
      startDateTime,
      endDateTime: (item as any).eventEndDate ? new Date((item as any).eventEndDate) : undefined,
      timezone: 'America/Montreal',
      venueName: venueName.trim(),
      address,
      city: 'Montréal',
      lat,
      lon,
      category: this.inferCategory(item.title, description),
      language: this.inferLanguage(item.title, description),
      priceMin,
      priceMax,
      currency: priceMin ? 'CAD' : undefined,
      isFree,
      status: 'SCHEDULED',
    };

    return event;
  }

  /**
   * Extrait une date depuis un texte
   */
  private extractDateFromText(text: string): Date | null {
    // Formats communs: "15 janvier 2024", "2024-01-15", "15/01/2024", etc.
    const datePatterns = [
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    ];

    const months: Record<string, number> = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    };

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match.length === 4 && months[match[2].toLowerCase()] !== undefined) {
            // Format français: "15 janvier 2024"
            return new Date(
              parseInt(match[3]),
              months[match[2].toLowerCase()],
              parseInt(match[1])
            );
          } else if (match.length === 4) {
            // Format ISO ou DD/MM/YYYY
            const year = parseInt(match[3] || match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[1] || match[2]);
            return new Date(year, month, day);
          }
        } catch {
          // Continue
        }
      }
    }

    return null;
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

