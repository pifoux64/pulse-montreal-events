/**
 * API Route pour les suggestions IA pour salles
 * POST /api/ai/venue-suggestions - Génère des suggestions pour améliorer le remplissage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const VenueSuggestionsOutputSchema = z.object({
  slowDays: z.array(z.object({
    day: z.string().describe('Jour de la semaine (lundi, mardi, etc.)'),
    reason: z.string().describe('Pourquoi ce jour est creux'),
    suggestions: z.array(z.string()).describe('Suggestions pour remplir ce jour'),
  })).describe('Jours creux identifiés'),
  missingEventTypes: z.array(z.object({
    type: z.string().describe('Type d\'événement manquant'),
    potential: z.string().describe('Potentiel de remplissage'),
    examples: z.array(z.string()).describe('Exemples d\'événements de ce type'),
  })).describe('Types d\'événements manquants'),
  recommendations: z.array(z.string()).describe('Recommandations générales pour améliorer le remplissage'),
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

    // Récupérer les événements de la venue (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const events = await prisma.event.findMany({
      where: {
        venueId,
        startAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        startAt: true,
        category: true,
        tags: true,
        title: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
      orderBy: {
        startAt: 'desc',
      },
    });

    // Analyser les jours de la semaine
    const dayCounts: Record<string, number> = {
      lundi: 0,
      mardi: 0,
      mercredi: 0,
      jeudi: 0,
      vendredi: 0,
      samedi: 0,
      dimanche: 0,
    };

    events.forEach((event) => {
      const day = new Date(event.startAt).toLocaleDateString('fr-FR', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Analyser les types d'événements
    const eventTypes = new Set<string>();
    events.forEach((event) => {
      event.tags.forEach((tag) => eventTypes.add(tag));
      if (event.category) eventTypes.add(event.category);
    });

    // Préparer les données pour l'IA
    const eventsSummary = events.map((e) => ({
      date: new Date(e.startAt).toLocaleDateString('fr-FR'),
      day: new Date(e.startAt).toLocaleDateString('fr-FR', { weekday: 'long' }),
      title: e.title,
      category: e.category,
      tags: e.tags,
      favorites: e._count.favorites,
    }));

    const systemPrompt = `Tu es un expert en gestion de salles et optimisation de programmation à Montréal.
Tu analyses les données d'occupation d'une salle et proposes des stratégies pour améliorer le remplissage.

Contexte Montréal :
- Scène culturelle active avec des tendances saisonnières
- Jours creux typiques : lundi-mardi (sauf événements spéciaux)
- Types d'événements populaires : concerts, DJ sets, soirées, théâtre, expositions
- Public montréalais varié selon le type d'événement

Instructions :
- Identifie les jours creux (peu d'événements)
- Suggère des types d'événements manquants qui pourraient fonctionner
- Propose des recommandations concrètes et actionnables
- Adapte les suggestions au type de salle`;

    const userPrompt = `Analyse cette salle et propose des suggestions :

Salle : ${venue.name}
Capacité : ${venue.capacity || 'Non spécifiée'}
Types de salle : ${venue.types.join(', ') || 'Non spécifiés'}

Événements des 6 derniers mois (${events.length} événements) :
${JSON.stringify(eventsSummary.slice(0, 20), null, 2)}

Répartition par jour :
${JSON.stringify(dayCounts, null, 2)}

Types d'événements déjà programmés :
${Array.from(eventTypes).join(', ')}

Génère :
1. Les jours creux avec raisons et suggestions
2. Les types d'événements manquants avec potentiel
3. Des recommandations générales pour améliorer le remplissage`;

    let aiSuggestions: any = null;
    try {
      const result = await callOpenAI(
        systemPrompt,
        userPrompt,
        VenueSuggestionsOutputSchema,
        {
          model: 'gpt-4o-mini',
          temperature: 0.5,
          cacheKey: `venue-suggestions:${venueId}`,
          cacheTTL: 86400, // Cache 24h
        }
      );
      aiSuggestions = result.data;
    } catch (error) {
      console.warn('Erreur IA pour suggestions, utilisation des valeurs par défaut:', error);
    }

    // Calculs de base si l'IA échoue
    const slowDays = Object.entries(dayCounts)
      .filter(([_, count]) => count < events.length / 7)
      .map(([day, count]) => ({
        day,
        reason: `Seulement ${count} événement(s) sur cette période`,
        suggestions: [
          'Organiser des événements récurrents',
          'Proposer des tarifs réduits',
          'Cibler un public spécifique',
        ],
      }));

    const allEventCategories = ['MUSIC', 'THEATRE', 'EXHIBITION', 'FAMILY', 'SPORT', 'NIGHTLIFE', 'EDUCATION', 'COMMUNITY'];
    const missingTypes = allEventCategories
      .filter((cat) => !events.some((e) => e.category === cat))
      .map((type) => ({
        type,
        potential: 'Moyen à élevé',
        examples: [`Événements ${type.toLowerCase()}`],
      }));

    return NextResponse.json({
      slowDays: aiSuggestions?.slowDays || slowDays,
      missingEventTypes: aiSuggestions?.missingEventTypes || missingTypes,
      recommendations: aiSuggestions?.recommendations || [
        'Diversifiez les types d\'événements',
        'Organisez des événements récurrents les jours creux',
        'Partenairez avec des organisateurs locaux',
      ],
      stats: {
        totalEvents: events.length,
        averagePerWeek: (events.length / 26).toFixed(1),
        dayDistribution: dayCounts,
      },
    });

  } catch (error: any) {
    console.error('Erreur lors de la génération des suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la génération' },
      { status: 500 }
    );
  }
}
