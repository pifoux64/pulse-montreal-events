/**
 * API pour déclencher un import depuis une source
 * POST /api/ingestion/sources/:id/import
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ImportService } from '@/lib/ingestion/import-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const sourceId = params.id;
    const importService = new ImportService();

    const result = await importService.importFromSource(sourceId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API Import][POST] Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de l\'import' },
      { status: 500 }
    );
  }
}

