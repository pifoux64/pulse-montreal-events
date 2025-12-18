/**
 * API: Événements similaires
 * GET /api/events/[id]/similar
 * SPRINT 2: Personalization & Recommendations
 * 
 * Retourne des événements similaires à l'événement donné
 * Basé sur: tags/genres communs, même catégorie, même quartier, popularité
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5', 10);

    // Récupérer l'événement de référence
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventTags: true,
        venue: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    // Extraire les caractéristiques de l'événement
    const eventGenres = event.eventTags
      .filter((t) => t.category === 'genre')
      .map((t) => t.value);
    const eventTags = event.tags || [];
    const eventCategory = event.category;
    const eventNeighborhood = event.venue?.neighborhood;

    // Récupérer les événements futurs similaires
    const now = new Date();
    const similarEvents = await prisma.event.findMany({
      where: {
        id: { not: eventId },
        status: {
          in: ['SCHEDULED', 'UPDATED'],
        },
        startAt: {
          gte: now,
        },
      },
      include: {
        venue: true,
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
      take: limit * 3, // Récupérer plus pour scorer et filtrer
    });

    // Scorer chaque événement
    const scored = similarEvents.map((e) => {
      let score = 0;

      // Score par genres communs (40%)
      const eGenres = e.eventTags.filter((t) => t.category === 'genre').map((t) => t.value);
      const commonGenres = eventGenres.filter((g) => eGenres.includes(g));
      if (commonGenres.length > 0) {
        score += 0.4 * (commonGenres.length / Math.max(eventGenres.length, eGenres.length));
      }

      // Score par tags communs (20%)
      const eTags = e.tags || [];
      const commonTags = eventTags.filter((t) => eTags.includes(t));
      if (commonTags.length > 0) {
        score += 0.2 * (commonTags.length / Math.max(eventTags.length, eTags.length));
      }

      // Score par catégorie (20%)
      if (e.category === eventCategory) {
        score += 0.2;
      }

      // Score par quartier (10%)
      if (eventNeighborhood && e.venue?.neighborhood === eventNeighborhood) {
        score += 0.1;
      }

      // Score par popularité (10%)
      const favoriteCount = e._count?.favorites || 0;
      score += 0.1 * Math.min(1, favoriteCount / 10);

      return { event: e, score };
    });

    // Trier et prendre les top N
    const topSimilar = scored
      .filter((s) => s.score > 0.1) // Seuil minimum
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.event);

    return NextResponse.json({
      similar: topSimilar,
      count: topSimilar.length,
    });
  } catch (error: any) {
    console.error('Erreur /api/events/[id]/similar:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de la récupération des événements similaires',
      },
      { status: 500 }
    );
  }
}



