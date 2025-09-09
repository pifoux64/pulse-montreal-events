/**
 * Route CRON pour l'ingestion automatique d'événements - Pulse Montreal
 * Déclenchée par Vercel Cron toutes les 2 heures
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/ingestion - Ingestion automatique déclenchée par CRON
 */
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

    logger.info('Début de l\'ingestion automatique CRON');

    // Déclencher l'ingestion
    const results = await orchestrator.runIngestion();

    // Calculer les statistiques globales
    const totalStats = Object.values(results).reduce((acc, stats) => {
      if (stats) {
        acc.totalFetched += stats.totalFetched;
        acc.totalProcessed += stats.totalProcessed;
        acc.totalCreated += stats.totalCreated;
        acc.totalUpdated += stats.totalUpdated;
        acc.totalSkipped += stats.totalSkipped;
        acc.totalErrors += stats.totalErrors;
        acc.errors.push(...stats.errors);
      }
      return acc;
    }, {
      totalFetched: 0,
      totalProcessed: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      errors: [] as string[],
    });

    logger.info('Ingestion automatique CRON terminée:', {
      sources: Object.keys(results).length,
      ...totalStats,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sources: Object.keys(results).length,
      results,
      summary: totalStats,
    });

  } catch (error) {
    logger.error('Erreur lors de l\'ingestion automatique CRON:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
