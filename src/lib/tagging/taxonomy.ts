export type TagCategory = 'type' | 'genre' | 'ambiance' | 'public';

// Taxonomie fermée côté backend
export const EVENT_TYPES = [
  'concert',
  'dj_set',
  'soiree_club',
  'festival',
  'exposition',
  'projection',
  'atelier',
  'conference',
  'evenement_famille',
] as const;

export const GENRES = [
  'reggae',
  'dub',
  'dancehall',
  'roots_reggae',
  'afrobeat',
  'amapiano',
  'soukous',
  'salsa',
  'cumbia',
  'bachata',
  'hip_hop',
  'rnb',
  'techno',
  'house',
  'trance',
  'drum_and_bass',
  'jungle',
  'rock',
  'hard_rock',
  'heavy_metal',
  'punk',
  'jazz',
  'soul',
  'funk',
  'blues',
  'electronic',
  'experimental',
  'latin',
  'world',
  'other',
] as const;

export const AMBIANCES = [
  'intime',
  'grande_salle',
  'underground',
  'exterieur',
  'bar',
  'salle_de_concert',
  'festival_site',
  'rooftop',
  'warehouse',
] as const;

export const PUBLICS = ['tout_public', '18_plus', 'famille'] as const;

export const TAG_TAXONOMY = {
  type: EVENT_TYPES,
  genre: GENRES,
  ambiance: AMBIANCES,
  public: PUBLICS,
} as const satisfies Record<TagCategory, readonly string[]>;

export function filterToAllowedTags(input: {
  type?: string | null;
  genres?: string[];
  ambiance?: string[];
  public?: string[];
}) {
  const allowed = {
    type: null as string | null,
    genres: [] as string[],
    ambiance: [] as string[],
    public: [] as string[],
  };

  if (input.type && TAG_TAXONOMY.type.includes(input.type as any)) {
    allowed.type = input.type;
  }

  if (input.genres?.length) {
    const allowedGenres = new Set(TAG_TAXONOMY.genre);
    allowed.genres = input.genres.filter((g) => allowedGenres.has(g as any));
  }

  if (input.ambiance?.length) {
    const allowedAmbiance = new Set(TAG_TAXONOMY.ambiance);
    allowed.ambiance = input.ambiance.filter((a) => allowedAmbiance.has(a as any));
  }

  if (input.public?.length) {
    const allowedPublic = new Set(TAG_TAXONOMY.public);
    allowed.public = input.public.filter((p) => allowedPublic.has(p as any));
  }

  return allowed;
}

