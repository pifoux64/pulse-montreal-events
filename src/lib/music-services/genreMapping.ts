/**
 * Mapping simple Spotify genres -> tags Pulse (SPRINT 6)
 *
 * Spotify retourne des genres libres (ex: "reggae fusion", "dancehall", "dub").
 * Ici on mappe via keywords vers les valeurs de taxonomie Pulse.
 */

import { GENRES, getStylesForGenre } from '@/lib/tagging/taxonomy';

export type PulseMusicGenre = (typeof GENRES)[number];

const KEYWORD_TO_GENRE: Array<{ keyword: string; genre: PulseMusicGenre }> = [
  { keyword: 'reggae', genre: 'reggae' },
  { keyword: 'dancehall', genre: 'reggae' }, // style mais genre parent = reggae
  { keyword: 'dub', genre: 'reggae' },
  { keyword: 'ska', genre: 'reggae' },

  { keyword: 'techno', genre: 'techno' },
  { keyword: 'house', genre: 'house' },
  { keyword: 'electro', genre: 'electronic' },
  { keyword: 'edm', genre: 'electronic' },
  { keyword: 'drum and bass', genre: 'electronic' },
  { keyword: 'dnb', genre: 'electronic' },

  { keyword: 'hip hop', genre: 'hip_hop' },
  { keyword: 'hip-hop', genre: 'hip_hop' },
  { keyword: 'rap', genre: 'rap' },
  { keyword: 'trap', genre: 'rap' },

  { keyword: 'jazz', genre: 'jazz' },
  { keyword: 'blues', genre: 'blues' },

  { keyword: 'rock', genre: 'rock' },
  { keyword: 'metal', genre: 'metal' },
  { keyword: 'punk', genre: 'rock' },
  { keyword: 'indie', genre: 'indie' },

  { keyword: 'pop', genre: 'pop' },
  { keyword: 'r&b', genre: 'rnb' },
  { keyword: 'soul', genre: 'rnb' },

  { keyword: 'latin', genre: 'latin' },
  { keyword: 'salsa', genre: 'latin' },
  { keyword: 'afro', genre: 'world_music' },
  { keyword: 'afrobeats', genre: 'world_music' },

  { keyword: 'classical', genre: 'classical' },
  { keyword: 'orchestra', genre: 'classical' },
  { keyword: 'choral', genre: 'classical' },
];

export function mapSpotifyGenresToPulseGenres(spotifyGenres: string[]): PulseMusicGenre[] {
  const found = new Set<PulseMusicGenre>();
  const normalized = spotifyGenres.map((g) => g.toLowerCase());

  for (const g of normalized) {
    for (const { keyword, genre } of KEYWORD_TO_GENRE) {
      if (g.includes(keyword)) found.add(genre);
    }
  }

  // Fallback: si Spotify renvoie exactement un genre déjà dans la taxonomie
  for (const g of normalized) {
    const candidate = g.replace(/\s+/g, '_') as PulseMusicGenre;
    if ((GENRES as readonly string[]).includes(candidate)) found.add(candidate);
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


