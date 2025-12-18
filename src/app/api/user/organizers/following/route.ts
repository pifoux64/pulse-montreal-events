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
                events: {
                  where: {
                    status: 'SCHEDULED',
                    startAt: {
                      gte: new Date(),
                    },
                  },
                },
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

    const organizers = follows.map((follow) => ({
      id: follow.organizer.id,
      displayName: follow.organizer.displayName,
      website: follow.organizer.website,
      verified: follow.organizer.verified,
      user: follow.organizer.user,
      eventsCount: follow.organizer._count.events,
      followersCount: follow.organizer._count.followers,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      organizers,
      count: organizers.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des organisateurs suivis:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

