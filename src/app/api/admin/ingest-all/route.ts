/**
 * API Admin - Déclencher ingestion de toutes les sources
 * POST /api/admin/ingest-all - Déclenche l'ingestion pour toutes les sources actives
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { orchestrator } from '@/lib/orchestrator';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/ingest-all - Déclenche l'ingestion pour toutes les sources
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

    logger.info(`Ingestion complète déclenchée manuellement par ${session.user.email}`);

    // Déclencher l'ingestion en arrière-plan
    orchestrator.runIngestion()
      .then(results => {
        logger.info('Ingestion complète terminée:', {
          sources: Object.keys(results).length,
          results,
        });
      })
      .catch(error => {
        logger.error('Erreur lors de l\'ingestion complète:', error);
      });

    return NextResponse.json({
      message: 'Ingestion complète déclenchée avec succès',
      timestamp: new Date().toISOString(),
      note: 'L\'ingestion se déroule en arrière-plan. Consultez le dashboard pour voir les résultats.',
    });

  } catch (error) {
    logger.error('Erreur lors du déclenchement de l\'ingestion complète:', error);
    
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



