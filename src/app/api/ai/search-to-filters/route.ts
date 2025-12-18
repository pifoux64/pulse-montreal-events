/**
 * API: Conversion recherche NL -> filtres structurés
 * POST /api/ai/search-to-filters
 * SPRINT 1: AI Search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchToFilters, SearchToFiltersInput } from '@/lib/ai/searchToFilters';
import { filtersToEventQueryParams } from '@/lib/ai/filtersToEventQuery';

export async function POST(request: NextRequest) {
  try {
    // Authentification optionnelle (recherche publique mais on track l'utilisateur si connecté)
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const { queryText, userLat, userLng, timezone } = body as SearchToFiltersInput;

    if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
      return NextResponse.json(
        { error: 'queryText est requis et doit être une chaîne non vide' },
        { status: 400 }
      );
    }

    // Valider les coordonnées si fournies
    if (userLat !== undefined && (typeof userLat !== 'number' || userLat < -90 || userLat > 90)) {
      return NextResponse.json({ error: 'userLat invalide' }, { status: 400 });
    }
    if (userLng !== undefined && (typeof userLng !== 'number' || userLng < -180 || userLng > 180)) {
      return NextResponse.json({ error: 'userLng invalide' }, { status: 400 });
    }

    // Appeler le service AI
    const filters = await searchToFilters({
      queryText: queryText.trim(),
      userLat,
      userLng,
      timezone: timezone || 'America/Montreal',
    });

    // Convertir en query params pour /api/events
    const eventQueryParams = filtersToEventQueryParams(filters, userLat, userLng);

    // Log pour observabilité (optionnel)
    console.log(`[AI Search] "${queryText}" -> confidence: ${filters.confidence}, scope: ${filters.timeScope}`);

    return NextResponse.json({
      filters,
      eventQueryParams,
      userId: session?.user?.id || null,
    });
  } catch (error: any) {
    console.error('Erreur /api/ai/search-to-filters:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de la conversion de la recherche',
      },
      { status: 500 }
    );
  }
}

