/**
 * API Route pour les venues
 * GET /api/venues/[id] - Récupère les détails d'un venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/venues/[id] - Récupère les détails d'un venue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: params.id },
      include: {
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
          take: 10,
          include: {
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
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Lieu non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(venue);

  } catch (error) {
    console.error('Erreur lors de la récupération du venue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du venue' },
      { status: 500 }
    );
  }
}

