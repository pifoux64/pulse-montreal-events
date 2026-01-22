/**
 * API Route pour voir les événements de mes amis
 * GET /api/users/friends/events - Récupère les événements favoris de mes amis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Récupérer les utilisateurs que je suis
    const following = await prisma.userFollow.findMany({
      where: {
        followerId: session.user.id,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({
        events: [],
        message: 'Vous ne suivez personne pour le moment',
      });
    }

    // Récupérer les favoris de mes amis pour des événements à venir
    const now = new Date();
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: {
          in: followingIds,
        },
        event: {
          startAt: {
            gte: now,
          },
          status: 'SCHEDULED',
        },
      },
      include: {
        event: {
          include: {
            venue: {
              select: {
                name: true,
                address: true,
                city: true,
                lat: true,
                lon: true,
              },
            },
            organizer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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
      take: limit * 2, // Prendre plus pour dédupliquer
    });

    // Dédupliquer par événement et regrouper par ami
    const eventsMap = new Map<string, {
      event: any;
      friends: Array<{ id: string; name: string | null; image: string | null }>;
    }>();

    favorites.forEach((favorite) => {
      const eventId = favorite.event.id;
      if (!eventsMap.has(eventId)) {
        eventsMap.set(eventId, {
          event: favorite.event,
          friends: [],
        });
      }
      const entry = eventsMap.get(eventId)!;
      if (!entry.friends.find((f) => f.id === favorite.user.id)) {
        entry.friends.push(favorite.user);
      }
    });

    // Convertir en array et limiter
    const events = Array.from(eventsMap.values())
      .slice(0, limit)
      .map((entry) => ({
        ...entry.event,
        friendsWhoFavorited: entry.friends,
      }));

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des événements des amis:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
