/**
 * Mapping simple Spotify genres -> tags Pulse (SPRINT 6)
 *
 * Spotify retourne des genres libres (ex: "reggae fusion", "dancehall", "dub").
 * Ici on mappe via keywords vers les valeurs de taxonomie Pulse.
 */

import { GENRES, getStylesForGenre } from '@/lib/tagging/taxonomy';

export type PulseMusicGenre = (typeof GENRES)[number];

const KEYWORD_TO_GENRE: Array<{ keyword: string; genre: PulseMusicGenre }> = [
  // IMPORTANT: Les keywords plus longs doivent être en premier pour éviter les faux positifs
  // Ex: "rocksteady" doit être traité avant "rock" pour éviter de matcher "rock"
  { keyword: 'rocksteady', genre: 'reggae' }, // Style de reggae, pas de rock !
  { keyword: 'dancehall', genre: 'reggae' }, // style mais genre parent = reggae
  { keyword: 'drum and bass', genre: 'electronic' },
  { keyword: 'hip hop', genre: 'hip_hop' },
  { keyword: 'hip-hop', genre: 'hip_hop' },
  
  // Genres reggae (après rocksteady pour éviter conflit)
  { keyword: 'reggae', genre: 'reggae' },
  { keyword: 'dub', genre: 'reggae' },
  { keyword: 'ska', genre: 'reggae' },

  { keyword: 'techno', genre: 'techno' },
  { keyword: 'house', genre: 'house' },
  { keyword: 'electro', genre: 'electronic' },
  { keyword: 'edm', genre: 'electronic' },
  { keyword: 'dnb', genre: 'electronic' },

  { keyword: 'rap', genre: 'rap' },
  { keyword: 'trap', genre: 'rap' },

  { keyword: 'jazz', genre: 'jazz' },
  { keyword: 'blues', genre: 'blues' },

  // Rock doit être après rocksteady pour éviter les faux positifs
  { keyword: 'rock', genre: 'rock' },
  { keyword: 'metal', genre: 'metal' },
  { keyword: 'punk', genre: 'rock' },
  { keyword: 'indie', genre: 'indie' },

  { keyword: 'pop', genre: 'pop' },
  { keyword: 'r&b', genre: 'rnb' },
  { keyword: 'soul', genre: 'rnb' },

  { keyword: 'latin', genre: 'latin' },
  { keyword: 'salsa', genre: 'latin' },
  { keyword: 'afrobeats', genre: 'world_music' },
  { keyword: 'afro', genre: 'world_music' }, // Après afrobeats pour éviter conflit

  { keyword: 'classical', genre: 'classical' },
  { keyword: 'orchestra', genre: 'classical' },
  { keyword: 'choral', genre: 'classical' },
];

export function mapSpotifyGenresToPulseGenres(spotifyGenres: string[]): PulseMusicGenre[] {
  const found = new Set<PulseMusicGenre>();
  const normalized = spotifyGenres.map((g) => g.toLowerCase().trim());

  // Trier les keywords par longueur décroissante pour éviter les faux positifs
  // (ex: "rocksteady" doit être traité avant "rock" pour éviter de matcher "rock")
  const sortedKeywords = [...KEYWORD_TO_GENRE].sort((a, b) => b.keyword.length - a.keyword.length);

  for (const g of normalized) {
    let matched = false;
    
    // Essayer d'abord les correspondances exactes ou avec séparateurs
    for (const { keyword, genre } of sortedKeywords) {
      // Correspondance exacte
      if (g === keyword) {
        found.add(genre);
        matched = true;
        break;
      }
      
      // Correspondance avec séparateurs (espace, tiret, underscore)
      const regex = new RegExp(`(^|[-_\\s])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([-_\\s]|$)`, 'i');
      if (regex.test(g)) {
        found.add(genre);
        matched = true;
        break;
      }
    }
    
    // Si pas de match avec keywords, essayer le fallback
    if (!matched) {
      const candidate = g.replace(/\s+/g, '_') as PulseMusicGenre;
      if ((GENRES as readonly string[]).includes(candidate)) {
        found.add(candidate);
      }
    }
  }

  return Array.from(found);
}

export function mapSpotifyGenresToPulseStyles(
  spotifyGenres: string[],
  pulseGenre: PulseMusicGenre,
): string[] {
  // MVP: mappe uniquement des styles évidents si présents dans la liste taxonomie
  const styles = getStylesForGenre(pulseGenre);
  const normalized = spotifyGenres.map((g) => g.toLowerCase());
  const out = new Set<string>();

  for (const style of styles) {
    const styleLabel = style.replace(/_/g, ' ').toLowerCase();
    if (normalized.some((g) => g.includes(styleLabel))) out.add(style);
  }

  return Array.from(out);
}


