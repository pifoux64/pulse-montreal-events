/**
 * Architecture commune des sources d'ingestion - Pulse Montreal
 * Interface standardisée pour tous les connecteurs
 */

import { EventSource } from '@prisma/client';
import { IngestionSource, IngestionResult } from './types';

/**
 * Registre des sources d'ingestion disponibles
 */
export class IngestionSourceRegistry {
  private sources: Map<EventSource, IngestionSource> = new Map();

  /**
   * Enregistre une source d'ingestion
   */
  register(source: IngestionSource): void {
    this.sources.set(source.source, source);
  }

  /**
   * Récupère une source par son type
   */
  get(source: EventSource): IngestionSource | undefined {
    return this.sources.get(source);
  }

  /**
   * Récupère toutes les sources activées
   */
  getEnabled(): IngestionSource[] {
    return Array.from(this.sources.values()).filter(s => s.enabled);
  }

  /**
   * Récupère toutes les sources (actives et inactives)
   */
  getAll(): IngestionSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Vérifie si une source est enregistrée
   */
  has(source: EventSource): boolean {
    return this.sources.has(source);
  }
}

/**
 * Instance globale du registre
 */
export const sourceRegistry = new IngestionSourceRegistry();

/**
 * Helper pour créer un résultat d'ingestion
 */
export function createIngestionResult(
  source: EventSource,
  startedAt: Date,
  result: {
    nbCreated: number;
    nbUpdated: number;
    nbSkipped: number;
    nbErrors: number;
    errors: string[];
  }
): IngestionResult {
  const finishedAt = new Date();
  const duration = finishedAt.getTime() - startedAt.getTime();

  return {
    source,
    startedAt,
    finishedAt,
    ...result,
    duration,
  };
}





