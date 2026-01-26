/**
 * API Route pour récupérer les événements d'un venue
 * GET /api/venues/[id]/events?limit=5&exclude=eventId
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const exclude = searchParams.get('exclude');

    const where: any = {
      venueId: id,
      status: {
        in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
      },
      startAt: {
        gte: new Date(),
      },
    };

    if (exclude) {
      where.id = { not: exclude };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        startAt: 'asc',
      },
      take: limit,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        eventTags: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements du venue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
