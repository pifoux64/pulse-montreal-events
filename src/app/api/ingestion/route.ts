/**
 * API Route pour déclencher l'ingestion d'événements - Pulse Montreal
 * POST /api/ingestion - Déclenche l'ingestion manuelle (admin uniquement)
 * GET /api/ingestion/status - Statut des dernières ingestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { orchestrator } from '@/lib/orchestrator';
import { UserRole, ImportJobStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/ingestion/status - Récupère le statut des ingestions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    requireRole([UserRole.ADMIN])(session.user.role);

    // Récupérer les derniers jobs d'import
    const recentJobs = await prisma.importJob.findMany({
      orderBy: { runAt: 'desc' },
      take: 20,
    });

    // Statistiques par source
    const statsBySource = await prisma.importJob.groupBy({
      by: ['source', 'status'],
      _count: {
        id: true,
      },
      where: {
        runAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
    });

    return NextResponse.json({
      recentJobs,
      statsBySource,
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du statut d\'ingestion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingestion - Déclenche l'ingestion manuelle
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    requireRole([UserRole.ADMIN])(session.user.role);

    // Vérifier qu'il n'y a pas déjà une ingestion en cours
    const runningJob = await prisma.importJob.findFirst({
      where: {
        status: ImportJobStatus.RUNNING,
      },
    });

    if (runningJob) {
      return NextResponse.json(
        { error: 'Une ingestion est déjà en cours' },
        { status: 409 }
      );
    }

    logger.info(`Ingestion manuelle déclenchée par ${session.user.email}`);

    // Déclencher l'ingestion en arrière-plan
    orchestrator.runIngestion()
      .then(results => {
        logger.info('Ingestion manuelle terminée:', results);
      })
      .catch(error => {
        logger.error('Erreur lors de l\'ingestion manuelle:', error);
      });

    return NextResponse.json({
      message: 'Ingestion déclenchée avec succès',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Erreur lors du déclenchement de l\'ingestion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du déclenchement de l\'ingestion' },
      { status: 500 }
    );
  }
}
