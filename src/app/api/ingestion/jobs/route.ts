/**
 * API pour récupérer les jobs d'import
 * GET /api/ingestion/jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sourceId = searchParams.get('sourceId');

    const jobs = await prisma.importJob.findMany({
      where: sourceId ? { sourceId } : undefined,
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      include: {
        sourceRef: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transformer pour inclure le nom de la source
    const transformedJobs = jobs.map((job) => ({
      id: job.id,
      source: job.sourceRef?.name || job.source,
      status: job.status,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      insertedCount: job.insertedCount,
      updatedCount: job.updatedCount,
      skippedCount: job.skippedCount,
      errorCount: job.errorCount,
      errorSample: job.errorSample,
    }));

    return NextResponse.json({ data: transformedJobs });
  } catch (error: any) {
    console.error('[API Jobs][GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des jobs' },
      { status: 500 }
    );
  }
}

