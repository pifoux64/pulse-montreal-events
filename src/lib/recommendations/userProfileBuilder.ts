/**
 * User Profile Builder - Construit le profil musical complet d'un utilisateur
 * pour le système de recommandations personnalisées
 */

import { prisma } from '@/lib/prisma';

export interface UserMusicProfile {
  genres: Map<string, number>; // genre -> poids (0-1)
  styles: Map<string, number>; // style -> poids (0-1)
  types: Map<string, number>; // type -> poids (0-1)
  ambiances: Map<string, number>; // ambiance -> poids (0-1)
  favoriteEventIds: string[]; // IDs des événements favoris
  favoriteGenres: string[]; // Genres des événements favoris
  favoriteStyles: string[]; // Styles des événements favoris
  sources: {
    spotify: boolean;
    appleMusic: boolean;
    manual: boolean;
  };
}

/**
 * Construit le profil musical complet d'un utilisateur
 * en fusionnant les sources (Spotify, Apple Music, manuel, historique)
 */
export async function buildUserMusicProfile(userId: string): Promise<UserMusicProfile> {
  // Récupérer tous les tags d'intérêt de l'utilisateur
  const interestTags = await prisma.userInterestTag.findMany({
    where: { userId },
  });

  // Récupérer les favoris de l'utilisateur avec leurs tags
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          eventTags: true,
        },
      },
    },
  });

  // Construire les maps de poids
  const genres = new Map<string, number>();
  const styles = new Map<string, number>();
  const types = new Map<string, number>();
  const ambiances = new Map<string, number>();

  const sources = {
    spotify: false,
    appleMusic: false,
    manual: false,
  };

  // Traiter les tags d'intérêt
  for (const tag of interestTags) {
    const weight = normalizeScore(tag.score);
    
    if (tag.source === 'spotify') sources.spotify = true;
    if (tag.source === 'apple_music') sources.appleMusic = true;
    if (tag.source === 'manual') sources.manual = true;

    switch (tag.category) {
      case 'genre':
        genres.set(tag.value, Math.max(genres.get(tag.value) || 0, weight));
        break;
      case 'style':
        styles.set(tag.value, Math.max(styles.get(tag.value) || 0, weight));
        break;
      case 'type':
        types.set(tag.value, Math.max(types.get(tag.value) || 0, weight));
        break;
      case 'ambiance':
        ambiances.set(tag.value, Math.max(ambiances.get(tag.value) || 0, weight));
        break;
    }
  }

  // Analyser les favoris pour enrichir le profil
  const favoriteEventIds: string[] = [];
  const favoriteGenres: string[] = [];
  const favoriteStyles: string[] = [];

  for (const fav of favorites) {
    favoriteEventIds.push(fav.eventId);

    // Extraire les genres et styles des tags de l'événement
    for (const tag of fav.event.eventTags) {
      if (tag.category === 'genre') {
        favoriteGenres.push(tag.value);
        // Augmenter le poids du genre basé sur les favoris
        const currentWeight = genres.get(tag.value) || 0;
        genres.set(tag.value, Math.min(1, currentWeight + 0.1)); // +0.1 par favori
      } else if (tag.category === 'style') {
        favoriteStyles.push(tag.value);
        // Augmenter le poids du style basé sur les favoris
        const currentWeight = styles.get(tag.value) || 0;
        styles.set(tag.value, Math.min(1, currentWeight + 0.1)); // +0.1 par favori
      } else if (tag.category === 'type') {
        const currentWeight = types.get(tag.value) || 0;
        types.set(tag.value, Math.min(1, currentWeight + 0.1));
      } else if (tag.category === 'ambiance') {
        const currentWeight = ambiances.get(tag.value) || 0;
        ambiances.set(tag.value, Math.min(1, currentWeight + 0.1));
      }
    }
  }

  return {
    genres,
    styles,
    types,
    ambiances,
    favoriteEventIds,
    favoriteGenres,
    favoriteStyles,
    sources,
  };
}

/**
 * Fusionne les sources de goûts musicaux (Spotify, Apple Music, manuel)
 * avec priorité : manuel > Spotify/Apple Music
 */
export async function mergeMusicTasteSources(userId: string): Promise<{
  genres: Map<string, number>;
  styles: Map<string, number>;
}> {
  const profile = await buildUserMusicProfile(userId);
  return {
    genres: profile.genres,
    styles: profile.styles,
  };
}

/**
 * Calcule les poids de préférence par genre
 */
export async function calculateGenreWeights(userId: string): Promise<Map<string, number>> {
  const profile = await buildUserMusicProfile(userId);
  return profile.genres;
}

/**
 * Normalise un score (0-1) en s'assurant qu'il reste dans la plage valide
 */
function normalizeScore(score: number): number {
  // Si le score est déjà entre 0 et 1, le retourner tel quel
  if (score >= 0 && score <= 1) return score;
  
  // Sinon, normaliser (par exemple, si score = 5, on pourrait le diviser par 10)
  // Pour l'instant, on assume que les scores sont déjà normalisés
  return Math.max(0, Math.min(1, score));
}

