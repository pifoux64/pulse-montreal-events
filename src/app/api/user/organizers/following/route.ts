/**
 * API pour récupérer les organisateurs suivis par l'utilisateur
 * GET /api/user/organizers/following - Liste des organisateurs suivis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/organizers/following
 * Récupère la liste des organisateurs suivis par l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const follows = await prisma.organizerFollow.findMany({
      where: { userId: session.user.id },
      include: {
        organizer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Récupérer les IDs des organisateurs
    const organizerIds = follows.map((f) => f.organizer.id);

    // Compter les événements à venir pour tous les organisateurs en une seule requête
    const eventsCounts = await prisma.event.groupBy({
      by: ['organizerId'],
      where: {
        organizerId: { in: organizerIds },
        status: 'SCHEDULED',
        startAt: {
          gte: new Date(),
        },
      },
      _count: {
        id: true,
      },
    });

    // Créer un map pour un accès rapide
    const eventsCountMap = new Map(
      eventsCounts.map((e) => [e.organizerId, e._count.id])
    );

    const organizers = follows.map((follow) => ({
      id: follow.organizer.id,
      slug: follow.organizer.slug,
      displayName: follow.organizer.displayName,
      website: follow.organizer.website,
      verified: follow.organizer.verified,
      user: follow.organizer.user,
      eventsCount: eventsCountMap.get(follow.organizer.id) || 0,
      followersCount: follow.organizer._count.followers,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      organizers,
      count: organizers.length,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des organisateurs suivis:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Erreur lors de la récupération des organisateurs suivis',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

