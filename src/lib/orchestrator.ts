/**
 * Orchestrateur d'ingestion d'événements pour Pulse Montreal
 * Coordonne l'import depuis toutes les sources externes
 */

import { prisma } from './prisma';
import { ImportJobStatus, EventSource, EventStatus } from '@prisma/client';
import { BaseConnector, UnifiedEvent, ImportStats } from '../ingestors/base';
import { EventbriteConnector } from '../ingestors/eventbrite';
import { QuartierSpectaclesConnector } from '../ingestors/quartier-spectacles';
import { TourismeMontrealaConnector } from '../ingestors/tourisme-montreal';
import { TicketmasterConnector } from '../ingestors/ticketmaster';
import { MeetupConnector } from '../ingestors/meetup';
import { LaVitrineConnector } from '../ingestors/lavitrine';
import { AllEventsConnector } from '../ingestors/allevents';
import {
  findPotentialDuplicates,
  resolveDuplicate,
  DeduplicationEvent,
} from './deduplication';
import { logger } from './logger';
import { enrichEventWithTags } from './tagging/eventTaggingService';

/**
 * Configuration d'un connecteur
 */
interface ConnectorConfig {
  source: EventSource;
  enabled: boolean;
  apiKey?: string;
  lastRun?: Date;
  batchSize: number;
}

/**
 * Orchestrateur principal d'ingestion
 */
export class IngestionOrchestrator {
  private connectors: Map<EventSource, BaseConnector> = new Map();
  private configs: ConnectorConfig[] = [];

  constructor() {
    this.initializeConnectors();
  }

  /**
   * Initialise tous les connecteurs disponibles
   */
  private initializeConnectors(): void {
    this.configs = [
      {
        source: EventSource.EVENTBRITE,
        enabled: !!process.env.EVENTBRITE_TOKEN,
        apiKey: process.env.EVENTBRITE_TOKEN,
        batchSize: 100,
      },
      {
        source: EventSource.QUARTIER_SPECTACLES,
        enabled: false, // Désactivé - événements de test uniquement, pas de vrai scraper
        batchSize: 30,
      },
      {
        source: EventSource.TOURISME_MONTREAL,
        enabled: false, // Désactivé pour éviter les événements de démo
        batchSize: 30,
      },
      {
        source: EventSource.TICKETMASTER,
        enabled: !!process.env.TICKETMASTER_API_KEY,
        apiKey: process.env.TICKETMASTER_API_KEY,
        batchSize: 200,
      },
      {
        source: EventSource.MEETUP,
        enabled: false,
        batchSize: 100,
      },
      {
        source: EventSource.LAVITRINE,
        enabled: false, // Désactivé pour éviter les événements de démo
        batchSize: 30,
      },
      {
        source: EventSource.ALLEVENTS,
        enabled: false, // Désactivé pour éviter les événements de démo
        batchSize: 50,
      },
      // TODO: Ajouter d'autres connecteurs
      // {
      //   source: EventSource.BANDSINTOWN,
      //   enabled: !!process.env.BANDSINTOWN_TOKEN,
      //   apiKey: process.env.BANDSINTOWN_TOKEN,
      //   batchSize: 50,
      // },
    ];

    // Initialiser les connecteurs activés
    for (const config of this.configs) {
      if (config.enabled) {
        switch (config.source) {
          case EventSource.EVENTBRITE:
            if (config.apiKey) {
              this.connectors.set(config.source, new EventbriteConnector(config.apiKey));
            }
            break;
          case EventSource.QUARTIER_SPECTACLES:
            this.connectors.set(config.source, new QuartierSpectaclesConnector());
            break;
          case EventSource.TOURISME_MONTREAL:
            this.connectors.set(config.source, new TourismeMontrealaConnector());
            break;
          case EventSource.TICKETMASTER:
            if (config.apiKey) {
              this.connectors.set(config.source, new TicketmasterConnector(config.apiKey));
            }
            break;
          case EventSource.MEETUP:
            this.connectors.set(config.source, new MeetupConnector(process.env.MEETUP_TOKEN));
            break;
          case EventSource.LAVITRINE:
            this.connectors.set(config.source, new LaVitrineConnector());
            break;
          case EventSource.ALLEVENTS:
            this.connectors.set(config.source, new AllEventsConnector());
            break;
          // Ajouter d'autres connecteurs ici
        }
      }
    }

    logger.info(`Orchestrateur initialisé avec ${this.connectors.size} connecteur(s)`);
  }

  /**
   * Lance l'ingestion pour toutes les sources
   */
  async runIngestion(): Promise<{ [key in EventSource]?: ImportStats }> {
    logger.info('Début de l\'ingestion globale');
    
    const results: { [key in EventSource]?: ImportStats } = {};
    
    for (const [source, connector] of this.connectors) {
      try {
        logger.info(`Début de l'ingestion ${source}`);
        const stats = await this.runSourceIngestion(source, connector);
        results[source] = stats;
        logger.info(`Ingestion ${source} terminée:`, stats);
      } catch (error) {
        logger.error(`Erreur lors de l'ingestion ${source}:`, error);
        results[source] = {
          totalFetched: 0,
          totalProcessed: 0,
          totalCreated: 0,
          totalUpdated: 0,
          totalSkipped: 0,
          totalErrors: 1,
          errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
          duration: 0,
        };
      }
    }

    logger.info('Ingestion globale terminée:', results);
    return results;
  }

  /**
   * Lance l'ingestion pour une source spécifique
   */
  async runSourceIngestion(source: EventSource, connector: BaseConnector): Promise<ImportStats> {
    const startTime = Date.now();
    const stats: ImportStats = {
      totalFetched: 0,
      totalProcessed: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalCancelled: 0,
      totalSkipped: 0,
      totalErrors: 0,
      errors: [],
      duration: 0,
    };

    // Créer un job d'import
    const importJob = await prisma.importJob.create({
      data: {
        source,
        status: ImportJobStatus.RUNNING,
        runAt: new Date(),
      },
    });

    try {
      // Récupérer la date de dernière exécution
      const lastJob = await prisma.importJob.findFirst({
        where: {
          source,
          status: ImportJobStatus.SUCCESS,
        },
        orderBy: {
          runAt: 'desc',
        },
      });

      const since = lastJob?.runAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
      const config = this.configs.find(c => c.source === source);
      const batchSize = config?.batchSize || 100;

      logger.info(`Récupération des événements ${source} depuis ${since.toISOString()}`);

      // Récupérer les événements depuis la source
      const rawEvents = await connector.listUpdatedSince(since, batchSize);
      stats.totalFetched = rawEvents.length;

      logger.info(`${rawEvents.length} événements récupérés depuis ${source}`);

      // Traiter chaque événement
      for (const rawEvent of rawEvents) {
        try {
          const unifiedEvent = await connector.mapToUnifiedEvent(rawEvent);
          const result = await this.processEvent(unifiedEvent);

          switch (result) {
            case 'created':
              stats.totalCreated++;
              stats.totalProcessed++;
              break;
            case 'updated':
              stats.totalUpdated++;
              stats.totalProcessed++;
              break;
            case 'cancelled':
              stats.totalCancelled++;
              stats.totalProcessed++;
              break;
            case 'skipped':
            default:
              stats.totalSkipped++;
              break;
          }

        } catch (error) {
          stats.totalErrors++;
          stats.errors.push(`Erreur traitement événement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          logger.error('Erreur lors du traitement d\'un événement:', error);
        }
      }

      stats.duration = Date.now() - startTime;

      // Marquer le job comme réussi
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: ImportJobStatus.SUCCESS,
          stats,
        },
      });

    } catch (error) {
      stats.duration = Date.now() - startTime;
      // Marquer le job comme échoué
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: ImportJobStatus.ERROR,
          errorText: error instanceof Error ? error.message : 'Erreur inconnue',
          stats,
        },
      });

      throw error;
    }

    return stats;
  }

  /**
   * Traite un événement unifié (déduplication + upsert)
   */
  private async processEvent(unifiedEvent: UnifiedEvent): Promise<'created' | 'updated' | 'cancelled' | 'skipped'> {
    if (unifiedEvent.status === EventStatus.CANCELLED) {
      const existing = await prisma.event.findFirst({
        where: {
          source: unifiedEvent.source,
          sourceId: unifiedEvent.sourceId,
        },
      });

      if (!existing) {
        logger.debug(`Annulation reçue sans événement existant: ${unifiedEvent.source}#${unifiedEvent.sourceId}`);
        return 'skipped';
      }

      await prisma.event.update({
        where: { id: existing.id },
        data: {
          status: EventStatus.CANCELLED,
          updatedAt: new Date(),
        },
      });

      logger.debug(`Événement annulé: ${unifiedEvent.title}`);
      return 'cancelled';
    }

    if (!this.validateUnifiedEvent(unifiedEvent)) {
      return 'skipped';
    }

    // Chercher les doublons potentiels
    const existingEvents = await this.getExistingEventsForDeduplication(unifiedEvent);
    const duplicates = await findPotentialDuplicates(
      this.toDeduplicationEvent(unifiedEvent),
      existingEvents.map(e => this.toDeduplicationEvent(e)),
      0.82 // Seuil de similarité
    );

    if (duplicates.length > 0) {
      const bestMatch = duplicates[0];
      const resolution = resolveDuplicate(
        this.toDeduplicationEvent(unifiedEvent),
        bestMatch.event
      );

      switch (resolution) {
        case 'keep_existing':
          logger.debug(`Doublon détecté, conservation de l'existant: ${unifiedEvent.title}`);
          return 'skipped';

        case 'replace':
          logger.debug(`Doublon détecté, remplacement: ${unifiedEvent.title}`);
          await this.updateEvent(bestMatch.event.id, unifiedEvent);
          return 'updated';

        case 'merge':
          // TODO: Implémenter la logique de merge si nécessaire
          logger.debug(`Doublon détecté, merge: ${unifiedEvent.title}`);
          await this.updateEvent(bestMatch.event.id, unifiedEvent);
          return 'updated';
      }
    }

    // Pas de doublon, créer un nouvel événement
    await this.createEvent(unifiedEvent);
    return 'created';
  }

  /**
   * Récupère les événements existants pour la déduplication
   */
  private async getExistingEventsForDeduplication(event: UnifiedEvent): Promise<any[]> {
    const dateRange = 24 * 60 * 60 * 1000; // 24 heures
    const startDate = new Date(event.startAt.getTime() - dateRange);
    const endDate = new Date(event.startAt.getTime() + dateRange);

    return await prisma.event.findMany({
      where: {
        startAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: EventStatus.CANCELLED,
        },
      },
      include: {
        venue: true,
      },
    });
  }

  /**
   * Convertit un événement vers le format de déduplication
   */
  private toDeduplicationEvent(event: any): DeduplicationEvent {
    return {
      id: event.id || 'new',
      title: event.title,
      startAt: event.startAt,
      venue: event.venue ? {
        lat: event.venue.lat,
        lon: event.venue.lon,
        name: event.venue.name,
      } : null,
      source: event.source || 'UNKNOWN',
      sourceId: event.sourceId,
    };
  }

  /**
   * Crée un nouvel événement
   */
  private async createEvent(unifiedEvent: UnifiedEvent): Promise<void> {
    // Créer ou récupérer le venue
    let venueId: string | undefined;
    if (unifiedEvent.venue) {
      // Chercher un venue existant par nom et coordonnées proches (rayon de 100m)
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: unifiedEvent.venue.name,
          lat: {
            gte: unifiedEvent.venue.lat - 0.001, // ~100m
            lte: unifiedEvent.venue.lat + 0.001,
          },
          lon: {
            gte: unifiedEvent.venue.lon - 0.001,
            lte: unifiedEvent.venue.lon + 0.001,
          },
        },
      });

      if (existingVenue) {
        venueId = existingVenue.id;
        // Mettre à jour les informations si nécessaire
        await prisma.venue.update({
          where: { id: existingVenue.id },
          data: {
            ...unifiedEvent.venue,
          },
        });
      } else {
        // Créer un nouveau venue avec un UUID valide
        const newVenue = await prisma.venue.create({
          data: {
            ...unifiedEvent.venue,
          },
        });
        venueId = newVenue.id;
      }
    }

    const created = await prisma.event.create({
      data: {
        source: unifiedEvent.source,
        sourceId: unifiedEvent.sourceId,
        title: unifiedEvent.title,
        description: unifiedEvent.description,
        startAt: unifiedEvent.startAt,
        endAt: unifiedEvent.endAt,
        timezone: unifiedEvent.timezone,
        status: unifiedEvent.status ?? EventStatus.SCHEDULED,
        venueId,
        url: unifiedEvent.url,
        priceMin: unifiedEvent.priceMin,
        priceMax: unifiedEvent.priceMax,
        currency: unifiedEvent.currency,
        language: unifiedEvent.language,
        imageUrl: unifiedEvent.imageUrl,
        tags: unifiedEvent.tags,
        category: unifiedEvent.category,
        subcategory: unifiedEvent.subcategory,
        accessibility: unifiedEvent.accessibility,
        ageRestriction: unifiedEvent.ageRestriction,
      },
    });

    // Enrichissement en tags structurés
    try {
      await enrichEventWithTags(created.id);
    } catch (error) {
      logger.error(
        `Erreur lors de l'enrichissement des tags pour l'événement créé ${created.id}:`,
        error,
      );
    }
  }

  /**
   * Met à jour un événement existant
   */
  private async updateEvent(eventId: string, unifiedEvent: UnifiedEvent): Promise<void> {
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: unifiedEvent.title,
        description: unifiedEvent.description,
        startAt: unifiedEvent.startAt,
        endAt: unifiedEvent.endAt,
        timezone: unifiedEvent.timezone,
        url: unifiedEvent.url,
        priceMin: unifiedEvent.priceMin,
        priceMax: unifiedEvent.priceMax,
        currency: unifiedEvent.currency,
        language: unifiedEvent.language,
        imageUrl: unifiedEvent.imageUrl,
        tags: unifiedEvent.tags,
        category: unifiedEvent.category,
        subcategory: unifiedEvent.subcategory,
        accessibility: unifiedEvent.accessibility,
        ageRestriction: unifiedEvent.ageRestriction,
        status: unifiedEvent.status ?? EventStatus.UPDATED,
        updatedAt: new Date(),
      },
    });

    // Recalcul des tags structurés après mise à jour
    try {
      await enrichEventWithTags(updated.id);
    } catch (error) {
      logger.error(
        `Erreur lors de l'enrichissement des tags pour l'événement mis à jour ${updated.id}:`,
        error,
      );
    }
  }

  /**
   * Valide qu'un événement unifié est correct
   */
  private validateUnifiedEvent(event: UnifiedEvent): boolean {
    if (event.status === EventStatus.CANCELLED) {
      return Boolean(event.source && event.sourceId);
    }

    return !!(
      event.title &&
      event.description &&
      event.startAt &&
      event.source &&
      event.sourceId &&
      event.category &&
      event.startAt > new Date()
    );
  }
}

/**
 * Instance singleton de l'orchestrateur
 */
export const orchestrator = new IngestionOrchestrator();
