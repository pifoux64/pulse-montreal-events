/**
 * API de recommandations personnalisées
 * GET /api/recommendations - Récupère les recommandations pour l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const genre = searchParams.get('genre') || undefined;
    const style = searchParams.get('style') || undefined;
    const scope = (searchParams.get('scope') as 'today' | 'weekend' | 'all') || 'all';
    // Réduire le minScore pour permettre plus de recommandations
    const minScore = parseFloat(searchParams.get('minScore') || '0.05');

    console.log(`[Recommendations] User ${session.user.id}, scope: ${scope}, limit: ${limit}, minScore: ${minScore}`);

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

