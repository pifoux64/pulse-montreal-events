/**
 * Service d'enrichissement IA pour les événements
 * SPRINT B: Enrichissement automatique des tags structurés
 * 
 * Utilise GPT-4.1-mini pour générer des tags structurés (genres, styles, type, ambiance, public)
 */

import { NormalizedEvent } from './types';
import { EventCategory } from '@prisma/client';
import { classifyEventWithAI } from '@/lib/tagging/aiClassifier';

export interface AIEnrichmentResult {
  genres: string[];
  styles: string[];
  type: string | null;
  ambiance: string[];
  public: string[];
  isFree?: boolean;
  language?: string;
  confidence: number; // 0-1
}

/**
 * Enrichit un événement normalisé avec des tags structurés via IA
 */
export async function enrichEventWithAI(
  event: NormalizedEvent
): Promise<AIEnrichmentResult> {
  // Si l'API OpenAI n'est pas configurée, retourner un résultat vide
  if (!process.env.OPENAI_API_KEY) {
    return {
      genres: [],
      styles: [],
      type: null,
      ambiance: [],
      public: [],
      confidence: 0,
    };
  }

  try {
    // Préparer l'input pour l'IA
    const input = {
      title: event.title,
      description: event.description,
      venueName: event.venueName,
    };

    // Appeler le classificateur IA existant
    const aiResult = await classifyEventWithAI(input);

    // Extraire les genres et styles depuis l'IA
    const genres: string[] = [];
    const styles: string[] = [];

    // Les genres principaux viennent de l'IA
    if (Array.isArray(aiResult.genres)) {
      genres.push(...aiResult.genres);
    }

    // Les styles viennent directement de l'IA
    if (Array.isArray(aiResult.styles)) {
      styles.push(...aiResult.styles);
    }

    // Inférer si l'événement est gratuit
    const isFree = inferIsFree(event);

    // Inférer la langue si non spécifiée
    const language = event.language || inferLanguage(event.title, event.description);

    return {
      genres: [...new Set(genres)], // Dédupliquer
      styles: [...new Set(styles)], // Dédupliquer
      type: aiResult.type,
      ambiance: Array.isArray(aiResult.ambiance) ? aiResult.ambiance : [],
      public: Array.isArray(aiResult.public) ? aiResult.public : [],
      isFree,
      language: language.toString(),
      confidence: 0.8, // Confiance moyenne pour l'IA
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'enrichissement IA:', error);
    // En cas d'erreur, retourner un résultat vide
    return {
      genres: [],
      styles: [],
      type: null,
      ambiance: [],
      public: [],
      confidence: 0,
    };
  }
}

/**
 * Détecte des styles musicaux depuis un texte
 */
function detectStylesFromText(text: string): string[] {
  const styles: string[] = [];
  const textLower = text.toLowerCase();

  // Dictionnaire de styles musicaux (à enrichir)
  const stylePatterns: Record<string, string[]> = {
    dub: ['dub', 'dubstep'],
    roots: ['roots reggae', 'roots'],
    dancehall: ['dancehall'],
    trap: ['trap'],
    drill: ['drill'],
    jungle: ['jungle', 'drum and bass'],
    house: ['house', 'deep house', 'tech house'],
    techno: ['techno', 'minimal techno'],
    trance: ['trance'],
    hardcore: ['hardcore', 'hardcore punk'],
    metalcore: ['metalcore'],
    death_metal: ['death metal'],
    black_metal: ['black metal'],
    folk: ['folk', 'folk rock'],
    indie: ['indie', 'indie rock', 'indie pop'],
    shoegaze: ['shoegaze'],
    ambient: ['ambient', 'ambient music'],
    chill: ['chill', 'chillout'],
  };

  for (const [style, patterns] of Object.entries(stylePatterns)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        styles.push(style);
        break; // Un seul style par pattern
      }
    }
  }

  return styles;
}

/**
 * Infère si l'événement est gratuit depuis les données disponibles
 */
function inferIsFree(event: NormalizedEvent): boolean | undefined {
  // Si déjà défini, utiliser cette valeur
  if (event.isFree !== undefined) {
    return event.isFree;
  }

  // Si prix = 0, c'est gratuit
  if (event.priceMin === 0 || (event.priceMin === undefined && event.priceMax === 0)) {
    return true;
  }

  // Chercher dans la description
  const text = (event.title + ' ' + event.description).toLowerCase();
  if (text.match(/\b(gratuit|free|entrée libre|no cover)\b/i)) {
    return true;
  }

  return undefined; // Incertain
}

/**
 * Infère la langue depuis le texte
 */
function inferLanguage(title: string, description: string): string {
  const text = `${title} ${description}`;
  const frenchWords = /\b(le|la|les|de|du|des|et|ou|avec|pour|dans|sur|sous|par|un|une)\b/i;
  const englishWords = /\b(the|a|an|and|or|with|for|in|on|under|by)\b/i;

  const frenchCount = (text.match(frenchWords) || []).length;
  const englishCount = (text.match(englishWords) || []).length;

  if (frenchCount > englishCount * 2) {
    return 'FR';
  } else if (englishCount > frenchCount * 2) {
    return 'EN';
  } else {
    return 'BOTH';
  }
}

/**
 * Cache pour éviter les appels IA redondants
 * Utilise un hash du titre + description + venue pour la clé
 */
const enrichmentCache = new Map<string, AIEnrichmentResult>();

export function getEnrichmentCacheKey(event: NormalizedEvent): string {
  const key = `${event.title}|${event.description.substring(0, 100)}|${event.venueName}`;
  return Buffer.from(key).toString('base64').substring(0, 50);
}

export async function enrichEventWithAICached(
  event: NormalizedEvent
): Promise<AIEnrichmentResult> {
  const cacheKey = getEnrichmentCacheKey(event);
  
  // Vérifier le cache
  if (enrichmentCache.has(cacheKey)) {
    return enrichmentCache.get(cacheKey)!;
  }

  // Enrichir et mettre en cache
  const result = await enrichEventWithAI(event);
  enrichmentCache.set(cacheKey, result);

  // Limiter la taille du cache (max 1000 entrées)
  if (enrichmentCache.size > 1000) {
    const firstKey = enrichmentCache.keys().next().value;
    enrichmentCache.delete(firstKey);
  }

  return result;
}

