/**
 * Connecteur Open Data Montréal
 * Supporte CKAN API, CSV et JSON
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import { BaseConnector } from '../base-connector';
import {
  IConnector,
  NormalizedEvent,
  ConnectorConfig,
  ConnectorImportResult,
} from '../types';
import { EventCategory, EventLanguage } from '@prisma/client';

interface CKANResource {
  id: string;
  name: string;
  format: string; // 'CSV', 'JSON', etc.
  url: string;
  last_modified?: string;
}

interface CKANPackage {
  id: string;
  name: string;
  title: string;
  resources: CKANResource[];
}

export class OpenDataConnector extends BaseConnector implements IConnector {
  getName(): string {
    return 'Open Data Montréal';
  }

  getType(): 'OPEN_DATA' {
    return 'OPEN_DATA';
  }

  isConfigured(): boolean {
    return true; // Pas de configuration requise pour Open Data
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
      // Support CKAN API
      if (config.ckanApiUrl) {
        const events = await this.fetchFromCKAN(config, sinceDate);
        result.events.push(...events);
      }
      // Support URL directe CSV
      else if (config.csvUrl) {
        const events = await this.fetchFromCSV(config.csvUrl, config, sinceDate);
        result.events.push(...events);
      }
      // Support URL directe JSON
      else if (config.jsonUrl) {
        const events = await this.fetchFromJSON(config.jsonUrl, config, sinceDate);
        result.events.push(...events);
      } else {
        throw new Error('Configuration invalide: ckanApiUrl, csvUrl ou jsonUrl requis');
      }

      // Valider et filtrer les événements
      for (const event of result.events) {
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

        // Filtrer par date si sinceDate est fourni
        if (sinceDate && event.startDateTime < sinceDate) {
          result.skipped++;
          continue;
        }
      }

      // Retirer les événements invalides de la liste
      result.events = result.events.filter((event) => {
        const validation = this.validateEvent(event);
        return validation.valid;
      });

      return result;
    } catch (error: any) {
      result.errors.push({
        error: `Erreur lors de la récupération: ${error.message}`,
      });
      return result;
    }
  }

  /**
   * Récupère les événements depuis une API CKAN
   */
  private async fetchFromCKAN(
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<NormalizedEvent[]> {
    const events: NormalizedEvent[] = [];
    const ckanUrl = config.ckanApiUrl as string;
    const packageId = config.packageId as string;

    try {
      // Récupérer le package (dataset)
      const packageUrl = `${ckanUrl}/api/3/action/package_show?id=${packageId}`;
      const packageResponse = await fetch(packageUrl);
      if (!packageResponse.ok) {
        throw new Error(`Erreur CKAN: ${packageResponse.statusText}`);
      }

      const packageData: { result: CKANPackage } = await packageResponse.json();
      const resources = packageData.result.resources;

      // Trouver la ressource la plus récente (CSV ou JSON)
      const resource = resources
        .filter((r) => ['CSV', 'JSON'].includes(r.format.toUpperCase()))
        .sort((a, b) => {
          const dateA = a.last_modified ? new Date(a.last_modified).getTime() : 0;
          const dateB = b.last_modified ? new Date(b.last_modified).getTime() : 0;
          return dateB - dateA;
        })[0];

      if (!resource) {
        throw new Error('Aucune ressource CSV ou JSON trouvée dans le package');
      }

      // Parser selon le format
      if (resource.format.toUpperCase() === 'CSV') {
        const csvEvents = await this.fetchFromCSV(resource.url, config, sinceDate);
        events.push(...csvEvents);
      } else if (resource.format.toUpperCase() === 'JSON') {
        const jsonEvents = await this.fetchFromJSON(resource.url, config, sinceDate);
        events.push(...jsonEvents);
      }

      return events;
    } catch (error: any) {
      throw new Error(`Erreur CKAN: ${error.message}`);
    }
  }

  /**
   * Récupère les événements depuis un CSV
   */
  private async fetchFromCSV(
    url: string,
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<NormalizedEvent[]> {
    const events: NormalizedEvent[] = [];

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.statusText}`);
      }

      const csvText = await response.text();
      const lines = csvText.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        return events; // Pas de données
      }

      // Parser l'en-tête
      const headers = this.parseCSVLine(lines[0]);
      const mapping = config.mapping || this.getDefaultMapping(headers);

      // Parser les lignes
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          continue; // Ligne invalide
        }

        const event = this.mapCSVRowToEvent(headers, values, mapping, config);
        if (event) {
          events.push(event);
        }
      }

      return events;
    } catch (error: any) {
      throw new Error(`Erreur CSV: ${error.message}`);
    }
  }

  /**
   * Récupère les événements depuis un JSON
   */
  private async fetchFromJSON(
    url: string,
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<NormalizedEvent[]> {
    const events: NormalizedEvent[] = [];

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.statusText}`);
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : data.records || data.results || [];

      const mapping = config.mapping || {};

      for (const record of records) {
        const event = this.mapJSONRecordToEvent(record, mapping, config);
        if (event) {
          events.push(event);
        }
      }

      return events;
    } catch (error: any) {
      throw new Error(`Erreur JSON: ${error.message}`);
    }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Mapping par défaut pour CSV (à adapter selon la source)
   */
  private getDefaultMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    // Chercher les colonnes communes
    for (const header of headers) {
      const lower = header.toLowerCase();
      if (lower.includes('titre') || lower.includes('title') || lower.includes('nom')) {
        mapping.title = header;
      }
      if (lower.includes('description') || lower.includes('desc')) {
        mapping.description = header;
      }
      if (lower.includes('date') && lower.includes('debut')) {
        mapping.startDateTime = header;
      }
      if (lower.includes('date') && lower.includes('fin')) {
        mapping.endDateTime = header;
      }
      if (lower.includes('lieu') || lower.includes('venue') || lower.includes('endroit')) {
        mapping.venueName = header;
      }
      if (lower.includes('adresse') || lower.includes('address')) {
        mapping.address = header;
      }
      if (lower.includes('prix') || lower.includes('price') || lower.includes('tarif')) {
        mapping.price = header;
      }
    }

    return mapping;
  }

  /**
   * Mappe une ligne CSV vers un événement normalisé
   */
  private mapCSVRowToEvent(
    headers: string[],
    values: string[],
    mapping: Record<string, string>,
    config: ConnectorConfig
  ): NormalizedEvent | null {
    const getValue = (key: string): string | undefined => {
      const header = mapping[key];
      if (!header) return undefined;
      const index = headers.indexOf(header);
      return index >= 0 ? values[index] : undefined;
    };

    const title = getValue('title');
    const description = getValue('description') || title || '';
    const startDateStr = getValue('startDateTime');
    const venueName = getValue('venueName');

    if (!title || !startDateStr || !venueName) {
      return null; // Données insuffisantes
    }

    // Parser la date
    const startDateTime = this.parseDate(startDateStr);
    if (!startDateTime) {
      return null;
    }

    const event: NormalizedEvent = {
      externalId: `${config.sourceId || 'opendata'}-${Date.now()}-${Math.random()}`,
      title: title.trim(),
      description: this.cleanHtml(description.trim()),
      startDateTime,
      endDateTime: getValue('endDateTime') ? this.parseDate(getValue('endDateTime')!) : undefined,
      timezone: 'America/Montreal',
      venueName: venueName.trim(),
      address: getValue('address')?.trim(),
      city: 'Montréal',
      category: this.inferCategory(title, description),
      language: EventLanguage.FR,
      status: 'SCHEDULED',
    };

    // Prix
    const priceStr = getValue('price');
    if (priceStr) {
      const price = this.parsePrice(priceStr);
      if (price !== null) {
        if (price === 0) {
          event.isFree = true;
        } else {
          event.priceMin = price;
          event.priceMax = price;
          event.currency = 'CAD';
        }
      }
    }

    return event;
  }

  /**
   * Mappe un enregistrement JSON vers un événement normalisé
   */
  private mapJSONRecordToEvent(
    record: any,
    mapping: Record<string, string>,
    config: ConnectorConfig
  ): NormalizedEvent | null {
    const getValue = (key: string): any => {
      const path = mapping[key] || key;
      const parts = path.split('.');
      let value: any = record;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    };

    const title = getValue('title') || getValue('name') || getValue('nom');
    const description = getValue('description') || getValue('desc') || title || '';
    const startDateStr = getValue('startDateTime') || getValue('date') || getValue('start');
    const venueName = getValue('venueName') || getValue('venue') || getValue('lieu');

    if (!title || !startDateStr || !venueName) {
      return null;
    }

    const startDateTime = this.parseDate(startDateStr);
    if (!startDateTime) {
      return null;
    }

    const event: NormalizedEvent = {
      externalId: record.id || record._id || `${config.sourceId || 'opendata'}-${Date.now()}-${Math.random()}`,
      sourceUrl: getValue('url') || getValue('link'),
      title: String(title).trim(),
      description: this.cleanHtml(String(description).trim()),
      startDateTime,
      endDateTime: getValue('endDateTime') ? this.parseDate(getValue('endDateTime')) : undefined,
      timezone: 'America/Montreal',
      venueName: String(venueName).trim(),
      address: getValue('address')?.trim(),
      city: 'Montréal',
      category: this.inferCategory(String(title), String(description)),
      language: EventLanguage.FR,
      status: 'SCHEDULED',
    };

    // Coordonnées
    if (getValue('lat') && getValue('lon')) {
      event.lat = parseFloat(getValue('lat'));
      event.lon = parseFloat(getValue('lon'));
    }

    // Prix
    const price = getValue('price');
    if (price !== undefined && price !== null) {
      const priceNum = typeof price === 'number' ? price : this.parsePrice(String(price));
      if (priceNum !== null) {
        if (priceNum === 0) {
          event.isFree = true;
        } else {
          event.priceMin = priceNum;
          event.priceMax = priceNum;
          event.currency = 'CAD';
        }
      }
    }

    return event;
  }

  /**
   * Parse une date depuis une chaîne (supporte plusieurs formats)
   */
  private parseDate(dateStr: string | Date): Date | null {
    if (dateStr instanceof Date) {
      return dateStr;
    }

    if (typeof dateStr !== 'string') {
      return null;
    }

    // Essayer plusieurs formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
    ];

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      // Continue
    }

    return null;
  }

  /**
   * Parse un prix depuis une chaîne
   */
  private parsePrice(priceStr: string): number | null {
    // Enlever les symboles et espaces
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : Math.round(price * 100); // Convertir en cents
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
}

