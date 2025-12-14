/**
 * Types partagés pour le système d'ingestion - Pulse Montreal
 */

import { EventSource, ImportJobStatus } from '@prisma/client';
import { UnifiedEvent } from '../ingestors/base';

/**
 * Résultat d'une ingestion de source
 */
export interface IngestionResult {
  source: EventSource;
  startedAt: Date;
  finishedAt: Date;
  nbCreated: number;
  nbUpdated: number;
  nbSkipped: number;
  nbErrors: number;
  errors: string[];
  duration: number; // en millisecondes
}

/**
 * Interface standardisée pour une source d'ingestion
 */
export interface IngestionSource {
  /** Nom lisible de la source */
  name: string;
  
  /** Type de source (enum EventSource) */
  source: EventSource;
  
  /** Source activée ou non */
  enabled: boolean;
  
  /**
   * Exécute l'ingestion pour cette source
   * @returns Résultat détaillé de l'ingestion
   */
  run: () => Promise<IngestionResult>;
}

/**
 * Options de configuration pour une source
 */
export interface SourceConfig {
  source: EventSource;
  enabled: boolean;
  apiKey?: string;
  batchSize?: number;
  rateLimitPerSecond?: number;
  [key: string]: any;
}





