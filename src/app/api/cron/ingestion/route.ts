/**
 * CRON Job pour l'ingestion automatique des sources
 * S'exécute toutes les heures pour vérifier les sources à synchroniser
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ImportService } from '@/lib/ingestion/import-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      logger.warn('Tentative d\'accès non autorisé au CRON d\'ingestion');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    logger.info('Début du CRON d\'ingestion automatique');

    const now = new Date();
    const importService = new ImportService();

    // Récupérer toutes les sources actives
    const sources = await prisma.source.findMany({
      where: {
        isEnabled: true,
      },
      include: {
        health: true,
      },
    });

    const results = [];

    for (const source of sources) {
      try {
        // Vérifier si la source doit être synchronisée
        const shouldSync = shouldSyncSource(source, now);

        if (!shouldSync) {
          logger.debug(`Source ${source.name} ignorée (pas encore le moment de synchroniser)`);
          continue;
        }

        logger.info(`Synchronisation de la source: ${source.name} (${source.type})`);

        const result = await importService.importFromSource(source.id);

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: true,
          ...result,
        });

        logger.info(
          `Source ${source.name} synchronisée: ${result.inserted} insérés, ${result.updated} mis à jour, ${result.skipped} ignorés, ${result.errors} erreurs`
        );
      } catch (error: any) {
        logger.error(`Erreur lors de la synchronisation de ${source.name}:`, error);

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: false,
          error: error.message,
        });
      }
    }

    logger.info(`CRON d'ingestion terminé. ${results.length} source(s) traitée(s).`);

    return NextResponse.json({
      success: true,
      message: 'Ingestion automatique terminée',
      results,
    });
  } catch (error: any) {
    logger.error('Erreur lors du CRON d\'ingestion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'ingestion automatique' },
      { status: 500 }
    );
  }
}

/**
 * Détermine si une source doit être synchronisée
 */
function shouldSyncSource(source: any, now: Date): boolean {
  // Si jamais synchronisée, synchroniser maintenant
  if (!source.lastSyncAt) {
    return true;
  }

  // Calculer le prochain run
  const lastSync = new Date(source.lastSyncAt);
  const nextRun = new Date(lastSync.getTime() + source.syncInterval * 1000);

  // Vérifier la santé de la source
  if (source.health?.consecutiveFailures >= 3) {
    // Source désactivée automatiquement, ne pas synchroniser
    return false;
  }

  // Si le prochain run est dans le passé ou maintenant, synchroniser
  return nextRun <= now;
}
