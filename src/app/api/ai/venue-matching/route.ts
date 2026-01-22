/**
 * API Route pour le matching intelligent d'organisateurs
 * POST /api/ai/venue-matching - Trouve des organisateurs compatibles avec une venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const MatchingOutputSchema = z.object({
  compatibleOrganizers: z.array(z.object({
    organizerId: z.string(),
    organizerName: z.string(),
    compatibilityScore: z.number().describe('Score de compatibilité (0-100)'),
    reasons: z.array(z.string()).describe('Raisons de la compatibilité'),
    pastEvents: z.number().describe('Nombre d\'événements similaires'),
  })),
  similarConcepts: z.array(z.object({
    eventId: z.string(),
    eventTitle: z.string(),
    venueName: z.string(),
    performance: z.string().describe('Performance (ex: "200 favoris, 500 vues")'),
    whySimilar: z.string().describe('Pourquoi ce concept est similaire'),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { venueId } = body;

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId requis' },
        { status: 400 }
      );
    }

    // Vérifier que la venue appartient à l'utilisateur
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        types: true,
        capacity: true,
        tags: true,
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

    // Récupérer les organisateurs actifs avec leurs événements
    const organizers = await prisma.organizer.findMany({
      include: {
        events: {
          where: {
            startAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            },
          },
          include: {
            venue: {
              select: {
                name: true,
                types: true,
                capacity: true,
              },
            },
            _count: {
              select: {
                favorites: true,
              },
            },
          },
          take: 10,
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      take: 50, // Limiter pour performance
    });

    // Récupérer des événements performants similaires
    const similarEvents = await prisma.event.findMany({
      where: {
        venue: {
          types: {
            hasSome: venue.types,
          },
          capacity: {
            gte: venue.capacity ? venue.capacity * 0.7 : undefined,
            lte: venue.capacity ? venue.capacity * 1.3 : undefined,
          },
        },
        startAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
      include: {
        venue: {
          select: {
            name: true,
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
        _count: {
          select: {
            favorites: true,
          },
        },
      },
      orderBy: {
        favorites: {
          _count: 'desc',
        },
      },
      take: 20,
    });

    // Préparer les données pour l'IA
    const organizersData = organizers
      .filter((org) => org.events.length > 0)
      .map((org) => ({
        id: org.id,
        name: org.displayName || org.user.name || 'Organisateur',
        events: org.events.map((e) => ({
          title: e.title,
          category: e.category,
          tags: e.tags,
          venueTypes: e.venue?.types || [],
          venueCapacity: e.venue?.capacity,
          favorites: e._count.favorites,
        })),
      }));

    const eventsData = similarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      venueName: e.venue?.name || 'Inconnu',
      category: e.category,
      tags: e.tags,
      favorites: e._count.favorites,
    }));

    const systemPrompt = `Tu es un expert en mise en relation entre salles et organisateurs à Montréal.
Tu analyses la compatibilité entre une salle et des organisateurs pour proposer des matchings pertinents.

Contexte Montréal :
- Scène culturelle avec différents types d'organisateurs (locaux, internationaux, émergents)
- Compatibilité basée sur : types d'événements, capacité, style, historique
- Performance mesurée par : favoris, vues, engagement

Instructions :
- Calcule un score de compatibilité (0-100) pour chaque organisateur
- Identifie les raisons de compatibilité
- Trouve des concepts similaires performants
- Propose des matchings actionnables`;

    const userPrompt = `Trouve des organisateurs compatibles et des concepts similaires pour cette salle :

Salle : ${venue.name}
Types : ${venue.types.join(', ') || 'Non spécifiés'}
Capacité : ${venue.capacity || 'Non spécifiée'}
Tags : ${venue.tags.join(', ') || 'Aucun'}

Organisateurs à analyser (${organizersData.length}) :
${JSON.stringify(organizersData.slice(0, 10), null, 2)}

Événements performants similaires (${eventsData.length}) :
${JSON.stringify(eventsData.slice(0, 10), null, 2)}

Génère :
1. Les organisateurs compatibles avec score et raisons (top 5)
2. Les concepts similaires performants (top 5)`;

    let aiMatching: any = null;
    try {
      const result = await callOpenAI(
        systemPrompt,
        userPrompt,
        MatchingOutputSchema,
        {
          model: 'gpt-4o-mini',
          temperature: 0.4,
          cacheKey: `venue-matching:${venueId}`,
          cacheTTL: 86400, // Cache 24h
        }
      );
      aiMatching = result.data;
    } catch (error) {
      console.warn('Erreur IA pour matching, utilisation des calculs de base:', error);
    }

    // Calculs de base si l'IA échoue
    const compatibleOrganizers = organizersData
      .map((org) => {
        const matchingEvents = org.events.filter((e) => {
          const typeMatch = venue.types.length === 0 || e.venueTypes.some((vt) => venue.types.includes(vt));
          const capacityMatch = !venue.capacity || !e.venueCapacity || 
            (e.venueCapacity >= venue.capacity * 0.7 && e.venueCapacity <= venue.capacity * 1.3);
          return typeMatch && capacityMatch;
        });
        const score = matchingEvents.length > 0 ? Math.min(100, matchingEvents.length * 20) : 0;
        return {
          organizerId: org.id,
          organizerName: org.name,
          compatibilityScore: score,
          reasons: matchingEvents.length > 0 
            ? [`${matchingEvents.length} événement(s) similaire(s)`, 'Types de salle compatibles']
            : ['Aucun événement similaire trouvé'],
          pastEvents: matchingEvents.length,
        };
      })
      .filter((org) => org.compatibilityScore > 0)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5);

    const similarConcepts = eventsData
      .map((e) => ({
        eventId: e.id,
        eventTitle: e.title,
        venueName: e.venueName,
        performance: `${e.favorites} favoris`,
        whySimilar: `Même catégorie (${e.category}) et tags similaires`,
      }))
      .slice(0, 5);

    return NextResponse.json({
      compatibleOrganizers: aiMatching?.compatibleOrganizers || compatibleOrganizers,
      similarConcepts: aiMatching?.similarConcepts || similarConcepts,
    });

  } catch (error: any) {
    console.error('Erreur lors du matching:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du matching' },
      { status: 500 }
    );
  }
}
