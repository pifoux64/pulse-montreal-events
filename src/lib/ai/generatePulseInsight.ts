/**
 * Génération du Pulse Insight (résumé IA) pour un événement.
 * Utilisé à la création d'événement et par l'API POST /api/ai/pulse-insight.
 */

import { z } from 'zod';
import { callOpenAI } from '@/lib/ai/client';

export const PulseInsightSchema = z.object({
  summary: z.string().describe('Résumé immersif de 2-3 phrases décrivant l\'événement'),
  musicStyle: z.string().optional().nullable().describe('Style musical principal (si applicable)'),
  vibe: z.string().describe('Ambiance/atmosphère attendue'),
  expectedAudience: z.string().describe('Public attendu'),
  intensity: z.enum(['chill', 'moderate', 'high', 'very_high']).describe('Intensité'),
  danceLevel: z.enum(['none', 'low', 'medium', 'high']).optional().nullable().describe('Niveau de danse attendu'),
  culturalContext: z.string().optional().nullable().describe('Contexte culturel montréalais'),
  tags: z.array(z.object({
    category: z.enum(['genre', 'ambiance', 'time', 'crowd', 'accessibility']),
    value: z.string(),
    label: z.string(),
  })).default([]).describe('Tags visuels cliquables'),
});

export type PulseInsightResult = z.infer<typeof PulseInsightSchema>;

export interface GeneratePulseInsightInput {
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  eventTags?: Array<{ category: string; value: string }>;
  venue?: { name?: string | null; neighborhood?: string | null } | null;
  organizer?: { displayName?: string | null } | null;
  lineup?: string[];
}

function buildFrUser(input: GeneratePulseInsightInput): string {
  const venueLine = `${input.venue?.name || 'Non spécifié'}${input.venue?.neighborhood ? ` (${input.venue.neighborhood})` : ''}`;
  const eventTagsStr = (input.eventTags ?? []).map((t) => `${t.category}:${t.value}`).join(', ') || 'Aucun';
  return `Génère un insight Pulse pour cet événement:

Titre: ${input.title}
Catégorie: ${input.category || 'Non spécifié'}
Description: ${input.description || 'Non disponible'}
Lieu: ${venueLine}
Organisateur: ${input.organizer?.displayName || 'Non spécifié'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}
Tags existants: ${(input.tags ?? []).join(', ') || 'Aucun'}
Tags structurés: ${eventTagsStr}

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
1. Un résumé immersif (2-3 phrases) qui donne envie et décrit concrètement l'événement
2. Style musical si applicable (sinon null)
3. Ambiance/vibe (lieu, énergie, type de soirée)
4. Public attendu (âge, profil)
5. Intensité (chill/moderate/high/very_high)
6. Niveau de danse si applicable (sinon null)
7. Contexte culturel montréalais (quartier, scène, histoire) si pertinent, sinon null
8. Tags cliquables pour découverte (genre, ambiance, time, crowd, accessibility)`;
}

function buildEnUser(input: GeneratePulseInsightInput): string {
  const venueLine = `${input.venue?.name || 'Not specified'}${input.venue?.neighborhood ? ` (${input.venue.neighborhood})` : ''}`;
  const eventTagsStr = (input.eventTags ?? []).map((t) => `${t.category}:${t.value}`).join(', ') || 'None';
  return `Generate a Pulse insight for this event:

Title: ${input.title}
Category: ${input.category || 'Not specified'}
Description: ${input.description || 'Not available'}
Venue: ${venueLine}
Organizer: ${input.organizer?.displayName || 'Not specified'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}
Existing tags: ${(input.tags ?? []).join(', ') || 'None'}
Structured tags: ${eventTagsStr}

IMPORTANT: Respond with a valid JSON object containing exactly these fields:
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
1. An immersive summary (2-3 sentences) that makes people want to go and describes the event concretely
2. Music style if applicable (otherwise null)
3. Atmosphere/vibe (venue, energy, type of night)
4. Expected audience (age, profile)
5. Intensity (chill/moderate/high/very_high)
6. Dance level if applicable (otherwise null)
7. Montreal cultural context (neighborhood, scene, history) if relevant, otherwise null
8. Clickable tags for discovery (genre, ambiance, time, crowd, accessibility)`;
}

function buildEsUser(input: GeneratePulseInsightInput): string {
  const venueLine = `${input.venue?.name || 'No especificado'}${input.venue?.neighborhood ? ` (${input.venue.neighborhood})` : ''}`;
  const eventTagsStr = (input.eventTags ?? []).map((t) => `${t.category}:${t.value}`).join(', ') || 'Ninguna';
  return `Genera un insight Pulse para este evento:

Título: ${input.title}
Categoría: ${input.category || 'No especificado'}
Descripción: ${input.description || 'No disponible'}
Lugar: ${venueLine}
Organizador: ${input.organizer?.displayName || 'No especificado'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}
Etiquetas existentes: ${(input.tags ?? []).join(', ') || 'Ninguna'}
Etiquetas estructuradas: ${eventTagsStr}

IMPORTANTE: Responde con un objeto JSON válido con exactamente estos campos:
{
  "summary": "Resumen inmersivo de 2-3 frases",
  "musicStyle": "Estilo musical o null si no aplica",
  "vibe": "Ambiente/vibra",
  "expectedAudience": "Público esperado",
  "intensity": "chill|moderate|high|very_high",
  "danceLevel": "none|low|medium|high o null si no aplica",
  "culturalContext": "Contexto de Montreal o null",
  "tags": [{"category": "genre|ambiance|time|crowd|accessibility", "value": "valor", "label": "etiqueta"}]
}

Genera:
1. Resumen inmersivo (2-3 frases) que dé ganas de ir y describa el evento de forma concreta
2. Estilo musical si aplica (sino null)
3. Ambiente/vibra (lugar, energía, tipo de noche)
4. Público esperado (edad, perfil)
5. Intensidad (chill/moderate/high/very_high)
6. Nivel de baile si aplica (sino null)
7. Contexto cultural de Montreal si es relevante (sino null)
8. Etiquetas clicables para descubrimiento`;
}

const PROMPTS = {
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
    buildUser: buildFrUser,
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
    buildUser: buildEnUser,
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
    buildUser: buildEsUser,
  },
} as const;

function getFallback(locale: string, title: string, category: string | null | undefined): PulseInsightResult {
  const fallbacks: Record<string, { summary: string; vibe: string; expectedAudience: string }> = {
    fr: { summary: `${title} est un événement ${category || 'culturel'} à Montréal.`, vibe: 'Ambiance à découvrir', expectedAudience: 'Public varié' },
    en: { summary: `${title} is a ${category || 'cultural'} event in Montreal.`, vibe: 'Atmosphere to discover', expectedAudience: 'Diverse audience' },
    es: { summary: `${title} es un evento ${category || 'cultural'} en Montreal.`, vibe: 'Ambiente por descubrir', expectedAudience: 'Público diverso' },
  };
  const f = fallbacks[locale] || fallbacks.fr;
  return {
    summary: f.summary,
    vibe: f.vibe,
    expectedAudience: f.expectedAudience,
    intensity: 'moderate',
    tags: [],
  };
}

export interface GeneratePulseInsightOptions {
  locale?: 'fr' | 'en' | 'es';
  /** Clé de cache (ex: pulse-insight:eventId:locale). Si fournie, le résultat peut être mis en cache. */
  cacheKey?: string;
  cacheTTL?: number;
}

/**
 * Génère un Pulse Insight pour un événement (appel OpenAI).
 * À utiliser à la création d'événement ou depuis l'API.
 */
export async function generatePulseInsight(
  eventId: string,
  input: GeneratePulseInsightInput,
  options: GeneratePulseInsightOptions = {}
): Promise<PulseInsightResult> {
  const locale = options.locale ?? 'fr';
  const prompts = PROMPTS[locale] || PROMPTS.fr;

  try {
    const result = await callOpenAI(
      prompts.system,
      prompts.buildUser(input),
      PulseInsightSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        cacheKey: options.cacheKey ?? undefined,
        cacheTTL: options.cacheTTL ?? 86400,
      }
    );
    return result.data;
  } catch (err) {
    console.error('[generatePulseInsight]', err);
    return getFallback(locale, input.title, input.category);
  }
}
