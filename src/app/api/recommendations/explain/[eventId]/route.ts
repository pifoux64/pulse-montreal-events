/**
 * API pour expliquer pourquoi un événement est recommandé
 * GET /api/recommendations/explain/:eventId
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildUserMusicProfile } from '@/lib/recommendations/userProfileBuilder';
import { calculateEventScore, generateReasons } from '@/lib/recommendations/recommendationEngine';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { eventId } = params;

    // Récupérer l'événement avec ses tags
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        organizer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        eventTags: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Construire le profil utilisateur
    const userProfile = await buildUserMusicProfile(session.user.id);

    // Calculer le score et les raisons
    const score = calculateEventScore(event, userProfile);
    const reasons = generateReasons(event, userProfile, score);

    return NextResponse.json({
      eventId,
      score,
      reasons,
      explanation: reasons.length > 0
        ? reasons.join('. ')
        : 'Cet événement pourrait vous intéresser.',
    });
  } catch (error) {
    console.error('Erreur lors de l\'explication de la recommandation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

