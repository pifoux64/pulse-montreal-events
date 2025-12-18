/**
 * Service AI: Conversion de recherche en langage naturel vers filtres structurés
 * SPRINT 1: Natural language search -> structured filters
 */

import { z } from 'zod';
import { callOpenAI, generateCacheKey } from './client';

/**
 * Schema de sortie strict pour search-to-filters
 */
export const SearchFiltersSchema = z.object({
  timeScope: z.enum(['today', 'weekend', 'dateRange', 'all']),
  rangeStart: z.string().optional(), // ISO date string
  rangeEnd: z.string().optional(), // ISO date string
  radiusKm: z.number().min(0).max(50).optional(), // Max 50km
  categories: z
    .array(
      z.enum([
        'music',
        'culture',
        'family',
        'sports',
        'exhibition',
        'community',
        'education',
        'nightlife',
        'other',
      ])
    )
    .optional(),
  musicGenres: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  ageRestriction: z.enum(['all', '18+', '21+']).optional(),
  language: z.enum(['fr', 'en', 'other']).optional(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().max(140),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

export interface SearchToFiltersInput {
  queryText: string;
  userLat?: number;
  userLng?: number;
  timezone?: string;
}

/**
 * Convertit une requête en langage naturel en filtres structurés
 */
export async function searchToFilters(
  input: SearchToFiltersInput
): Promise<SearchFilters> {
  const { queryText, userLat, userLng, timezone = 'America/Montreal' } = input;

  // Générer la clé de cache
  const locationGrid = userLat && userLng 
    ? `${Math.floor(userLat * 10)}:${Math.floor(userLng * 10)}` 
    : 'none';
  const cacheKey = generateCacheKey(
    'search-to-filters',
    queryText.toLowerCase().trim(),
    locationGrid,
    timezone
  );

  // Prompt système
  const systemPrompt = `Tu es un assistant qui convertit des recherches d'événements en langage naturel en filtres structurés pour une base de données d'événements à Montréal.

Règles strictes:
- timeScope: "today" (aujourd'hui), "weekend" (ce week-end), "dateRange" (plage spécifique), "all" (tous)
- rangeStart/rangeEnd: ISO 8601 (YYYY-MM-DDTHH:mm:ss) si dateRange, sinon undefined
- radiusKm: 0-50km, seulement si "près de moi", "near me", "proche", etc.
- categories: ["music", "culture", "family", "sports", "exhibition", "community", "education", "nightlife", "other"]
- musicGenres: genres musicaux détectés (ex: ["reggae", "hip_hop", "rock"])
- tags: mots-clés supplémentaires (ex: ["gratuit", "plein-air"])
- isFree: true si "gratuit", "free", "entrée libre"
- ageRestriction: "18+", "21+" si mentionné, sinon "all"
- language: "fr", "en", "other" selon la langue de la requête
- confidence: 0-1 selon la certitude
- explanation: <= 140 caractères expliquant l'interprétation

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.`;

  // Prompt utilisateur
  const userPrompt = `Convertis cette recherche en filtres structurés:

"${queryText}"

${userLat && userLng ? `Position utilisateur: ${userLat}, ${userLng}` : ''}
Timezone: ${timezone}

Réponds avec un objet JSON strictement conforme au schema.`;

  try {
    const result = await callOpenAI(
      systemPrompt,
      userPrompt,
      SearchFiltersSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0,
        cacheKey,
        cacheTTL: 86400, // 24h
      }
    );

    return result.data;
  } catch (error: any) {
    console.error('Erreur searchToFilters:', error);
    
    // Fallback: règles déterministes simples
    return getFallbackFilters(queryText, userLat, userLng);
  }
}

/**
 * Fallback déterministe si l'IA échoue
 */
function getFallbackFilters(
  queryText: string,
  userLat?: number,
  userLng?: number
): SearchFilters {
  const text = queryText.toLowerCase();
  
  // Détection basique
  let timeScope: 'today' | 'weekend' | 'dateRange' | 'all' = 'all';
  if (text.includes('aujourd\'hui') || text.includes('today') || text.includes('ce soir')) {
    timeScope = 'today';
  } else if (text.includes('week-end') || text.includes('weekend')) {
    timeScope = 'weekend';
  }

  const isFree = text.includes('gratuit') || text.includes('free') || text.includes('entrée libre');
  const radiusKm = (text.includes('près') || text.includes('near') || text.includes('proche')) && userLat && userLng ? 5 : undefined;

  // Détection catégories basique
  const categories: Array<'music' | 'culture' | 'family' | 'sports' | 'exhibition' | 'community' | 'education' | 'nightlife' | 'other'> = [];
  if (text.includes('musique') || text.includes('music') || text.includes('concert')) categories.push('music');
  if (text.includes('famille') || text.includes('family') || text.includes('enfant')) categories.push('family');
  if (text.includes('culture') || text.includes('art')) categories.push('culture');
  if (text.includes('sport')) categories.push('sports');

  // Détection genres musicaux basique
  const musicGenres: string[] = [];
  const genreMap: Record<string, string> = {
    reggae: 'reggae',
    hip: 'hip_hop',
    rap: 'hip_hop',
    rock: 'rock',
    jazz: 'jazz',
    techno: 'techno',
    house: 'house',
    pop: 'pop',
  };
  for (const [keyword, genre] of Object.entries(genreMap)) {
    if (text.includes(keyword)) {
      musicGenres.push(genre);
    }
  }

  return {
    timeScope,
    radiusKm,
    categories: categories.length > 0 ? categories : undefined,
    musicGenres: musicGenres.length > 0 ? musicGenres : undefined,
    isFree,
    ageRestriction: text.includes('18+') ? '18+' : text.includes('21+') ? '21+' : 'all',
    language: text.match(/[àéèêëîïôùûü]/) ? 'fr' : 'en',
    confidence: 0.5, // Faible confiance pour fallback
    explanation: 'Interprétation basique (IA indisponible)',
  };
}

