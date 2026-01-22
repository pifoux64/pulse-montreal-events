/**
 * API Route pour les statistiques d'une venue
 * GET /api/venues/[id]/stats - Récupère les statistiques d'une venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la venue existe et appartient à l'utilisateur
    const venue = await prisma.venue.findUnique({
      where: { id: params.id },
      select: { ownerUserId: true },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue non trouvée' },
        { status: 404 }
      );
    }

    if (venue.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer tous les événements de la venue
    const events = await prisma.event.findMany({
      where: {
        venueId: params.id,
      },
      include: {
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Récupérer les IDs des événements de la salle
    const venueEventIds = events.map(e => e.id);

    // Calculer les vues (via EventView)
    const totalViews = await prisma.eventView.count({
      where: {
        eventId: {
          in: venueEventIds,
        },
      },
    });

    const viewsLast30Days = await prisma.eventView.count({
      where: {
        eventId: {
          in: venueEventIds,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculer les favoris
    const eventsWithFavorites = await prisma.event.findMany({
      where: {
        venueId: params.id,
        favorites: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    const favoritesLast30Days = eventsWithFavorites.reduce(
      (sum, event) => sum + event._count.favorites,
      0
    );

    const totalFavorites = events.reduce(
      (sum, event) => sum + event._count.favorites,
      0
    );

    // Pour les clics, on utilise les vues comme approximation
    const clicksLast30Days = viewsLast30Days;
    const totalClicks = totalViews;

    const stats = {
      totalEvents: events.length,
      upcomingEvents: events.filter(
        (e) => new Date(e.startAt) > new Date()
      ).length,
      totalViews,
      totalClicks,
      totalFavorites,
      viewsLast30Days,
      clicksLast30Days,
      favoritesLast30Days,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
