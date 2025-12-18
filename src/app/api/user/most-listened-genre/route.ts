/**
 * API: Récupère le genre le plus écouté sur Spotify pour l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les genres Spotify de l'utilisateur, triés par score décroissant
    const spotifyGenres = await prisma.userInterestTag.findMany({
      where: {
        userId: session.user.id,
        source: 'spotify',
        category: 'genre',
      },
      orderBy: {
        score: 'desc',
      },
      take: 1,
    });

    if (spotifyGenres.length === 0) {
      return NextResponse.json({ genre: null });
    }

    const mostListenedGenre = spotifyGenres[0].value;

    return NextResponse.json({ genre: mostListenedGenre });
  } catch (error: any) {
    console.error('Erreur GET /api/user/most-listened-genre:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du genre' },
      { status: 500 }
    );
  }
}

