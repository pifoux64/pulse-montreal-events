/**
 * API pour gérer les sources d'ingestion
 * GET: Liste toutes les sources
 * POST: Crée une nouvelle source
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SourceType, LegalStatus, EventSource } from '@prisma/client';

const createSourceSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(SourceType),
  eventSource: z.nativeEnum(EventSource),
  legalStatus: z.nativeEnum(LegalStatus).default(LegalStatus.PENDING_VERIFICATION),
  isEnabled: z.boolean().default(true),
  syncInterval: z.number().int().min(3600).default(43200), // Minimum 1h, défaut 12h
  config: z.record(z.any()),
  description: z.string().optional(),
  documentationUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const sources = await prisma.source.findMany({
      include: {
        health: true,
        _count: {
          select: {
            importJobs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: sources });
  } catch (error: any) {
    console.error('[API Sources][GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createSourceSchema.parse(body);

    const source = await prisma.source.create({
      data: {
        name: data.name,
        type: data.type,
        eventSource: data.eventSource,
        legalStatus: data.legalStatus,
        isEnabled: data.isEnabled,
        syncInterval: data.syncInterval,
        config: data.config,
        description: data.description,
        documentationUrl: data.documentationUrl,
      },
    });

    // Créer l'entrée de santé
    await prisma.sourceHealth.create({
      data: {
        sourceId: source.id,
        consecutiveFailures: 0,
      },
    });

    return NextResponse.json({ data: source }, { status: 201 });
  } catch (error: any) {
    console.error('[API Sources][POST] Erreur:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la source' },
      { status: 500 }
    );
  }
}

