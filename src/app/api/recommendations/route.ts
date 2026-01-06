/**
 * API de recommandations personnalisées
 * GET /api/recommendations - Récupère les recommandations pour l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPersonalizedRecommendations } from '@/lib/recommendations/recommendationEngine';

/**
 * GET /api/recommendations
 * Query params:
 * - limit: nombre de recommandations (défaut: 20)
 * - genre: filtrer par genre
 * - style: filtrer par style
 * - scope: today | weekend | all (défaut: all)
 * - minScore: score minimum (défaut: 0.1)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier si la personnalisation est activée
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { personalizationEnabled: true },
    });

    const personalizationEnabled = userPrefs?.personalizationEnabled ?? true;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const genre = searchParams.get('genre') || undefined;
    const style = searchParams.get('style') || undefined;
    const scope = (searchParams.get('scope') as 'today' | 'weekend' | 'all') || 'all';
    // Réduire le minScore pour permettre plus de recommandations
    const minScore = parseFloat(searchParams.get('minScore') || '0.05');

    console.log(`[Recommendations] User ${session.user.id}, scope: ${scope}, limit: ${limit}, minScore: ${minScore}, personalizationEnabled: ${personalizationEnabled}`);

    // Si personnalisation désactivée, retourner des événements populaires uniquement
    if (!personalizationEnabled) {
      console.log(`[Recommendations] Personalization disabled for user ${session.user.id}, returning popular events`);
      const { getPopularEvents } = await import('@/lib/recommendations/recommendationEngine');
      const popularEvents = await getPopularEvents(limit, scope);
      return NextResponse.json({
        recommendations: popularEvents,
        count: popularEvents.length,
        personalizationEnabled: false,
      });
    }

    const recommendations = await getPersonalizedRecommendations(session.user.id, {
      limit,
      genre,
      style,
      scope,
      minScore,
    });

    console.log(`[Recommendations] Found ${recommendations.length} recommendations for user ${session.user.id}`);

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des recommandations' },
      { status: 500 }
    );
  }
}

