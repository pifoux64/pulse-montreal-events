/**
 * API Route pour récupérer les utilisateurs recommandés
 * GET /api/users/recommended - Récupère les utilisateurs avec score de similarité
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface UserSimilarity {
  userId: string;
  name: string | null;
  image: string | null;
  similarityScore: number;
  commonFavorites: number;
  commonEvents: number;
  isFollowing: boolean;
}

/**
 * Calcule le score de similarité entre deux utilisateurs
 */
async function calculateSimilarity(
  currentUserId: string,
  otherUserId: string
): Promise<{ score: number; commonFavorites: number; commonEvents: number }> {
  // Récupérer les favoris des deux utilisateurs
  const currentFavorites = await prisma.favorite.findMany({
    where: { userId: currentUserId },
    select: { eventId: true },
  });

  const otherFavorites = await prisma.favorite.findMany({
    where: { userId: otherUserId },
    select: { eventId: true },
  });

  const currentFavoriteIds = new Set(currentFavorites.map(f => f.eventId));
  const otherFavoriteIds = new Set(otherFavorites.map(f => f.eventId));

  // Compter les favoris communs
  let commonFavorites = 0;
  for (const eventId of currentFavoriteIds) {
    if (otherFavoriteIds.has(eventId)) {
      commonFavorites++;
    }
  }

  // Récupérer les interactions (événements visités/cliqués)
  const currentInteractions = await prisma.userEventInteraction.findMany({
    where: { userId: currentUserId },
    select: { eventId: true },
    distinct: ['eventId'],
  });

  const otherInteractions = await prisma.userEventInteraction.findMany({
    where: { userId: otherUserId },
    select: { eventId: true },
    distinct: ['eventId'],
  });

  const currentEventIds = new Set(currentInteractions.map(i => i.eventId));
  const otherEventIds = new Set(otherInteractions.map(i => i.eventId));

  // Compter les événements communs
  let commonEvents = 0;
  for (const eventId of currentEventIds) {
    if (otherEventIds.has(eventId)) {
      commonEvents++;
    }
  }

  // Récupérer les tags d'intérêt
  const currentTags = await prisma.userInterestTag.findMany({
    where: { userId: currentUserId },
    select: { tag: true },
  });

  const otherTags = await prisma.userInterestTag.findMany({
    where: { userId: otherUserId },
    select: { tag: true },
  });

  const currentTagSet = new Set(currentTags.map(t => t.tag));
  const otherTagSet = new Set(otherTags.map(t => t.tag));

  // Compter les tags communs
  let commonTags = 0;
  for (const tag of currentTagSet) {
    if (otherTagSet.has(tag)) {
      commonTags++;
    }
  }

  // Calculer le score de similarité
  // Poids: favoris communs (40%), événements communs (30%), tags communs (30%)
  const totalFavorites = Math.max(currentFavoriteIds.size, otherFavoriteIds.size, 1);
  const totalEvents = Math.max(currentEventIds.size, otherEventIds.size, 1);
  const totalTags = Math.max(currentTagSet.size, otherTagSet.size, 1);

  const favoriteScore = (commonFavorites / totalFavorites) * 0.4;
  const eventScore = (commonEvents / totalEvents) * 0.3;
  const tagScore = (commonTags / totalTags) * 0.3;

  const score = favoriteScore + eventScore + tagScore;

  return {
    score: Math.min(score, 1), // Limiter à 1
    commonFavorites,
    commonEvents,
  };
}

/**
 * GET /api/users/recommended - Récupère les utilisateurs recommandés
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Récupérer tous les utilisateurs (sauf soi-même et les organisateurs)
    // Si l'utilisateur n'a pas encore de favoris/interactions, retourner des utilisateurs populaires
    const userHasActivity = await prisma.favorite.count({
      where: { userId: session.user.id },
    }) > 0 || await prisma.userEventInteraction.count({
      where: { userId: session.user.id },
    }) > 0;

    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: 'USER', // Seulement les utilisateurs normaux
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: userHasActivity ? 50 : 20, // Moins d'utilisateurs si pas d'activité
      orderBy: {
        createdAt: 'desc', // Utilisateurs récents en premier si pas d'activité
      },
    });

    // Récupérer les utilisateurs déjà suivis
    const following = await prisma.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = new Set(following.map(f => f.followingId));

    // Calculer la similarité pour chaque utilisateur (limiter à 20 pour performance)
    const similarities: UserSimilarity[] = [];
    const usersToProcess = allUsers.slice(0, 20); // Limiter pour éviter trop de calculs

    for (const user of usersToProcess) {
      // Ignorer si déjà suivi
      if (followingIds.has(user.id)) {
        continue;
      }

      try {
        const { score, commonFavorites, commonEvents } = await calculateSimilarity(
          session.user.id,
          user.id
        );

        // Ne garder que les utilisateurs avec un score > 0 OU qui ont au moins un favori/événement en commun
        if (score > 0 || commonFavorites > 0 || commonEvents > 0) {
          similarities.push({
            userId: user.id,
            name: user.name,
            image: user.image,
            similarityScore: score,
            commonFavorites,
            commonEvents,
            isFollowing: false,
          });
        }
      } catch (error) {
        // Ignorer les erreurs pour un utilisateur spécifique et continuer
        console.warn(`Erreur lors du calcul de similarité pour ${user.id}:`, error);
        continue;
      }
    }

    // Trier par score de similarité décroissant
    similarities.sort((a, b) => b.similarityScore - a.similarityScore);

    // Retourner les top N
    return NextResponse.json({
      users: similarities.slice(0, limit),
      total: similarities.length,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs recommandés:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
