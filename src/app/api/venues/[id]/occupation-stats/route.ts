/**
 * API Route pour les statistiques d'occupation d'une venue
 * GET /api/venues/[id]/occupation-stats - Calcule le taux d'occupation et les tendances
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

    // Vérifier que la venue appartient à l'utilisateur
    const venue = await prisma.venue.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        capacity: true,
        ownerUserId: true,
      },
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

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Récupérer les événements
    const allEvents = await prisma.event.findMany({
      where: {
        venueId: params.id,
        startAt: {
          gte: sixMonthsAgo,
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

    const upcomingEvents = allEvents.filter((e) => new Date(e.startAt) >= now);
    const pastEvents = allEvents.filter((e) => new Date(e.startAt) < now);
    const last3MonthsEvents = allEvents.filter((e) => new Date(e.startAt) >= threeMonthsAgo);

    // Calculer le taux d'occupation (événements par semaine)
    const weeksInPeriod = Math.ceil((now.getTime() - sixMonthsAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const eventsPerWeek = pastEvents.length / weeksInPeriod;

    // Analyser par jour de la semaine
    const dayDistribution: Record<string, number> = {
      lundi: 0,
      mardi: 0,
      mercredi: 0,
      jeudi: 0,
      vendredi: 0,
      samedi: 0,
      dimanche: 0,
    };

    pastEvents.forEach((event) => {
      const day = new Date(event.startAt).toLocaleDateString('fr-FR', { weekday: 'long' });
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    // Analyser par catégorie
    const categoryDistribution: Record<string, number> = {};
    pastEvents.forEach((event) => {
      categoryDistribution[event.category] = (categoryDistribution[event.category] || 0) + 1;
    });

    // Tendances (comparaison 3 derniers mois vs 3 mois précédents)
    const previous3MonthsEvents = allEvents.filter(
      (e) => new Date(e.startAt) >= sixMonthsAgo && new Date(e.startAt) < threeMonthsAgo
    );
    const trend = {
      events: {
        current: last3MonthsEvents.length,
        previous: previous3MonthsEvents.length,
        change: last3MonthsEvents.length - previous3MonthsEvents.length,
        changePercent: previous3MonthsEvents.length > 0
          ? ((last3MonthsEvents.length - previous3MonthsEvents.length) / previous3MonthsEvents.length) * 100
          : 0,
      },
      favorites: {
        current: last3MonthsEvents.reduce((sum, e) => sum + e._count.favorites, 0),
        previous: previous3MonthsEvents.reduce((sum, e) => sum + e._count.favorites, 0),
        change: 0,
        changePercent: 0,
      },
    };

    trend.favorites.change = trend.favorites.current - trend.favorites.previous;
    trend.favorites.changePercent = trend.favorites.previous > 0
      ? ((trend.favorites.current - trend.favorites.previous) / trend.favorites.previous) * 100
      : 0;

    // Jours les plus performants
    const dayPerformance: Record<string, { count: number; avgFavorites: number }> = {};
    Object.keys(dayDistribution).forEach((day) => {
      const dayEvents = pastEvents.filter(
        (e) => new Date(e.startAt).toLocaleDateString('fr-FR', { weekday: 'long' }) === day
      );
      dayPerformance[day] = {
        count: dayEvents.length,
        avgFavorites: dayEvents.length > 0
          ? dayEvents.reduce((sum, e) => sum + e._count.favorites, 0) / dayEvents.length
          : 0,
      };
    });

    return NextResponse.json({
      occupancy: {
        eventsPerWeek: Math.round(eventsPerWeek * 10) / 10,
        totalEvents: pastEvents.length,
        upcomingEvents: upcomingEvents.length,
        occupancyRate: weeksInPeriod > 0 ? Math.min(100, (eventsPerWeek / 7) * 100) : 0, // % de jours avec événements
      },
      distribution: {
        byDay: dayDistribution,
        byCategory: categoryDistribution,
      },
      trends: trend,
      performance: {
        byDay: dayPerformance,
        topCategories: Object.entries(categoryDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count })),
      },
    });

  } catch (error: any) {
    console.error('Erreur lors du calcul des stats d\'occupation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du calcul' },
      { status: 500 }
    );
  }
}
