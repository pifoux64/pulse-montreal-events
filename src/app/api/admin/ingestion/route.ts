/**
 * API Admin - Dashboard Ingestion
 * GET /api/admin/ingestion - Statistiques et historique des imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, EventSource } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/ingestion - Récupère les statistiques d'ingestion
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

    // Récupérer les derniers jobs d'import (50 derniers)
    const recentJobs = await prisma.importJob.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,
      select: {
        id: true,
        source: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        runAt: true,
        nbCreated: true,
        nbUpdated: true,
        nbSkipped: true,
        nbErrors: true,
        errorText: true,
        stats: true,
      },
    });

    // Récupérer le nombre d'événements par source
    const eventsBySource = await prisma.event.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where: {
        status: {
          in: ['SCHEDULED', 'UPDATED'],
        },
      },
    });

    // Récupérer le dernier import par source
    const lastImportsBySource = await prisma.importJob.findMany({
      where: {
        runAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
      orderBy: {
        runAt: 'desc',
      },
      select: {
        source: true,
        status: true,
        startedAt: true,
        runAt: true,
      },
    });

    // Construire les statistiques par source
    const sourceStatsMap = new Map<EventSource, {
      totalEvents: number;
      lastImport?: string;
      lastStatus?: string;
      successCount: number;
      errorCount: number;
    }>();

    // Initialiser avec les compteurs d'événements
    eventsBySource.forEach(({ source, _count }) => {
      sourceStatsMap.set(source, {
        totalEvents: _count.id,
        successCount: 0,
        errorCount: 0,
      });
    });

    // Ajouter les infos des derniers imports
    const sourceLastImportMap = new Map<EventSource, { startedAt: Date; status: string }>();
    lastImportsBySource.forEach((job) => {
      const existing = sourceLastImportMap.get(job.source);
      const jobDate = job.startedAt || job.runAt;
      if (!existing || new Date(jobDate) > existing.startedAt) {
        sourceLastImportMap.set(job.source, {
          startedAt: jobDate,
          status: job.status,
        });
      }
    });

    // Compter les succès/erreurs par source (30 derniers jours)
    const jobStats = await prisma.importJob.groupBy({
      by: ['source', 'status'],
      _count: {
        id: true,
      },
      where: {
        runAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Construire le résultat final
    const sourceStats: Array<{
      source: EventSource;
      totalEvents: number;
      lastImport?: string;
      lastStatus?: string;
      successCount: number;
      errorCount: number;
    }> = [];

    // Parcourir toutes les sources possibles
    const allSources = Object.values(EventSource);
    
    for (const source of allSources) {
      const stats = sourceStatsMap.get(source) || {
        totalEvents: 0,
        successCount: 0,
        errorCount: 0,
      };

      const lastImport = sourceLastImportMap.get(source);
      if (lastImport) {
        stats.lastImport = lastImport.startedAt.toISOString();
        stats.lastStatus = lastImport.status;
      }

      // Compter les succès et erreurs
      jobStats.forEach((stat) => {
        if (stat.source === source) {
          if (stat.status === 'SUCCESS') {
            stats.successCount = stat._count.id;
          } else if (stat.status === 'ERROR') {
            stats.errorCount = stat._count.id;
          }
        }
      });

      sourceStats.push({
        source,
        ...stats,
      });
    }

    // Trier par nombre d'événements décroissant
    sourceStats.sort((a, b) => b.totalEvents - a.totalEvents);

    return NextResponse.json({
      recentJobs,
      sourceStats,
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques d\'ingestion:', error);
    
    if (error instanceof Error && error.message === 'Accès non autorisé') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

