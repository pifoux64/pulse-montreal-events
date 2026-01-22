/**
 * API Route pour les organisateurs par slug
 * GET /api/organizers/slug/[slug] - Récupère les détails d'un organisateur par son slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/organizers/slug/[slug] - Récupère les détails d'un organisateur par slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const organizer = await prisma.organizer.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
          take: 20,
          select: {
            id: true,
            title: true,
            startAt: true,
            imageUrl: true,
            category: true,
          },
        },
        _count: {
          select: {
            events: true,
            followers: true,
          },
        },
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(organizer);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'organisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'organisateur' },
      { status: 500 }
    );
  }
}
