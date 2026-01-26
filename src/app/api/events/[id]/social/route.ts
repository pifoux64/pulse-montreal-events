/**
 * API Route pour récupérer les données sociales d'un événement
 * GET /api/events/[id]/social?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // TODO: Implémenter la logique pour récupérer:
    // - Nombre d'amis participants (via EventInvitation ou UserEventInteraction)
    // - Nombre d'amis intéressés (via Favorite)
    // - Score de correspondance avec les goûts de l'utilisateur

    // Pour l'instant, retourner des données vides
    return NextResponse.json({
      friendsAttending: 0,
      friendsInterested: 0,
      tasteMatch: undefined,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données sociales:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
