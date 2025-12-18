/**
 * Service de construction du profil de goûts utilisateur
 * SPRINT 2: Personalization & Recommendations
 * 
 * Construit UserTasteProfile à partir des interactions utilisateur
 * Pondération: FAVORITE > SHARE > CLICK > VIEW, avec decay exponentiel sur recency
 */

import { prisma } from '@/lib/prisma';
import { UserEventInteractionType } from '@prisma/client';

export interface TasteProfileData {
  topTags: Record<string, number>; // { tag: weight }
  topGenres: Record<string, number>; // { genre: weight }
  preferredNeighborhoods: string[];
  preferredTimeSlots: Record<string, number>; // { hour: count }
}

/**
 * Pondération des types d'interaction
 */
const INTERACTION_WEIGHTS: Record<UserEventInteractionType, number> = {
  FAVORITE: 10.0,
  SHARE: 5.0,
  CLICK: 2.0,
  VIEW: 1.0,
  DISMISS: -5.0, // Négatif pour pénaliser
};

/**
 * Décay exponentiel: poids réduit de 50% après 30 jours
 */
function getRecencyDecay(daysAgo: number): number {
  const halfLifeDays = 30;
  return Math.pow(0.5, daysAgo / halfLifeDays);
}

/**
 * Construit le profil de goûts d'un utilisateur à partir de ses interactions
 */
export async function buildUserTasteProfile(userId: string): Promise<TasteProfileData> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Récupérer toutes les interactions de l'utilisateur (30 derniers jours)
  const interactions = await prisma.userEventInteraction.findMany({
    where: {
      userId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      event: {
        include: {
          eventTags: true,
          venue: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Initialiser les structures
  const tagWeights: Record<string, number> = {};
  const genreWeights: Record<string, number> = {};
  const neighborhoodCounts: Record<string, number> = {};
  const timeSlotCounts: Record<string, number> = {};

  // Traiter chaque interaction
  for (const interaction of interactions) {
    const event = interaction.event;
    const daysAgo = (now.getTime() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyDecay = getRecencyDecay(daysAgo);
    const baseWeight = INTERACTION_WEIGHTS[interaction.type];
    const finalWeight = baseWeight * recencyDecay;

    // Tags de l'événement
    if (event.tags && event.tags.length > 0) {
      for (const tag of event.tags) {
        tagWeights[tag] = (tagWeights[tag] || 0) + finalWeight;
      }
    }

    // EventTags (genres, styles, etc.)
    if (event.eventTags && event.eventTags.length > 0) {
      for (const eventTag of event.eventTags) {
        if (eventTag.category === 'genre') {
          genreWeights[eventTag.value] = (genreWeights[eventTag.value] || 0) + finalWeight;
        }
        // Les tags de type "style" peuvent aussi être ajoutés aux tags
        if (eventTag.category === 'style') {
          tagWeights[eventTag.value] = (tagWeights[eventTag.value] || 0) + finalWeight * 0.5;
        }
      }
    }

    // Quartier (neighborhood)
    if (event.venue?.neighborhood) {
      neighborhoodCounts[event.venue.neighborhood] = (neighborhoodCounts[event.venue.neighborhood] || 0) + finalWeight;
    }

    // Tranche horaire (heure de début)
    if (event.startAt) {
      const hour = new Date(event.startAt).getHours();
      const timeSlot = `${hour}:00`;
      timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + finalWeight;
    }
  }

  // Normaliser et trier
  const topTags = normalizeAndSort(tagWeights, 20); // Top 20 tags
  const topGenres = normalizeAndSort(genreWeights, 10); // Top 10 genres
  const preferredNeighborhoods = Object.entries(neighborhoodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([neighborhood]) => neighborhood);
  const preferredTimeSlots = normalizeAndSort(timeSlotCounts, 8); // Top 8 tranches horaires

  return {
    topTags,
    topGenres,
    preferredNeighborhoods,
    preferredTimeSlots,
  };
}

/**
 * Normalise les poids (0-1) et retourne les top N
 */
function normalizeAndSort(weights: Record<string, number>, topN: number): Record<string, number> {
  const entries = Object.entries(weights);
  if (entries.length === 0) return {};

  // Trier par poids décroissant
  entries.sort(([, a], [, b]) => b - a);

  // Prendre les top N
  const topEntries = entries.slice(0, topN);

  // Normaliser (le max devient 1.0)
  const maxWeight = topEntries[0]?.[1] || 1;
  const normalized: Record<string, number> = {};
  for (const [key, weight] of topEntries) {
    normalized[key] = weight / maxWeight;
  }

  return normalized;
}

/**
 * Sauvegarde ou met à jour le profil de goûts d'un utilisateur
 */
export async function saveUserTasteProfile(userId: string, profile: TasteProfileData): Promise<void> {
  await prisma.userTasteProfile.upsert({
    where: { userId },
    create: {
      userId,
      topTags: profile.topTags,
      topGenres: profile.topGenres,
      preferredNeighborhoods: profile.preferredNeighborhoods,
      preferredTimeSlots: profile.preferredTimeSlots,
      lastComputedAt: new Date(),
    },
    update: {
      topTags: profile.topTags,
      topGenres: profile.topGenres,
      preferredNeighborhoods: profile.preferredNeighborhoods,
      preferredTimeSlots: profile.preferredTimeSlots,
      lastComputedAt: new Date(),
    },
  });
}

/**
 * Récupère le profil de goûts d'un utilisateur (ou le construit si absent)
 */
export async function getUserTasteProfile(userId: string): Promise<TasteProfileData | null> {
  const profile = await prisma.userTasteProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  return {
    topTags: (profile.topTags as Record<string, number>) || {},
    topGenres: (profile.topGenres as Record<string, number>) || {},
    preferredNeighborhoods: (profile.preferredNeighborhoods as string[]) || [],
    preferredTimeSlots: (profile.preferredTimeSlots as Record<string, number>) || {},
  };
}



