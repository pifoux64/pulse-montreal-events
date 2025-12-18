/**
 * Classe de base pour tous les connecteurs
 * SPRINT A: Architecture d'ingestion générique
 */

import { IConnector, NormalizedEvent, ConnectorConfig, ConnectorImportResult } from './types';

export abstract class BaseConnector implements IConnector {
  abstract getName(): string;
  abstract getType(): 'API' | 'RSS' | 'ICS' | 'OPEN_DATA' | 'MANUAL';

  isConfigured(): boolean {
    return true; // Par défaut, peut être surchargé
  }

  abstract fetchEvents(
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<ConnectorImportResult>;

  validateEvent(event: NormalizedEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation des champs requis
    if (!event.title || event.title.trim().length === 0) {
      errors.push('Le titre est requis');
    }

    if (!event.description || event.description.trim().length === 0) {
      errors.push('La description est requise');
    }

    if (!event.startDateTime) {
      errors.push('La date de début est requise');
    }

    if (!event.venueName || event.venueName.trim().length === 0) {
      errors.push('Le nom du lieu est requis');
    }

    if (!event.city || event.city.trim().length === 0) {
      errors.push('La ville est requise');
    }

    if (!event.externalId || event.externalId.trim().length === 0) {
      errors.push('L\'ID externe est requis');
    }

    // Validation des dates
    if (event.startDateTime && event.endDateTime) {
      if (event.endDateTime < event.startDateTime) {
        errors.push('La date de fin doit être après la date de début');
      }
    }

    // Validation des coordonnées si présentes
    if (event.lat !== undefined || event.lon !== undefined) {
      if (event.lat === undefined || event.lon === undefined) {
        errors.push('Les coordonnées doivent être complètes (lat et lon)');
      } else {
        if (event.lat < -90 || event.lat > 90) {
          errors.push('La latitude doit être entre -90 et 90');
        }
        if (event.lon < -180 || event.lon > 180) {
          errors.push('La longitude doit être entre -180 et 180');
        }
      }
    }

    // Validation du prix
    if (event.priceMin !== undefined && event.priceMax !== undefined) {
      if (event.priceMin < 0 || event.priceMax < 0) {
        errors.push('Les prix ne peuvent pas être négatifs');
      }
      if (event.priceMin > event.priceMax) {
        errors.push('Le prix minimum ne peut pas être supérieur au prix maximum');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalise un titre pour la déduplication
   */
  protected normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, ' ') // Normalise les espaces
      .trim();
  }

  /**
   * Normalise un nom de venue pour la déduplication
   */
  protected normalizeVenueName(venueName: string): string {
    return this.normalizeTitle(venueName);
  }

  /**
   * Extrait une clé de date (YYYY-MM-DD) depuis une date
   */
  protected getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Nettoie du HTML d'une description
   */
  protected cleanHtml(html: string): string {
    // Supprime les balises HTML
    let cleaned = html.replace(/<[^>]*>/g, '');
    // Décode les entités HTML
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    // Normalise les espaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
  }
}

