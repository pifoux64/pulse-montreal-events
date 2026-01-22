/**
 * API Route pour les recommandations d'événements basées sur les utilisateurs suivis
 * GET /api/recommendations/following - Récupère les événements recommandés basés sur les utilisateurs suivis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recommendations/following - Récupère les événements recommandés
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Récupérer les utilisateurs suivis
    const following = await prisma.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    if (following.length === 0) {
      return NextResponse.json({
        events: [],
        message: 'Vous ne suivez personne. Suivez des utilisateurs pour voir leurs événements favoris!',
      });
    }

    const followingIds = following.map(f => f.followingId);

    // Récupérer les favoris des utilisateurs suivis
    const favoritesFromFollowing = await prisma.favorite.findMany({
      where: {
        userId: { in: followingIds },
        event: {
          startAt: { gte: new Date() }, // Seulement les événements futurs
          status: { in: ['SCHEDULED', 'UPDATED'] },
        },
      },
      include: {
        event: {
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
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2, // Prendre plus pour filtrer les doublons
    });

    // Grouper par événement et compter combien de personnes suivies l'ont favorisé
    const eventMap = new Map<string, {
      event: any;
      favoritedBy: Array<{ id: string; name: string | null; image: string | null }>;
      score: number;
    }>();

    for (const favorite of favoritesFromFollowing) {
      const eventId = favorite.event.id;
      
      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, {
          event: favorite.event,
          favoritedBy: [],
          score: 0,
        });
      }

      const entry = eventMap.get(eventId)!;
      entry.favoritedBy.push(favorite.user);
      entry.score = entry.favoritedBy.length; // Score = nombre de personnes suivies qui ont favorisé
    }

    // Convertir en tableau et trier par score décroissant
    const recommendedEvents = Array.from(eventMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(entry => ({
        ...entry.event,
        favoritedBy: entry.favoritedBy,
        recommendationScore: entry.score,
      }));

    return NextResponse.json({
      events: recommendedEvents,
      total: recommendedEvents.length,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
