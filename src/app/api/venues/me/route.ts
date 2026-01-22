/**
 * API Route pour récupérer les venues d'un utilisateur
 * GET /api/venues/me - Récupère toutes les venues possédées par l'utilisateur connecté
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

    const venues = await prisma.venue.findMany({
      where: {
        ownerUserId: session.user.id,
      },
      include: {
        _count: {
          select: {
            events: true,
            requests: true,
          },
        },
        events: {
          where: {
            status: 'SCHEDULED',
            startAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 5, // Limiter à 5 événements à venir pour l'aperçu
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ venues });

  } catch (error) {
    console.error('Erreur lors de la récupération des venues:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des venues' },
      { status: 500 }
    );
  }
}
