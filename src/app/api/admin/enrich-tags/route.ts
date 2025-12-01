import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, EventStatus } from '@prisma/client';
import { enrichEventWithTags } from '@/lib/tagging/eventTaggingService';

/**
 * POST /api/admin/enrich-tags
 *
 * Recalcule les tags structurés (EventTag) pour un batch d'événements.
 * Réservé aux admins.
 *
 * Query params :
 *  - limit (optionnel, défaut 100)
 *  - offset (optionnel, défaut 0)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
  }

  requireRole([UserRole.ADMIN])(session.user.role);

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const events = await prisma.event.findMany({
    where: { status: EventStatus.SCHEDULED },
    select: { id: true },
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const e of events) {
    try {
      await enrichEventWithTags(e.id);
      results.push({ id: e.id, ok: true });
    } catch (err: any) {
      results.push({
        id: e.id,
        ok: false,
        error: err?.message || 'Erreur inconnue',
      });
    }
  }

  return NextResponse.json({
    count: results.length,
    offset,
    limit,
    results,
  });
}


