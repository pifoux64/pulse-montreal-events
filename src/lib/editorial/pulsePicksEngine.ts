/**
 * Pulse Picks Engine - Sélection automatique des Top 5 par thème/période
 * SPRINT 3: Pulse Picks (Top 5)
 *
 * Utilise les tags structurés (EventTag) + popularité pour proposer un Top 5
 */

import { prisma } from '@/lib/prisma';
import { MONTREAL_TIMEZONE, isFreeEvent } from '@/lib/utils';

export type PulsePicksTheme =
  // Catégories générales
  | 'famille'
  | 'culture'
  | 'sport'
  | 'musique'
  | 'gratuit'
  // Genres musicaux (tous les genres de GENRES)
  | 'reggae'
  | 'hip_hop'
  | 'pop'
  | 'rnb'
  | 'rock'
  | 'heavy_metal'
  | 'punk'
  | 'jazz'
  | 'soul'
  | 'funk'
  | 'blues'
  | 'techno'
  | 'house'
  | 'trance'
  | 'drum_and_bass'
  | 'electronic'
  | 'latin'
  | 'afrobeat'
  | 'experimental'
  | 'world'
  | 'classique';

export interface GeneratePicksOptions {
  theme: PulsePicksTheme;
  periodStart: Date;
  periodEnd: Date;
  limit?: number; // défaut: 5
}

interface ScoredEvent {
  id: string;
  score: number;
}

/**
 * Détermine les filtres EventTag / Event pour un thème donné
 */
function buildThemeFilters(theme: PulsePicksTheme) {
  switch (theme) {
    case 'famille':
      return {
        category: 'FAMILY',
        extraTagFilters: [{ category: 'public', value: 'famille' }],
      };
    case 'culture':
      return {
        category: 'EXHIBITION', // Utiliser EXHIBITION pour la culture (peut inclure THEATRE aussi)
        extraTagFilters: [],
      };
    case 'sport':
      return {
        category: 'SPORT',
        extraTagFilters: [],
      };
    case 'musique':
      return {
        category: 'MUSIC',
        extraTagFilters: [],
      };
    case 'gratuit':
      return {
        category: undefined,
        extraTagFilters: [],
      };
    // Tous les genres musicaux
    case 'reggae':
    case 'hip_hop':
    case 'pop':
    case 'rnb':
    case 'rock':
    case 'heavy_metal':
    case 'punk':
    case 'jazz':
    case 'soul':
    case 'funk':
    case 'blues':
    case 'techno':
    case 'house':
    case 'trance':
    case 'drum_and_bass':
    case 'electronic':
    case 'latin':
    case 'afrobeat':
    case 'experimental':
    case 'world':
    case 'classique':
      return {
        category: 'MUSIC',
        extraTagFilters: [{ category: 'genre', value: theme }],
      };
  }
}

/**
 * Calcule un score pour un événement dans le contexte d'un thème
 */
function scoreEventForTheme(theme: PulsePicksTheme, event: any): number {
  let score = 0;

  // Base : popularité (nombre de favoris)
  const favorites = event._count?.favorites ?? 0;
  score += Math.min(1, favorites / 10) * 0.5; // max 0.5 pour la popularité

  const tags = event.eventTags || [];

  // Bonus selon le thème
  if (theme === 'gratuit' && isFreeEvent(event)) {
    score += 0.4;
  }

  if (theme === 'famille') {
    const hasFamilyTag = tags.some(
      (t: any) =>
        (t.category === 'public' && t.value === 'famille') ||
        (t.category === 'type' && t.value === 'famille')
    );
    if (hasFamilyTag) score += 0.4;
  }

  if (theme === 'culture') {
    const hasCultureTag = tags.some(
      (t: any) => t.category === 'type' && ['culture', 'exposition', 'théâtre'].includes(t.value)
    );
    if (hasCultureTag) score += 0.4;
  }

  // Pour tous les genres musicaux, vérifier si l'événement a le genre correspondant
  const musicGenres: PulsePicksTheme[] = [
    'reggae', 'hip_hop', 'pop', 'rnb', 'rock', 'heavy_metal', 'punk', 'jazz',
    'soul', 'funk', 'blues', 'techno', 'house', 'trance', 'drum_and_bass',
    'electronic', 'latin', 'afrobeat', 'experimental', 'world', 'classique'
  ];
  
  if (musicGenres.includes(theme)) {
    const hasGenre = tags.some((t: any) => t.category === 'genre' && t.value === theme);
    if (hasGenre) score += 0.4;
    
    // Bonus si le style correspond aussi (ex: reggae -> dub, dancehall)
    const hasStyle = tags.some((t: any) => t.category === 'style' && t.value.toLowerCase().includes(theme.toLowerCase()));
    if (hasStyle) score += 0.2;
  }

  // Légère pénalisation des événements très éloignés dans le temps
  const now = new Date();
  const daysUntil = (new Date(event.startAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil > 7) {
    score -= 0.1;
  }

  return score;
}

/**
 * Génère un Top N d'événements pour un thème/période, sans encore créer le post éditorial
 */
export async function generatePulsePicksCandidates(
  options: GeneratePicksOptions
): Promise<ScoredEvent[]> {
  const { theme, periodStart, periodEnd, limit = 5 } = options;
  const themeFilters = buildThemeFilters(theme);

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'UPDATED'],
      },
      startAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      ...(themeFilters.category && {
        category: themeFilters.category,
      }),
    },
    include: {
      eventTags: true,
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    take: 200,
  });

  // Filtre additionnel par EventTag (pour les thèmes genre/style)
  const filtered = events.filter((event) => {
    if (!themeFilters.extraTagFilters.length) return true;

    return themeFilters.extraTagFilters.some((filter) =>
      event.eventTags.some(
        (t: any) =>
          t.category === filter.category &&
          t.value.toLowerCase() === filter.value.toLowerCase()
      )
    );
  });

  // Scoring
  const scored: ScoredEvent[] = filtered.map((event) => ({
    id: event.id,
    score: scoreEventForTheme(theme, event),
  }));

  // Trier par score décroissant et prendre les top N
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return top;
}

/**
 * Crée ou met à jour un EditorialPost (Pulse Picks) pour un thème/période donné
 */
export async function upsertPulsePicksPost(options: GeneratePicksOptions & { authorId?: string }) {
  const { theme, periodStart, periodEnd, limit = 5, authorId } = options;

  const candidates = await generatePulsePicksCandidates({ theme, periodStart, periodEnd, limit });
  const eventsOrder = candidates.map((c) => c.id);

  // Générer un slug déterministe: top-5-<theme>-week-YYYY-MM-DD
  const weekStartISO = new Intl.DateTimeFormat('en-CA', {
    timeZone: MONTREAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(periodStart)
    .replace(/\//g, '-');

  const slug = `top-5-${theme}-week-${weekStartISO}`;

  const title = `Top 5 ${theme} à Montréal`;

  const post = await prisma.editorialPost.upsert({
    where: { slug },
    create: {
      slug,
      title,
      theme,
      periodStart,
      periodEnd,
      eventsOrder,
      tags: [theme, 'pulse-picks', 'top-5'],
      authorId: authorId || null,
      status: 'DRAFT',
    },
    update: {
      periodStart,
      periodEnd,
      eventsOrder,
      tags: [theme, 'pulse-picks', 'top-5'],
      // On ne touche pas au status ni au contenu éditorial pour ne pas écraser le travail humain
    },
  });

  return {
    post,
    candidates,
  };
}
