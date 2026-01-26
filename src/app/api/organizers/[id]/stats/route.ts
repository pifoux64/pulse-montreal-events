/**
 * API Route pour les statistiques d'un organisateur
 * GET /api/organizers/[id]/stats - Récupère les statistiques 30 jours
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

/**
 * GET /api/organizers/[id]/stats - Récupère les statistiques de l'organisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier que l'utilisateur est authentifié et propriétaire ou admin
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const organizer = await prisma.organizer.findUnique({
      where: { id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    const isOwner = session.user?.id === organizer.userId;
    const isAdmin = session.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Récupérer tous les événements de l'organisateur
    const events = await prisma.event.findMany({
      where: { organizerId: id },
      include: {
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    // Récupérer les vues des 30 derniers jours
    const viewsLast30Days = await prisma.eventView.count({
      where: {
        event: {
          organizerId: id,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Récupérer toutes les vues
    const totalViews = await prisma.eventView.count({
      where: {
        event: {
          organizerId: id,
        },
      },
    });

    // Calculer les favoris (30 jours et total)
    const eventsWithFavorites = await prisma.event.findMany({
      where: {
        organizerId: id,
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

    // Pour les clics, on peut utiliser les vues comme approximation
    // ou créer une table EventClick séparée
    const clicksLast30Days = viewsLast30Days; // Approximation
    const totalClicks = totalViews; // Approximation

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

