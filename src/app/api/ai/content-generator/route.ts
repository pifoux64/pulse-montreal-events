/**
 * API Route pour le générateur de contenu (réseaux sociaux)
 * POST /api/ai/content-generator - Génère des posts Facebook/Instagram et un plan de communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai/client';
import { z } from 'zod';

const ContentGeneratorOutputSchema = z.object({
  communicationPlan: z.object({
    timeline: z.array(z.object({
      date: z.string().describe('Date relative (ex: "J-7", "Jour J")'),
      action: z.string().describe('Action à faire'),
      platform: z.string().describe('Plateforme (Facebook, Instagram, etc.)'),
      content: z.string().optional().describe('Contenu suggéré'),
    })).describe('Plan de communication avec timeline'),
    tips: z.array(z.string()).describe('Conseils pour maximiser la visibilité'),
  }),
  facebookPost: z.object({
    text: z.string().describe('Texte du post Facebook (avec emojis, hashtags)'),
    suggestedImage: z.string().optional().describe('Description de l\'image suggérée'),
  }),
  instagramPost: z.object({
    caption: z.string().describe('Légende Instagram (avec hashtags)'),
    hashtags: z.array(z.string()).describe('Hashtags pertinents (10-15)'),
    suggestedImage: z.string().optional().describe('Description de l\'image suggérée'),
  }),
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
    const { eventTitle, eventDescription, eventDate, eventLocation, eventUrl } = body;

    if (!eventTitle || !eventDescription || !eventDate) {
      return NextResponse.json(
        { error: 'eventTitle, eventDescription et eventDate requis' },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un expert en marketing événementiel et communication sur les réseaux sociaux à Montréal.
Tu crées des contenus engageants pour Facebook et Instagram qui maximisent la visibilité et l'engagement.

Contexte Montréal :
- Public bilingue (français/anglais)
- Scène culturelle active sur les réseaux sociaux
- Hashtags locaux populaires : #mtlevents #montreal #mtlmoments #quebecevents
- Ton adapté selon le type d'événement (festif, culturel, etc.)

Instructions :
- Crée un plan de communication avec timeline (J-14 à Jour J)
- Génère des posts Facebook engageants avec emojis et hashtags
- Génère des légendes Instagram avec hashtags pertinents
- Adapte le ton selon le type d'événement
- Inclus des call-to-action clairs
- Suggère des images si pertinent`;

    const userPrompt = `Crée un plan de communication et des posts pour cet événement :

Titre : ${eventTitle}
Description : ${eventDescription}
Date : ${eventDate}
${eventLocation ? `Lieu : ${eventLocation}` : ''}
${eventUrl ? `URL : ${eventUrl}` : ''}

Génère :
1. Un plan de communication avec timeline (J-14 à Jour J)
2. Un post Facebook complet avec texte et suggestions d'image
3. Une légende Instagram avec hashtags
4. Des conseils pour maximiser la visibilité`;

    const result = await callOpenAI(
      systemPrompt,
      userPrompt,
      ContentGeneratorOutputSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0.8, // Créatif pour le contenu marketing
        cacheKey: `content-gen:${Buffer.from(`${eventTitle}:${eventDate}`).toString('base64').substring(0, 32)}`,
        cacheTTL: 7200, // Cache 2h
      }
    );

    return NextResponse.json({
      ...result.data,
      cached: result.cached,
    });

  } catch (error: any) {
    console.error('Erreur lors de la génération de contenu:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la génération' },
      { status: 500 }
    );
  }
}
