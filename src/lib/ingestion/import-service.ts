/**
 * Service d'import avec observabilité
 * SPRINT A: Architecture d'ingestion légale et durable
 */

import { prisma } from '@/lib/prisma';
import { Source, EventSource, ImportJobStatus, LegalStatus } from '@prisma/client';
import { IConnector, NormalizedEvent, ConnectorConfig } from './types';
import { checkDuplicate } from './deduplication';
import { OpenDataConnector } from './connectors/open-data-connector';
import { RSSConnector } from './connectors/rss-connector';
import { ICSConnector } from './connectors/ics-connector';

export interface ImportServiceResult {
  jobId: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration: number; // en millisecondes
}

/**
 * Service principal pour l'import d'événements depuis une source
 */
export class ImportService {
  /**
   * Exécute un import depuis une source
   */
  async importFromSource(sourceId: string): Promise<ImportServiceResult> {
    const startTime = Date.now();

    // Récupérer la source
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: { health: true },
    });

    if (!source) {
      throw new Error(`Source ${sourceId} non trouvée`);
    }

    if (!source.isEnabled) {
      throw new Error(`Source ${sourceId} est désactivée`);
    }

    if (source.legalStatus !== LegalStatus.VERIFIED) {
      console.warn(`⚠️ Source ${source.name} n'est pas vérifiée légalement (${source.legalStatus})`);
    }

    // Créer le job d'import
    const job = await prisma.importJob.create({
      data: {
        sourceId: source.id,
        source: source.eventSource,
        status: ImportJobStatus.RUNNING,
        startedAt: new Date(),
        runAt: new Date(),
      },
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorSamples: string[] = [];

  try {
      // Obtenir le connecteur approprié
      const connector = this.getConnector(source.type);
      if (!connector.isConfigured()) {
        throw new Error(`Connecteur ${source.type} non configuré`);
      }

      // Calculer sinceDate pour ingestion incrémentale
      const sinceDate = source.lastSyncAt || undefined;

      // Récupérer les événements depuis la source
      const config: ConnectorConfig = {
        ...(source.config as any),
        sourceId: source.id,
      };

      const importResult = await connector.fetchEvents(config, sinceDate);

      // Traiter chaque événement
      for (const event of importResult.events) {
        try {
          // Vérifier les doublons
          const duplicateCheck = await checkDuplicate(event, source.eventSource, source.id);

          if (duplicateCheck.isDuplicate && duplicateCheck.existingEventId) {
            // Mettre à jour l'événement existant
            await this.updateExistingEvent(
              duplicateCheck.existingEventId,
              event,
              source,
              duplicateCheck.confidence
            );
            updated++;
          } else {
            // Créer un nouvel événement
            await this.createNewEvent(event, source);
            inserted++;
          }
        } catch (error: any) {
          errors++;
          errorSamples.push(`${event.title}: ${error.message}`);
          if (errorSamples.length > 10) {
            errorSamples.shift(); // Garder seulement les 10 dernières erreurs
          }
        }
      }

      // Compter les événements ignorés
      skipped = importResult.skipped + importResult.errors.length;
      errors += importResult.errors.length;

      // Mettre à jour le job
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.SUCCESS,
          finishedAt: new Date(),
          insertedCount: inserted,
          updatedCount: updated,
          skippedCount: skipped,
          errorCount: errors,
          errorSample: errorSamples.length > 0 ? errorSamples.join('\n') : null,
          stats: {
            totalFetched: importResult.events.length + skipped,
            duplicatesFound: updated,
            newEvents: inserted,
            errors: errors,
          },
        },
      });

      // Mettre à jour la source
      await prisma.source.update({
        where: { id: source.id },
        data: {
          lastSyncAt: new Date(),
        },
      });

      // Mettre à jour la santé de la source
      await this.updateSourceHealth(source.id, true, null);

      const duration = Date.now() - startTime;

      return {
        jobId: job.id,
        inserted,
        updated,
        skipped,
        errors,
        duration,
      };
    } catch (error: any) {
      // Marquer le job comme erreur
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.ERROR,
          finishedAt: new Date(),
          errorText: error.message,
          errorCount: errors + 1,
        },
      });

      // Mettre à jour la santé de la source
      await this.updateSourceHealth(source.id, false, error.message);

      throw error;
    }
  }

  /**
   * Crée un nouvel événement depuis un événement normalisé
   */
  private async createNewEvent(
    event: NormalizedEvent,
    source: Source
  ): Promise<void> {
    // Trouver ou créer le venue
    let venueId: string | undefined;
    if (event.venueName) {
      // Recherche d'abord un venue existant
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: { equals: event.venueName, mode: 'insensitive' },
          city: event.city || 'Montréal',
        },
      });

      if (existingVenue) {
        venueId = existingVenue.id;
      } else {
        // Créer un nouveau venue
        const newVenue = await prisma.venue.create({
          data: {
            name: event.venueName,
            address: event.address || '',
            city: event.city || 'Montréal',
            postalCode: event.postalCode || '',
            lat: event.lat || 45.5088, // Coordonnées par défaut de Montréal
            lon: event.lon || -73.5542,
            neighborhood: event.neighborhood,
          },
        });
        venueId = newVenue.id;
      }
    }

    // Créer l'événement
    const createdEvent = await prisma.event.create({
      data: {
        source: source.eventSource,
        sourceId: event.externalId,
        title: event.title,
        description: event.description,
        startAt: event.startDateTime,
        endAt: event.endDateTime,
        timezone: event.timezone || 'America/Montreal',
        status: event.status || 'SCHEDULED',
        venueId,
        url: event.sourceUrl || event.ticketUrl,
        priceMin: event.priceMin,
        priceMax: event.priceMax,
        currency: event.currency || 'CAD',
        language: event.language || 'FR',
        imageUrl: event.imageUrl,
        tags: event.tags || [],
        category: event.category,
        subcategory: event.subcategory,
        accessibility: event.accessibility || [],
        ageRestriction: event.ageRestriction,
      },
    });

    // Créer le lien EventSourceLink
    await prisma.eventSourceLink.create({
      data: {
        eventId: createdEvent.id,
        sourceId: source.id,
        source: source.eventSource,
        sourceUrl: event.sourceUrl,
        externalId: event.externalId,
        isPrimary: true, // Première source = primaire
      },
    });

    // Ajouter les tags structurés si disponibles (via EventTag)
    // TODO: Implémenter l'enrichissement IA pour générer les tags
  }

  /**
   * Met à jour un événement existant
   */
  private async updateExistingEvent(
    eventId: string,
    event: NormalizedEvent,
    source: Source,
    confidence: number
  ): Promise<void> {
    // Vérifier si cette source est déjà liée à l'événement
    const existingLink = await prisma.eventSourceLink.findFirst({
      where: {
        eventId,
        sourceId: source.id,
      },
    });

    if (!existingLink) {
      // Ajouter le lien EventSourceLink (nouvelle source pour le même événement)
      await prisma.eventSourceLink.create({
        data: {
          eventId,
          sourceId: source.id,
          source: source.eventSource,
          sourceUrl: event.sourceUrl,
          externalId: event.externalId,
          isPrimary: false, // Source secondaire
        },
      });
    }

    // Mettre à jour l'événement si la confiance est élevée et que les données sont plus récentes
    if (confidence >= 0.8) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          // Mettre à jour seulement certains champs
          description: event.description, // Description peut être enrichie
          endAt: event.endDateTime || undefined,
          url: event.ticketUrl || undefined, // Mettre à jour l'URL si disponible
          // Ne pas écraser le venueId existant
        },
      });
    }
  }

  /**
   * Obtient le connecteur approprié selon le type de source
   */
  private getConnector(type: string): IConnector {
    switch (type) {
      case 'OPEN_DATA':
        return new OpenDataConnector();
      case 'RSS':
        return new RSSConnector();
      case 'ICS':
        return new ICSConnector();
      default:
        throw new Error(`Type de connecteur non supporté: ${type}`);
    }
  }

  /**
   * Met à jour la santé d'une source
   */
  private async updateSourceHealth(
    sourceId: string,
    success: boolean,
    errorMessage: string | null
  ): Promise<void> {
    const now = new Date();
    const health = await prisma.sourceHealth.findUnique({
      where: { sourceId },
    });

    if (success) {
      // Succès: réinitialiser les échecs consécutifs
      if (health) {
        await prisma.sourceHealth.update({
          where: { sourceId },
          data: {
            lastSuccessAt: now,
            consecutiveFailures: 0,
            lastErrorMessage: null,
            updatedAt: now,
          },
        });
      } else {
        await prisma.sourceHealth.create({
          data: {
            sourceId,
            lastSuccessAt: now,
            consecutiveFailures: 0,
            updatedAt: now,
          },
        });
      }
    } else {
      // Échec: incrémenter les échecs consécutifs
      const consecutiveFailures = (health?.consecutiveFailures || 0) + 1;

      if (health) {
        await prisma.sourceHealth.update({
          where: { sourceId },
          data: {
            lastErrorAt: now,
            consecutiveFailures,
            lastErrorMessage: errorMessage,
            updatedAt: now,
          },
        });
      } else {
        await prisma.sourceHealth.create({
          data: {
            sourceId,
            lastErrorAt: now,
            consecutiveFailures,
            lastErrorMessage: errorMessage,
            updatedAt: now,
          },
        });
      }

      // Désactiver la source si trop d'échecs consécutifs
      if (consecutiveFailures >= 3) {
        await prisma.source.update({
          where: { id: sourceId },
          data: { isEnabled: false },
        });
        console.error(`⚠️ Source ${sourceId} désactivée après ${consecutiveFailures} échecs consécutifs`);
      }
    }
  }
}

