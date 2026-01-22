/**
 * API Route pour l'assistant de création d'événement
 * POST /api/ai/event-assistant - Génère description, tags, styles musicaux à partir d'une description simple
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const EventAssistantOutputSchema = z.object({
  title: z.string().describe('Titre accrocheur de l\'événement'),
  description: z.string().describe('Description complète et engageante de l\'événement (200-500 mots)'),
  shortDescription: z.string().describe('Description courte pour les cartes (100-150 caractères)'),
  tags: z.array(z.string()).describe('Tags pertinents pour la recherche (5-10 tags)'),
  musicGenres: z.array(z.string()).optional().describe('Genres musicaux si applicable'),
  eventType: z.string().optional().describe('Type d\'événement (concert, dj_set, festival, etc.)'),
  ambiance: z.string().optional().describe('Ambiance recherchée (intime, grande_salle, underground, etc.)'),
  targetAudience: z.string().optional().describe('Public cible (tout_public, 18_plus, famille)'),
  suggestedPrice: z.number().optional().describe('Prix suggéré en dollars CAD (si applicable)'),
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
    const { userInput, eventType } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput requis (description de l\'événement)' },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un assistant expert en création d'événements culturels à Montréal. 
Tu aides les organisateurs à créer des descriptions engageantes, des tags pertinents et des suggestions pour leurs événements.

Contexte Montréal :
- Scène culturelle dynamique et diversifiée
- Public bilingue (français/anglais)
- Quartiers culturels : Plateau, Mile-End, Quartier des Spectacles, etc.
- Genres musicaux populaires : hip-hop, électronique, rock, jazz, reggae, etc.

Instructions :
- Génère un titre accrocheur et descriptif
- Crée une description complète qui donne envie (200-500 mots)
- Propose des tags pertinents pour la recherche (5-10 tags)
- Si c'est un événement musical, suggère des genres musicaux
- Identifie le type d'événement et l'ambiance
- Suggère un prix si pertinent (en CAD)
- Adapte le ton selon le type d'événement (festif pour club, sérieux pour théâtre, etc.)`;

    const userPrompt = `Crée un événement à partir de cette description :

"${userInput}"

${eventType ? `Type d'événement souhaité : ${eventType}` : ''}

Génère :
1. Un titre accrocheur
2. Une description complète et engageante
3. Une description courte (100-150 caractères)
4. Des tags pertinents (5-10)
5. Des genres musicaux si applicable
6. Le type d'événement
7. L'ambiance recherchée
8. Le public cible
9. Un prix suggéré si applicable (en dollars CAD)`;

    const result = await callOpenAI(
      systemPrompt,
      userPrompt,
      EventAssistantOutputSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0.7, // Plus créatif pour la génération de contenu
        cacheKey: `event-assistant:${Buffer.from(userInput).toString('base64').substring(0, 32)}`,
        cacheTTL: 3600, // Cache 1h
      }
    );

    return NextResponse.json({
      ...result.data,
      cached: result.cached,
    });

  } catch (error: any) {
    console.error('Erreur lors de la génération de l\'assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la génération' },
      { status: 500 }
    );
  }
}
