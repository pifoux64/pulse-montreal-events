import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMarkAsReadWhereClause } from '@/lib/event-feed';

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.parse(body);

    const where = buildMarkAsReadWhereClause({
      ids: parsed.ids,
      markAll: parsed.markAll,
      userId: session.user.id,
    });

    const result = await prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      updated: result.count,
    });
  } catch (error) {
    console.error('[Notifications][MarkAsRead] Erreur:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Impossible de marquer les notifications comme lues.' },
      { status: 500 }
    );
  }
}

