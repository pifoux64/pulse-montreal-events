/**
 * API Admin - Déclencher ingestion d'une source spécifique
 * POST /api/admin/ingest/[source] - Déclenche l'ingestion pour une source donnée
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { orchestrator } from '@/lib/orchestrator';
import { UserRole, EventSource } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/ingest/[source] - Déclenche l'ingestion pour une source spécifique
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { source: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    requireRole([UserRole.ADMIN])(session.user.role);

    // Décoder et valider que la source est valide
    const sourceParam = decodeURIComponent(params.source).toUpperCase();
    const source = sourceParam as EventSource;
    const validSources = Object.values(EventSource);
    
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { 
          error: 'Source invalide',
          received: sourceParam,
          validSources: validSources,
        },
        { status: 400 }
      );
    }

    logger.info(`Ingestion ${source} déclenchée manuellement par ${session.user.email}`);

    // Vérifier si le connecteur existe avant de déclencher
    // Note: Cette vérification ne peut pas être faite directement car connectors est privé
    // Mais runSingleSource() lancera une erreur si le connecteur n'existe pas
    
    // Déclencher l'ingestion pour cette source spécifique en arrière-plan
    orchestrator.runSingleSource(source)
      .then(stats => {
        logger.info(`Ingestion ${source} terminée:`, stats);
      })
      .catch(error => {
        logger.error(`Erreur lors de l'ingestion ${source}:`, error);
        // L'erreur sera visible dans le dashboard via ImportJob
      });

    return NextResponse.json({
      message: `Ingestion ${source} déclenchée avec succès`,
      source,
      timestamp: new Date().toISOString(),
      note: 'L\'ingestion se déroule en arrière-plan. Consultez le dashboard pour voir les résultats.',
    });

  } catch (error) {
    logger.error('Erreur lors du déclenchement de l\'ingestion:', error);
    
    if (error instanceof Error && error.message === 'Accès non autorisé') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors du déclenchement de l\'ingestion' },
      { status: 500 }
    );
  }
}

