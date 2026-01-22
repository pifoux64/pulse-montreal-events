/**
 * API Route pour récupérer les utilisateurs recommandés
 * GET /api/users/recommended - Récupère les utilisateurs avec score de similarité
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface PulserSimilarity {
  id: string;
  type: 'user' | 'venue' | 'organizer';
  name: string | null;
  image: string | null;
  slug?: string | null;
  similarityScore?: number;
  commonFavorites?: number;
  commonEvents?: number;
  isFollowing: boolean;
  // Pour venues/organizers
  eventsCount?: number;
  verified?: boolean;
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
  });

  const otherInteractions = await prisma.userEventInteraction.findMany({
    where: { userId: otherUserId },
    select: { eventId: true },
  });

  // Utiliser Set pour dédupliquer automatiquement
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

    // Récupérer tous les pulsers : utilisateurs, venues et organisateurs
    const results: PulserSimilarity[] = [];

    // 1. Récupérer les utilisateurs
    const userHasActivity = await prisma.favorite.count({
      where: { userId: session.user.id },
    }) > 0 || await prisma.userEventInteraction.count({
      where: { userId: session.user.id },
    }) > 0;

    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: userHasActivity ? 30 : 15,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Récupérer les venues
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
      take: 15,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Récupérer les organisateurs
    const organizers = await prisma.organizer.findMany({
      include: {
        user: {
          select: {
            image: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      take: 15,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Récupérer les suivis existants
    const followingUsers = await prisma.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingOrganizers = await prisma.organizerFollow.findMany({
      where: { userId: session.user.id },
      select: { organizerId: true },
    });

    const followingUserIds = new Set(followingUsers.map(f => f.followingId));
    const followingOrganizerIds = new Set(followingOrganizers.map(f => f.organizerId));

    // Traiter les utilisateurs avec similarité
    const usersToProcess = allUsers.slice(0, 20);
    for (const user of usersToProcess) {
      if (followingUserIds.has(user.id)) continue;

      try {
        const { score, commonFavorites, commonEvents } = await calculateSimilarity(
          session.user.id,
          user.id
        );

        if (score > 0 || commonFavorites > 0 || commonEvents > 0) {
          results.push({
            id: user.id,
            type: 'user',
            name: user.name,
            image: user.image,
            similarityScore: score,
            commonFavorites,
            commonEvents,
            isFollowing: false,
          });
        }
      } catch (error) {
        console.warn(`Erreur similarité pour ${user.id}:`, error);
      }
    }

    // Ajouter les venues
    for (const venue of venues) {
      results.push({
        id: venue.id,
        type: 'venue',
        name: venue.name,
        image: null,
        slug: venue.slug,
        isFollowing: false, // Pas de follow pour venues pour le moment
        eventsCount: venue._count.events,
      });
    }

    // Ajouter les organisateurs
    for (const organizer of organizers) {
      // Ignorer si déjà suivi
      if (followingOrganizerIds.has(organizer.id)) continue;

      results.push({
        id: organizer.id,
        type: 'organizer',
        name: organizer.displayName,
        image: organizer.user?.image || null,
        slug: organizer.slug,
        isFollowing: followingOrganizerIds.has(organizer.id),
        eventsCount: organizer._count.events,
        verified: organizer.verified,
      });
    }

    // Trier : utilisateurs avec score en premier, puis venues/organisateurs
    results.sort((a, b) => {
      if (a.type === 'user' && b.type === 'user') {
        return (b.similarityScore || 0) - (a.similarityScore || 0);
      }
      if (a.type === 'user') return -1;
      if (b.type === 'user') return 1;
      return (b.eventsCount || 0) - (a.eventsCount || 0);
    });

    return NextResponse.json({
      pulsers: results.slice(0, limit),
      total: results.length,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs recommandés:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
