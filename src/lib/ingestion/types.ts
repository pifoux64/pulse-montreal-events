/**
 * Types pour l'architecture d'ingestion générique
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import { EventSource, EventCategory, EventLanguage, EventStatus } from '@prisma/client';

/**
 * Événement normalisé produit par tous les connecteurs
 */
export interface NormalizedEvent {
  // Identifiants
  externalId: string; // ID unique sur la source externe
  sourceUrl?: string; // URL de l'événement sur la source

  // Métadonnées de base
  title: string;
  description: string;
  imageUrl?: string;

  // Dates et horaires
  startDateTime: Date;
  endDateTime?: Date;
  timezone: string; // Toujours "America/Montreal" pour Montréal

  // Lieu
  venueName: string;
  address?: string;
  city: string;
  postalCode?: string;
  lat?: number;
  lon?: number;
  neighborhood?: string;

  // Prix
  priceMin?: number; // en cents
  priceMax?: number; // en cents
  currency?: string; // "CAD" par défaut
  isFree?: boolean;

  // Catégorisation
  category: EventCategory;
  subcategory?: string;
  tags?: string[]; // Tags libres

  // Métadonnées supplémentaires
  language?: EventLanguage;
  ageRestriction?: string; // "All ages", "18+", "21+", etc.
  accessibility?: string[]; // ["wheelchair", "hearing_aid", etc.]

  // Tickets et liens
  ticketUrl?: string;
  organizerName?: string;
  organizerUrl?: string;

  // Lineup (pour musique)
  lineup?: string[];

  // Statut
  status?: EventStatus; // SCHEDULED par défaut
}

/**
 * Résultat d'un import de connecteur
 */
export interface ConnectorImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    externalId?: string;
    title?: string;
    error: string;
  }>;
  events: NormalizedEvent[]; // Événements normalisés récupérés
}

/**
 * Configuration d'un connecteur
 */
export interface ConnectorConfig {
  url?: string; // URL du flux/API
  apiKey?: string; // Clé API si nécessaire
  mapping?: Record<string, string>; // Mapping de champs personnalisé
  filters?: Record<string, any>; // Filtres spécifiques
  [key: string]: any; // Autres configurations spécifiques
}

/**
 * Interface que tous les connecteurs doivent implémenter
 */
export interface IConnector {
  /**
   * Nom du connecteur (pour logging)
   */
  getName(): string;

  /**
   * Type de connecteur
   */
  getType(): 'API' | 'RSS' | 'ICS' | 'OPEN_DATA' | 'MANUAL';

  /**
   * Vérifie si le connecteur est configuré correctement
   */
  isConfigured(): boolean;

  /**
   * Récupère et normalise les événements depuis la source
   * @param config Configuration du connecteur
   * @param sinceDate Date de début pour l'ingestion incrémentale (optionnel)
   */
  fetchEvents(
    config: ConnectorConfig,
    sinceDate?: Date
  ): Promise<ConnectorImportResult>;

  /**
   * Valide un événement normalisé avant l'import
   */
  validateEvent(event: NormalizedEvent): { valid: boolean; errors: string[] };
}

/**
 * Clés de déduplication pour un événement
 */
export interface DeduplicationKeys {
  normalizedTitle: string; // Titre normalisé (lowercase, sans accents, etc.)
  dateKey: string; // Clé de date (YYYY-MM-DD)
  venueKey: string; // Clé de venue (nom normalisé + ville)
  coordinates?: {
    lat: number;
    lon: number;
  };
  lineup?: string[]; // Pour musique: noms d'artistes normalisés
}

