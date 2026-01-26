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
  musicStyle: z.string().optional().nullable().describe('Style musical principal (si applicable)'),
  vibe: z.string().describe('Ambiance/atmosphère attendue (ex: warehouse, intime, festif)'),
  expectedAudience: z.string().describe('Public attendu (ex: 18-30 ans, mélomanes, familles)'),
  intensity: z.enum(['chill', 'moderate', 'high', 'very_high']).describe('Intensité (chill, moderate, high, very_high)'),
  danceLevel: z.enum(['none', 'low', 'medium', 'high']).optional().nullable().describe('Niveau de danse attendu'),
  culturalContext: z.string().optional().nullable().describe('Contexte culturel montréalais (quartier, scène, histoire)'),
  tags: z.array(z.object({
    category: z.enum(['genre', 'ambiance', 'time', 'crowd', 'accessibility']),
    value: z.string(),
    label: z.string(),
  })).default([]).describe('Tags visuels cliquables pour la découverte'),
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
      locale = 'fr', // Par défaut en français
    } = body;

    if (!eventId || !title) {
      return NextResponse.json(
        { error: 'eventId et title requis' },
        { status: 400 }
      );
    }

    // Construire les prompts selon la locale
    const prompts = {
      fr: {
        system: `Tu es un expert de la scène culturelle montréalaise. 
Tu génères des insights immersifs et éditoriaux sur les événements pour aider les gens à découvrir et comprendre rapidement si un événement leur convient.

Ton objectif:
- Décrire l'ambiance, le style, le public attendu en 2-3 phrases engageantes
- Expliquer le contexte culturel montréalais (quartier, scène, histoire)
- Identifier l'intensité (chill à very_high) et le niveau de danse si applicable
- Générer des tags cliquables pour la découverte (genre, ambiance, time, crowd, accessibility)

Style: Éditorial, immersif, authentique. Évite le marketing, sois descriptif et utile.

IMPORTANT: Tu dois toujours répondre avec un objet JSON valide, sans aucun texte ou formatage supplémentaire.`,
        user: `Génère un insight Pulse pour cet événement:

Titre: ${title}
Catégorie: ${category || 'Non spécifié'}
Description: ${description || 'Non disponible'}
Lieu: ${venue?.name || 'Non spécifié'}${venue?.neighborhood ? ` (${venue.neighborhood})` : ''}
Organisateur: ${organizer?.displayName || 'Non spécifié'}
${lineup.length > 0 ? `Line-up: ${lineup.join(', ')}` : ''}
Tags existants: ${tags.join(', ') || 'Aucun'}
Tags structurés: ${eventTags.map((t: any) => `${t.category}:${t.value}`).join(', ') || 'Aucun'}

IMPORTANT: Tu dois répondre avec un objet JSON valide contenant exactement ces champs:
{
  "summary": "Résumé immersif de 2-3 phrases",
  "musicStyle": "Style musical ou null si non applicable",
  "vibe": "Ambiance/atmosphère",
  "expectedAudience": "Public attendu",
  "intensity": "chill|moderate|high|very_high",
  "danceLevel": "none|low|medium|high ou null si non applicable",
  "culturalContext": "Contexte montréalais ou null",
  "tags": [
    {"category": "genre|ambiance|time|crowd|accessibility", "value": "valeur", "label": "libellé"}
  ]
}

Génère:
1. Un résumé immersif (2-3 phrases)
2. Style musical si applicable (sinon null)
3. Ambiance/vibe
4. Public attendu
5. Intensité (chill/moderate/high/very_high)
6. Niveau de danse si applicable (sinon null)
7. Contexte culturel montréalais (sinon null)
8. Tags cliquables pour découverte (tableau, peut être vide)`,
      },
      en: {
        system: `You are an expert on Montreal's cultural scene. 
You generate immersive and editorial insights about events to help people discover and quickly understand if an event suits them.

Your goal:
- Describe the atmosphere, style, expected audience in 2-3 engaging sentences
- Explain the Montreal cultural context (neighborhood, scene, history)
- Identify intensity (chill to very_high) and dance level if applicable
- Generate clickable tags for discovery (genre, ambiance, time, crowd, accessibility)

Style: Editorial, immersive, authentic. Avoid marketing, be descriptive and useful.

IMPORTANT: You must always respond with a valid JSON object, without any additional text or formatting.`,
        user: `Generate a Pulse insight for this event:

Title: ${title}
Category: ${category || 'Not specified'}
Description: ${description || 'Not available'}
Venue: ${venue?.name || 'Not specified'}${venue?.neighborhood ? ` (${venue.neighborhood})` : ''}
Organizer: ${organizer?.displayName || 'Not specified'}
${lineup.length > 0 ? `Line-up: ${lineup.join(', ')}` : ''}
Existing tags: ${tags.join(', ') || 'None'}
Structured tags: ${eventTags.map((t: any) => `${t.category}:${t.value}`).join(', ') || 'None'}

IMPORTANT: You must respond with a valid JSON object containing exactly these fields:
{
  "summary": "Immersive summary in 2-3 sentences",
  "musicStyle": "Main music style or null if not applicable",
  "vibe": "Atmosphere/vibe",
  "expectedAudience": "Expected audience",
  "intensity": "chill|moderate|high|very_high",
  "danceLevel": "none|low|medium|high or null if not applicable",
  "culturalContext": "Montreal context or null",
  "tags": [
    {"category": "genre|ambiance|time|crowd|accessibility", "value": "value", "label": "label"}
  ]
}

Generate:
1. An immersive summary (2-3 sentences)
2. Music style if applicable (otherwise null)
3. Atmosphere/vibe
4. Expected audience
5. Intensity (chill/moderate/high/very_high)
6. Dance level if applicable (otherwise null)
7. Montreal cultural context (otherwise null)
8. Clickable tags for discovery (array, can be empty)`,
      },
      es: {
        system: `Eres un experto de la escena cultural de Montreal. 
Generas insights inmersivos y editoriales sobre eventos para ayudar a las personas a descubrir y entender rápidamente si un evento les conviene.

Tu objetivo:
- Describir el ambiente, estilo, público esperado en 2-3 frases atractivas
- Explicar el contexto cultural de Montreal (barrio, escena, historia)
- Identificar la intensidad (chill a very_high) y el nivel de baile si aplica
- Generar etiquetas clicables para descubrimiento (género, ambiente, tiempo, multitud, accesibilidad)

Estilo: Editorial, inmersivo, auténtico. Evita el marketing, sé descriptivo y útil.

IMPORTANTE: Siempre debes responder con un objeto JSON válido, sin ningún texto o formato adicional.`,
        user: `Genera un insight Pulse para este evento:

Título: ${title}
Categoría: ${category || 'No especificado'}
Descripción: ${description || 'No disponible'}
Lugar: ${venue?.name || 'No especificado'}${venue?.neighborhood ? ` (${venue.neighborhood})` : ''}
Organizador: ${organizer?.displayName || 'No especificado'}
${lineup.length > 0 ? `Line-up: ${lineup.join(', ')}` : ''}
Etiquetas existentes: ${tags.join(', ') || 'Ninguna'}
Etiquetas estructuradas: ${eventTags.map((t: any) => `${t.category}:${t.value}`).join(', ') || 'Ninguna'}

IMPORTANTE: Debes responder con un objeto JSON válido que contenga exactamente estos campos:
{
  "summary": "Resumen inmersivo de 2-3 frases",
  "musicStyle": "Estilo musical o null si no aplica",
  "vibe": "Ambiente/vibra",
  "expectedAudience": "Público esperado",
  "intensity": "chill|moderate|high|very_high",
  "danceLevel": "none|low|medium|high o null si no aplica",
  "culturalContext": "Contexto de Montreal o null",
  "tags": [
    {"category": "genre|ambiance|time|crowd|accessibility", "value": "valor", "label": "etiqueta"}
  ]
}

Genera:
1. Un resumen inmersivo (2-3 frases)
2. Estilo musical si aplica (sino null)
3. Ambiente/vibra
4. Público esperado
5. Intensidad (chill/moderate/high/very_high)
6. Nivel de baile si aplica (sino null)
7. Contexto cultural de Montreal (sino null)
8. Etiquetas clicables para descubrimiento (array, puede estar vacío)`,
      },
    };

    const selectedPrompts = prompts[locale as 'fr' | 'en' | 'es'] || prompts.fr;
    const systemPrompt = selectedPrompts.system;
    const userPrompt = selectedPrompts.user;

    try {
      const result = await callOpenAI(
        systemPrompt,
        userPrompt,
        PulseInsightSchema,
        {
          model: 'gpt-4o-mini',
          temperature: 0.7, // Créatif mais cohérent
          cacheKey: `pulse-insight:${eventId}:${locale}`, // Inclure la locale dans la clé de cache
          cacheTTL: 86400, // Cache 24h
        }
      );

      return NextResponse.json(result.data);
    } catch (validationError: any) {
      // Si erreur de validation, logger les détails et retourner une réponse par défaut
      console.error('Erreur validation Pulse Insight:', validationError);
      
      // Retourner un insight par défaut plutôt qu'une erreur
      const fallbackMessages = {
        fr: {
          summary: `${title} est un événement ${category || 'culturel'} à Montréal.`,
          vibe: 'Ambiance à découvrir',
          expectedAudience: 'Public varié',
        },
        en: {
          summary: `${title} is a ${category || 'cultural'} event in Montreal.`,
          vibe: 'Atmosphere to discover',
          expectedAudience: 'Diverse audience',
        },
        es: {
          summary: `${title} es un evento ${category || 'cultural'} en Montreal.`,
          vibe: 'Ambiente por descubrir',
          expectedAudience: 'Público diverso',
        },
      };
      
      const fallback = fallbackMessages[locale as 'fr' | 'en' | 'es'] || fallbackMessages.fr;
      
      const fallbackInsight = {
        summary: fallback.summary,
        vibe: fallback.vibe,
        expectedAudience: fallback.expectedAudience,
        intensity: 'moderate' as const,
        tags: eventTags && eventTags.length > 0 
          ? eventTags.slice(0, 5).map((t: any) => ({
              category: t.category || 'genre',
              value: t.value,
              label: t.value,
            }))
          : [],
      };
      
      return NextResponse.json(fallbackInsight);
    }

  } catch (error: any) {
    console.error('Erreur génération Pulse Insight:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de l\'insight' },
      { status: 500 }
    );
  }
}
