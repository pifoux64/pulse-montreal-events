/**
 * API Route pour les venues par slug
 * GET /api/venues/slug/[slug] - Récupère les détails d'un venue par son slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/venues/slug/[slug] - Récupère les détails d'un venue par slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const venue = await prisma.venue.findUnique({
      where: { slug: params.slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: false, // Ne pas exposer l'email
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
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    // Séparer les événements : à venir, ce week-end, passés
    const now = new Date();
    const thisWeekend = new Date(now);
    thisWeekend.setDate(now.getDate() + (6 - now.getDay())); // Dimanche de cette semaine
    thisWeekend.setHours(23, 59, 59, 999);

    const upcomingEvents = venue.events.filter(
      (e) => new Date(e.startAt) >= now
    );
    const weekendEvents = upcomingEvents.filter(
      (e) => new Date(e.startAt) <= thisWeekend
    );

    // Récupérer les événements passés (limité à 10)
    const pastEvents = await prisma.event.findMany({
      where: {
        venueId: venue.id,
        status: 'SCHEDULED',
        startAt: {
          lt: now,
        },
      },
      orderBy: {
        startAt: 'desc',
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
    });

    return NextResponse.json({
      ...venue,
      upcomingEvents,
      weekendEvents,
      pastEvents,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du venue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du venue' },
      { status: 500 }
    );
  }
}
