/**
 * API: Track un clic sur partage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Log l'événement (pour l'instant, on log juste)
    // TODO: Créer une table analytics si nécessaire
    console.log('[Analytics] share_click', {
      userId: session?.user?.id,
      context: body.context,
      eventId: body.eventId,
      top5Slug: body.top5Slug,
      timestamp: body.timestamp,
    });

    // Optionnel: Stocker dans une table analytics
    // await prisma.analyticsEvent.create({...})

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST /api/analytics/share-click:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}

