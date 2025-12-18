/**
 * API: Social Kit pour un Pulse Picks (EditorialPost)
 * SPRINT 4: Génération de légendes + hashtags IG/FB
 *
 * GET /api/editorial/pulse-picks/[id]/social-kit
 * Réservé aux admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSocialKit } from '@/lib/editorial/socialKit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const post = await prisma.editorialPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Pulse Picks introuvable' }, { status: 404 });
    }

    const events = post.eventsOrder.length
      ? await prisma.event.findMany({
          where: {
            id: {
              in: post.eventsOrder,
            },
          },
          include: {
            eventTags: true,
          },
        })
      : [];

    const kit = generateSocialKit(post, events);

    return NextResponse.json({ kit });
  } catch (error: any) {
    console.error('Erreur GET /api/editorial/pulse-picks/[id]/social-kit:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du social kit' },
      { status: 500 },
    );
  }
}


