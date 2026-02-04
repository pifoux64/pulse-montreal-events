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
    buildUser: (input: GeneratePulseInsightInput) => `Génère un insight Pulse pour cet événement:

Titre: ${input.title}
Catégorie: ${input.category || 'Non spécifié'}
Description: ${input.description || 'Non disponible'}
Lieu: ${input.venue?.name || 'Non spécifié'}${input.venue?.neighborhood ? ` (${input.venue.neighborhood})` : ''}
Organisateur: ${input.organizer?.displayName || 'Non spécifié'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}
Tags existants: ${(input.tags ?? []).join(', ') || 'Aucun'}
Tags structurés: ${(input.eventTags ?? []).map((t) => `${t.category}:${t.value}`).join(', ') || 'Aucun'}

IMPORTANT: Réponds avec un objet JSON valide contenant exactement: summary, musicStyle, vibe, expectedAudience, intensity, danceLevel, culturalContext, tags (array).`,
  },
  en: {
    system: `You are an expert on Montreal's cultural scene. 
You generate immersive and editorial insights about events to help people discover and quickly understand if an event suits them.

Style: Editorial, immersive, authentic. Avoid marketing, be descriptive and useful.

IMPORTANT: You must always respond with a valid JSON object, without any additional text or formatting.`,
    buildUser: (input: GeneratePulseInsightInput) => `Generate a Pulse insight for this event:

Title: ${input.title}
Category: ${input.category || 'Not specified'}
Description: ${input.description || 'Not available'}
Venue: ${input.venue?.name || 'Not specified'}${input.venue?.neighborhood ? ` (${input.venue.neighborhood})` : ''}
Organizer: ${input.organizer?.displayName || 'Not specified'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}
Existing tags: ${(input.tags ?? []).join(', ') || 'None'}
Structured tags: ${(input.eventTags ?? []).map((t) => `${t.category}:${t.value}`).join(', ') || 'None'}

IMPORTANT: Respond with a valid JSON object containing exactly: summary, musicStyle, vibe, expectedAudience, intensity, danceLevel, culturalContext, tags (array).`,
  },
  es: {
    system: `Eres un experto de la escena cultural de Montreal. 
Generas insights inmersivos y editoriales sobre eventos. Estilo: editorial, inmersivo, auténtico.

IMPORTANTE: Siempre debes responder con un objeto JSON válido.`,
    buildUser: (input: GeneratePulseInsightInput) => `Genera un insight Pulse para este evento:

Título: ${input.title}
Categoría: ${input.category || 'No especificado'}
Descripción: ${input.description || 'No disponible'}
Lugar: ${input.venue?.name || 'No especificado'}
Organizador: ${input.organizer?.displayName || 'No especificado'}
${(input.lineup?.length ?? 0) > 0 ? `Line-up: ${input.lineup!.join(', ')}` : ''}

IMPORTANTE: Responde con un objeto JSON válido con: summary, musicStyle, vibe, expectedAudience, intensity, danceLevel, culturalContext, tags.`,
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
