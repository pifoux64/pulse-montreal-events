/**
 * API Route pour générer les insights Pulse (résumé IA d'un événement)
 * POST /api/ai/pulse-insight - Génère un résumé immersif de l'événement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const PulseInsightSchema = z.object({
  summary: z.string().describe('Résumé immersif de 2-3 phrases décrivant l\'événement'),
  musicStyle: z.string().optional().describe('Style musical principal (si applicable)'),
  vibe: z.string().describe('Ambiance/atmosphère attendue (ex: warehouse, intime, festif)'),
  expectedAudience: z.string().describe('Public attendu (ex: 18-30 ans, mélomanes, familles)'),
  intensity: z.enum(['chill', 'moderate', 'high', 'very_high']).describe('Intensité (chill, moderate, high, very_high)'),
  danceLevel: z.enum(['none', 'low', 'medium', 'high']).optional().describe('Niveau de danse attendu'),
  culturalContext: z.string().optional().describe('Contexte culturel montréalais (quartier, scène, histoire)'),
  tags: z.array(z.object({
    category: z.enum(['genre', 'ambiance', 'time', 'crowd', 'accessibility']),
    value: z.string(),
    label: z.string(),
  })).describe('Tags visuels cliquables pour la découverte'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Optionnel: authentification (peut être public pour améliorer la découverte)
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Non authentifié' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const {
      eventId,
      title,
      description,
      category,
      tags = [],
      eventTags = [],
      venue,
      organizer,
      lineup = [],
    } = body;

    if (!eventId || !title) {
      return NextResponse.json(
        { error: 'eventId et title requis' },
        { status: 400 }
      );
    }

    // Construire le prompt contextuel pour Montréal
    const systemPrompt = `Tu es un expert de la scène culturelle montréalaise. 
Tu génères des insights immersifs et éditoriaux sur les événements pour aider les gens à découvrir et comprendre rapidement si un événement leur convient.

Ton objectif:
- Décrire l'ambiance, le style, le public attendu en 2-3 phrases engageantes
- Expliquer le contexte culturel montréalais (quartier, scène, histoire)
- Identifier l'intensité (chill à very_high) et le niveau de danse si applicable
- Générer des tags cliquables pour la découverte (genre, ambiance, time, crowd, accessibility)

Style: Éditorial, immersif, authentique. Évite le marketing, sois descriptif et utile.`;

    const userPrompt = `Génère un insight Pulse pour cet événement:

Titre: ${title}
Catégorie: ${category || 'Non spécifié'}
Description: ${description || 'Non disponible'}
Lieu: ${venue?.name || 'Non spécifié'}${venue?.neighborhood ? ` (${venue.neighborhood})` : ''}
Organisateur: ${organizer?.displayName || 'Non spécifié'}
${lineup.length > 0 ? `Line-up: ${lineup.join(', ')}` : ''}
Tags existants: ${tags.join(', ') || 'Aucun'}
Tags structurés: ${eventTags.map((t: any) => `${t.category}:${t.value}`).join(', ') || 'Aucun'}

Génère:
1. Un résumé immersif (2-3 phrases)
2. Style musical si applicable
3. Ambiance/vibe
4. Public attendu
5. Intensité (chill/moderate/high/very_high)
6. Niveau de danse si applicable
7. Contexte culturel montréalais
8. Tags cliquables pour découverte`;

    const result = await callOpenAI(
      systemPrompt,
      userPrompt,
      PulseInsightSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0.7, // Créatif mais cohérent
        cacheKey: `pulse-insight:${eventId}`,
        cacheTTL: 86400, // Cache 24h
      }
    );

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error('Erreur génération Pulse Insight:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de l\'insight' },
      { status: 500 }
    );
  }
}
