/**
 * API: Récupère les événements trending
 * Sprint V2: Social proof + trending
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingEvents, TrendingScope } from '@/lib/trending/trendingEngine';

export const revalidate = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') || 'today') as TrendingScope;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Valider le scope
    if (!['today', 'weekend', 'week'].includes(scope)) {
      return NextResponse.json(
        { error: 'Scope invalide. Utilisez: today, weekend, ou week' },
        { status: 400 }
      );
    }

    const trendingEvents = await getTrendingEvents(scope, limit);

    return NextResponse.json({
      scope,
      count: trendingEvents.length,
      events: trendingEvents,
    });
  } catch (error: any) {
    console.error('Erreur GET /api/trending:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des événements trending' },
      { status: 500 }
    );
  }
}

