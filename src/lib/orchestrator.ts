/**
 * Orchestrateur d'ingestion d'événements pour Pulse Montreal
 * Coordonne l'import depuis toutes les sources externes
 */

import { prisma } from './prisma';
import { ImportJobStatus, EventSource, EventStatus } from '@prisma/client';
import { BaseConnector, UnifiedEvent, ImportStats } from '../ingestors/base';
import { EventbriteConnector } from '../ingestors/eventbrite';
import { 
  findPotentialDuplicates, 
  resolveDuplicate, 
  DeduplicationEvent 
} from './deduplication';
import { logger } from './logger';

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
      // TODO: Ajouter d'autres connecteurs
      // {
      //   source: EventSource.TICKETMASTER,
      //   enabled: !!process.env.TICKETMASTER_API_KEY,
      //   apiKey: process.env.TICKETMASTER_API_KEY,
      //   batchSize: 50,
      // },
    ];

    // Initialiser les connecteurs activés
    for (const config of this.configs) {
      if (config.enabled && config.apiKey) {
        switch (config.source) {
          case EventSource.EVENTBRITE:
            this.connectors.set(config.source, new EventbriteConnector(config.apiKey));
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
          
          if (!this.validateUnifiedEvent(unifiedEvent)) {
            stats.totalSkipped++;
            continue;
          }

          const result = await this.processEvent(unifiedEvent);
          
          if (result === 'created') {
            stats.totalCreated++;
          } else if (result === 'updated') {
            stats.totalUpdated++;
          } else {
            stats.totalSkipped++;
          }

          stats.totalProcessed++;

        } catch (error) {
          stats.totalErrors++;
          stats.errors.push(`Erreur traitement événement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          logger.error('Erreur lors du traitement d\'un événement:', error);
        }
      }

      // Marquer le job comme réussi
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: ImportJobStatus.SUCCESS,
          stats,
        },
      });

    } catch (error) {
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

    stats.duration = Date.now() - startTime;
    return stats;
  }

  /**
   * Traite un événement unifié (déduplication + upsert)
   */
  private async processEvent(unifiedEvent: UnifiedEvent): Promise<'created' | 'updated' | 'skipped'> {
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
      const venue = await prisma.venue.upsert({
        where: {
          // Clé composite basée sur coordonnées et nom
          id: `${unifiedEvent.venue.lat}_${unifiedEvent.venue.lon}_${unifiedEvent.venue.name}`.replace(/[^a-zA-Z0-9]/g, '_'),
        },
        create: {
          id: `${unifiedEvent.venue.lat}_${unifiedEvent.venue.lon}_${unifiedEvent.venue.name}`.replace(/[^a-zA-Z0-9]/g, '_'),
          ...unifiedEvent.venue,
        },
        update: {
          ...unifiedEvent.venue,
        },
      });
      venueId = venue.id;
    }

    await prisma.event.create({
      data: {
        source: unifiedEvent.source,
        sourceId: unifiedEvent.sourceId,
        title: unifiedEvent.title,
        description: unifiedEvent.description,
        startAt: unifiedEvent.startAt,
        endAt: unifiedEvent.endAt,
        timezone: unifiedEvent.timezone,
        status: EventStatus.SCHEDULED,
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
  }

  /**
   * Met à jour un événement existant
   */
  private async updateEvent(eventId: string, unifiedEvent: UnifiedEvent): Promise<void> {
    await prisma.event.update({
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
        status: EventStatus.UPDATED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Valide qu'un événement unifié est correct
   */
  private validateUnifiedEvent(event: UnifiedEvent): boolean {
    return !!(
      event.title &&
      event.description &&
      event.startAt &&
      event.source &&
      event.sourceId &&
      event.category &&
      event.startAt > new Date() // Événements futurs seulement
    );
  }
}

/**
 * Instance singleton de l'orchestrateur
 */
export const orchestrator = new IngestionOrchestrator();
