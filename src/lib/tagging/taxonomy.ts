export type TagCategory = 'type' | 'genre' | 'ambiance' | 'public' | 'category' | 'style';

// Catégories principales (niveau 1)
export const MAIN_CATEGORIES = [
  'MUSIC',
  'ART_CULTURE',
  'SPORT',
  'FAMILY',
] as const;

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

// Genres musicaux principaux (niveau 2 - pour MUSIC)
// Seulement les genres principaux, pas les styles
export const GENRES = [
  'reggae',        // Genre principal (styles: dub, dancehall, roots_reggae, etc.)
  'hip_hop',       // Genre principal (styles: rap, trap, drill, etc.)
  'pop',           // Genre principal (styles: indie_pop, synth_pop, etc.)
  'rnb',           // Genre principal (styles: neo_soul, contemporary_rnb, etc.)
  'rock',          // Genre principal (styles: indie_rock, alternative_rock, etc.)
  'heavy_metal',   // Genre principal (styles: thrash_metal, death_metal, etc.)
  'punk',          // Genre principal (styles: hardcore, pop_punk, etc.)
  'jazz',          // Genre principal (styles: bebop, fusion, etc.)
  'soul',          // Genre principal (styles: neo_soul, motown, etc.)
  'funk',          // Genre principal (styles: p_funk, afro_funk, etc.)
  'blues',         // Genre principal (styles: delta_blues, chicago_blues, etc.)
  'techno',        // Genre principal (styles: minimal_techno, industrial_techno, etc.)
  'house',         // Genre principal (styles: deep_house, tech_house, etc.)
  'trance',        // Genre principal (styles: progressive_trance, psytrance, etc.)
  'drum_and_bass', // Genre principal (styles: jungle, liquid_dnb, etc.)
  'electronic',    // Genre principal (styles: ambient, idm, synthwave, etc.)
  'latin',         // Genre principal (styles: salsa, bachata, cumbia, etc.)
  'afrobeat',      // Genre principal (styles: soukous, amapiano, afrobeats, etc.)
  'experimental',  // Genre principal (styles: noise, avant_garde, etc.)
  'world',         // Genre principal (styles: folk, traditional, etc.)
  'classique',     // Genre principal (styles: baroque, romantique, contemporain, etc.)
  'disco',         // Genre principal (styles: nu_disco, disco_house, italo_disco, etc.)
  'country',       // Genre principal (styles: country_rock, bluegrass, americana, etc.)
  'folk',          // Genre principal (styles: indie_folk, folk_rock, acoustic, etc.)
  'indie',         // Genre principal (styles: indie_rock, indie_pop, lo_fi, etc.)
  'alternative',   // Genre principal (styles: alt_rock, grunge, shoegaze, post_rock, etc.)
  'dubstep',       // Genre principal (styles: brostep, melodic_dubstep, riddim, etc.)
  'other',         // Autre (genre non spécifié)
] as const;

// Styles musicaux (niveau 3 - sous-genres, comme Discogs)
// Chaque style appartient à un genre principal
export const MUSIC_STYLES: Record<string, readonly string[]> = {
  // Styles de REGGAE
  reggae: [
    'dub',              // Style de reggae (pas un genre principal)
    'dancehall',        // Style de reggae
    'roots_reggae',     // Style de reggae
    'lovers_rock',
    'rocksteady',
    'ska',
    'reggaeton',
    'dubwise',
  ] as const,
  
  // Styles de HIP_HOP
  hip_hop: [
    'rap',
    'trap',
    'drill',
    'grime',
    'conscious_hip_hop',
    'gangsta_rap',
    'mumble_rap',
    'old_school_hip_hop',
  ] as const,
  
  // Styles de POP
  pop: [
    'indie_pop',
    'synth_pop',
    'dance_pop',
    'k_pop',
    'j_pop',
    'electro_pop',
    'power_pop',
  ] as const,
  
  // Styles de RNB
  rnb: [
    'neo_soul',
    'contemporary_rnb',
    'soul',              // Note: soul est aussi un genre principal, mais peut être un style de rnb
  ] as const,
  
  // Styles de ROCK
  rock: [
    'indie_rock',
    'alternative_rock',
    'garage_rock',
    'psych_rock',
    'post_rock',
    'hard_rock',         // Style de rock
    'classic_rock',
    'arena_rock',
  ] as const,
  
  // Styles de HEAVY_METAL
  heavy_metal: [
    'thrash_metal',
    'death_metal',
    'black_metal',
    'doom_metal',
    'power_metal',
    'progressive_metal',
  ] as const,
  
  // Styles de PUNK
  punk: [
    'hardcore',
    'pop_punk',
    'post_punk',
    'punk_rock',
    'hardcore_punk',
  ] as const,
  
  // Styles de JAZZ
  jazz: [
    'bebop',
    'fusion',
    'smooth_jazz',
    'free_jazz',
    'latin_jazz',
    'acid_jazz',
  ] as const,
  
  // Styles de SOUL
  soul: [
    'neo_soul',
    'motown',
    'northern_soul',
    'southern_soul',
  ] as const,
  
  // Styles de FUNK
  funk: [
    'p_funk',
    'afro_funk',
    'jazz_funk',
    'deep_funk',
  ] as const,
  
  // Styles de BLUES
  blues: [
    'delta_blues',
    'chicago_blues',
    'electric_blues',
    'country_blues',
  ] as const,
  
  // Styles de TECHNO
  techno: [
    'minimal_techno',
    'industrial_techno',
    'acid_techno',
    'detroit_techno',
    'berlin_techno',
    'dub_techno',
  ] as const,
  
  // Styles de HOUSE
  house: [
    'deep_house',
    'tech_house',
    'progressive_house',
    'disco_house',
    'vocal_house',
    'acid_house',
  ] as const,
  
  // Styles de TRANCE
  trance: [
    'progressive_trance',
    'uplifting_trance',
    'psytrance',
    'goa_trance',
    'vocal_trance',
  ] as const,
  
  // Styles de DRUM_AND_BASS
  drum_and_bass: [
    'jungle',           // Style de drum_and_bass (pas un genre principal)
    'liquid_dnb',
    'neurofunk',
    'jump_up',
    'darkstep',
  ] as const,
  
  // Styles de ELECTRONIC
  electronic: [
    'ambient',
    'idm',
    'glitch',
    'synthwave',
    'vaporwave',
    'chillwave',
  ] as const,
  
  // Styles de LATIN
  latin: [
    'salsa',           // Style de latin
    'bachata',         // Style de latin
    'merengue',        // Style de latin
    'cumbia',          // Style de latin
    'reggaeton',       // Style de latin (aussi style de reggae)
    'samba',
    'bossa_nova',
  ] as const,
  
  // Styles de AFROBEAT
  afrobeat: [
    'soukous',         // Style d'afrobeat
    'amapiano',        // Style d'afrobeat
    'afrobeats',
    'afro_funk',
    'highlife',
  ] as const,
  
  // Styles de EXPERIMENTAL
  experimental: [
    'noise',
    'avant_garde',
    'free_improvisation',
    'drone',
  ] as const,
  
  // Styles de WORLD
  world: [
    'folk',
    'traditional',
    'ethnic',
    'tribal',
  ] as const,
  
  // Styles de CLASSIQUE
  classique: [
    'baroque',
    'romantique',
    'contemporain',
    'opera',
    'symphonie',
    'chamber_music',
    'orchestre',
    'piano',
    'violon',
    'violoncelle',
  ] as const,
  
  // Styles de DISCO
  disco: [
    'nu_disco',
    'disco_house',
    'italo_disco',
    'eurodisco',
    'space_disco',
  ] as const,
  
  // Styles de COUNTRY
  country: [
    'country_rock',
    'bluegrass',
    'americana',
    'honky_tonk',
    'outlaw_country',
    'country_pop',
  ] as const,
  
  // Styles de FOLK
  folk: [
    'indie_folk',
    'folk_rock',
    'acoustic',
    'singer_songwriter',
    'traditional_folk',
    'contemporary_folk',
  ] as const,
  
  // Styles de INDIE
  indie: [
    'indie_rock',
    'indie_pop',
    'lo_fi',
    'bedroom_pop',
    'indie_folk',
    'indie_electronic',
  ] as const,
  
  // Styles de ALTERNATIVE
  alternative: [
    'alt_rock',
    'grunge',
    'shoegaze',
    'post_rock',
    'britpop',
    'emo',
  ] as const,
  
  // Styles de DUBSTEP
  dubstep: [
    'brostep',
    'melodic_dubstep',
    'riddim',
    'deep_dubstep',
    'future_bass',
  ] as const,
} as const;

// Styles pour Art & Culture
export const ART_CULTURE_STYLES: Record<string, readonly string[]> = {
  exposition: ['peinture', 'sculpture', 'photographie', 'installation', 'performance', 'art_numerique'] as const,
  theatre: ['drame', 'comedie', 'musical', 'improvisation', 'cabaret', 'one_man_show'] as const,
  cinema: ['film_independant', 'documentaire', 'court_metrage', 'animation', 'experimental'] as const,
  danse: ['contemporain', 'classique', 'hip_hop', 'jazz', 'moderne', 'urbain'] as const,
} as const;

// Styles pour Sport
export const SPORT_STYLES: Record<string, readonly string[]> = {
  football: ['soccer', 'futsal', 'beach_soccer'] as const,
  basketball: ['nba', 'streetball', '3x3'] as const,
  hockey: ['hockey_sur_glace', 'hockey_sur_gazon', 'roller_hockey'] as const,
  course: ['marathon', 'semi_marathon', 'trail', 'ultra', 'course_route'] as const,
} as const;

// Styles pour Famille
export const FAMILY_STYLES: Record<string, readonly string[]> = {
  activites_enfants: ['atelier_creatif', 'jeux', 'contes', 'spectacle_enfant', 'animation'] as const,
  parcs: ['plein_air', 'nature', 'jeux_exterieurs'] as const,
  education: ['atelier_educatif', 'science', 'histoire', 'art_enfant'] as const,
} as const;

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
  category: MAIN_CATEGORIES,
  type: EVENT_TYPES,
  genre: GENRES,
  ambiance: AMBIANCES,
  public: PUBLICS,
  style: [] as readonly string[], // Styles sont dynamiques selon le genre
} as const;

// Fonction pour obtenir les styles d'un genre donné (triés par ordre alphabétique)
export function getStylesForGenre(genre: string): readonly string[] {
  const styles = MUSIC_STYLES[genre] || [];
  // Trier par ordre alphabétique
  return [...styles].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })) as readonly string[];
}

// Fonction pour obtenir les styles d'une catégorie
export function getStylesForCategory(category: string): readonly string[] {
  switch (category) {
    case 'MUSIC':
      return Object.values(MUSIC_STYLES).flat() as readonly string[];
    case 'ART_CULTURE':
      return Object.values(ART_CULTURE_STYLES).flat() as readonly string[];
    case 'SPORT':
      return Object.values(SPORT_STYLES).flat() as readonly string[];
    case 'FAMILY':
      return Object.values(FAMILY_STYLES).flat() as readonly string[];
    default:
      return [];
  }
}

// Fonction pour obtenir les genres d'une catégorie
export function getGenresForCategory(category: string): readonly string[] {
  switch (category) {
    case 'MUSIC':
      return GENRES;
    case 'ART_CULTURE':
      return ['exposition', 'theatre', 'cinema', 'danse', 'opera', 'litterature', 'photographie'] as const;
    case 'SPORT':
      return ['football', 'basketball', 'hockey', 'tennis', 'course', 'cyclisme', 'natation', 'fitness', 'yoga'] as const;
    case 'FAMILY':
      return ['activites_enfants', 'parcs', 'education', 'ateliers_creatifs', 'spectacles_enfants'] as const;
    default:
      return [];
  }
}

// Mapping des catégories vers leurs labels
export const CATEGORY_LABELS: Record<string, { fr: string; en: string; icon: string; color: string }> = {
  MUSIC: { fr: 'Musique', en: 'Music', icon: '🎵', color: '#ef4444' },
  ART_CULTURE: { fr: 'Art & Culture', en: 'Art & Culture', icon: '🎨', color: '#8b5cf6' },
  SPORT: { fr: 'Sport', en: 'Sports', icon: '⚽', color: '#06b6d4' },
  FAMILY: { fr: 'Famille', en: 'Family', icon: '👨‍👩‍👧‍👦', color: '#f59e0b' },
} as const;

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

