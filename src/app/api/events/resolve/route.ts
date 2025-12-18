import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventSource } from '@prisma/client';

// Résout un événement à partir de sa source + externalId (sourceId)
// Utilisé par la carte et le calendrier pour rediriger vers la page /evenement/[id]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get('source');
    const externalId = url.searchParams.get('externalId');

    if (!source || !externalId) {
      return NextResponse.json(
        { error: 'source et externalId sont requis' },
        { status: 400 }
      );
    }

    // Mapper la source string des APIs simples vers l’ENUM Prisma EventSource
    const normalizedSource = source.toUpperCase();

    const event = await prisma.event.findFirst({
      where: {
        source: normalizedSource as EventSource,
        sourceId: externalId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      return NextResponse.json({ id: null }, { status: 200 });
    }

    return NextResponse.json({ id: event.id }, { status: 200 });
  } catch (error) {
    console.error('[events/resolve] error', error);
    return NextResponse.json(
      { error: 'Erreur lors de la résolution de l’événement' },
      { status: 500 }
    );
  }
}


















