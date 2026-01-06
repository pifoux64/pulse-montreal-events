/**
 * User Profile Builder - Construit le profil musical complet d'un utilisateur
 * pour le système de recommandations personnalisées
 * 
 * Utilise maintenant les préférences directes (onboarding) au lieu de Spotify
 */

import { prisma } from '@/lib/prisma';

export interface UserMusicProfile {
  genres: Map<string, number>; // genre -> poids (0-1)
  styles: Map<string, number>; // style -> poids (0-1)
  types: Map<string, number>; // type -> poids (0-1)
  ambiances: Map<string, number>; // ambiance -> poids (0-1)
  categories: Map<string, number>; // catégorie -> poids (0-1)
  favoriteEventIds: string[]; // IDs des événements favoris
  favoriteGenres: string[]; // Genres des événements favoris
  favoriteStyles: string[]; // Styles des événements favoris
  preferredDays: string[]; // weekday, weekend
  preferredTimes: string[]; // day, evening, night
  sources: {
    onboarding: boolean; // Préférences depuis onboarding
    manual: boolean; // Tags manuels ajoutés
  };
}

/**
 * Construit le profil musical complet d'un utilisateur
 * en fusionnant les sources (onboarding direct, tags manuels, historique)
 */
export async function buildUserMusicProfile(userId: string): Promise<UserMusicProfile> {
  // Récupérer les préférences utilisateur (onboarding)
  const userPreferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  // Récupérer tous les tags d'intérêt de l'utilisateur (tags manuels)
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
    take: 100, // Limiter à 100 favoris pour éviter les requêtes trop lourdes
  });

  // Construire les maps de poids
  const genres = new Map<string, number>();
  const styles = new Map<string, number>();
  const types = new Map<string, number>();
  const ambiances = new Map<string, number>();
  const categories = new Map<string, number>();

  const sources = {
    onboarding: false,
    manual: false,
  };

  // Traiter les préférences depuis l'onboarding (priorité haute)
  if (userPreferences) {
    // Music preferences -> genres avec poids 0.9 (priorité haute)
    for (const genre of userPreferences.musicPreferences) {
      genres.set(genre, 0.9);
      sources.onboarding = true;
    }

    // Category preferences -> categories avec poids 0.9
    for (const category of userPreferences.categoryPreferences) {
      categories.set(category, 0.9);
      sources.onboarding = true;
    }

    // Vibe preferences -> ambiances avec poids 0.9
    for (const vibe of userPreferences.vibePreferences) {
      ambiances.set(vibe, 0.9);
      sources.onboarding = true;
    }
  }

  // Traiter les tags d'intérêt manuels (priorité moyenne)
  for (const tag of interestTags) {
    if (tag.source === 'manual') {
      let weight = normalizeScore(tag.score);
      weight = Math.max(weight, 0.8); // Poids minimum pour tags manuels
      sources.manual = true;

      switch (tag.category) {
        case 'genre':
          // Utiliser le max pour garder le poids le plus élevé (onboarding > manuel)
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
  }

  // Analyser les favoris pour enrichir le profil (priorité basse, +0.05 par favori)
  const favoriteEventIds: string[] = [];
  const favoriteGenres: string[] = [];
  const favoriteStyles: string[] = [];

  for (const fav of favorites) {
    favoriteEventIds.push(fav.eventId);

    // Extraire les genres et styles des tags de l'événement
    for (const tag of fav.event.eventTags) {
      if (tag.category === 'genre') {
        favoriteGenres.push(tag.value);
        // Augmenter le poids du genre basé sur les favoris (mais ne pas dépasser les préférences onboarding)
        const currentWeight = genres.get(tag.value) || 0;
        if (currentWeight < 0.9) {
          // Ne pas modifier si déjà défini par onboarding
          genres.set(tag.value, Math.min(0.85, currentWeight + 0.05)); // +0.05 par favori, max 0.85
        }
      } else if (tag.category === 'style') {
        favoriteStyles.push(tag.value);
        const currentWeight = styles.get(tag.value) || 0;
        styles.set(tag.value, Math.min(0.85, currentWeight + 0.05));
      } else if (tag.category === 'type') {
        const currentWeight = types.get(tag.value) || 0;
        types.set(tag.value, Math.min(0.85, currentWeight + 0.05));
      } else if (tag.category === 'ambiance') {
        const currentWeight = ambiances.get(tag.value) || 0;
        ambiances.set(tag.value, Math.min(0.85, currentWeight + 0.05));
      } else if (tag.category === 'category') {
        const currentWeight = categories.get(tag.value) || 0;
        categories.set(tag.value, Math.min(0.85, currentWeight + 0.05));
      }
    }
  }

  return {
    genres,
    styles,
    types,
    ambiances,
    categories,
    favoriteEventIds,
    favoriteGenres,
    favoriteStyles,
    preferredDays: userPreferences?.preferredDays || [],
    preferredTimes: userPreferences?.preferredTimes || [],
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

