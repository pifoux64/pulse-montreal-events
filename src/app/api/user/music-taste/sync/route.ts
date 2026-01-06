/**
 * Sync des goûts musicaux (Spotify MVP)
 *
 * POST /api/user/music-taste/sync
 * Body: { service?: 'spotify' } (default spotify)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken, spotifyGetTopArtists } from '@/lib/music-services/spotify';
import { mapSpotifyGenresToPulseGenres, mapSpotifyGenresToPulseStyles } from '@/lib/music-services/genreMapping';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const service = body?.service ?? 'spotify';
    if (service !== 'spotify') {
      return NextResponse.json({ error: "Service non supporté pour l'instant" }, { status: 400 });
    }

    const conn = await prisma.musicServiceConnection.findUnique({
      where: { unique_user_music_service: { userId: session.user.id, service: 'spotify' } },
    });
    if (!conn) {
      return NextResponse.json({ error: 'Spotify non connecté' }, { status: 400 });
    }

    // Utiliser getValidAccessToken qui gère automatiquement le refresh
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(session.user.id);
    } catch (error: any) {
      console.error('[Spotify Sync] Erreur lors de la récupération du token:', error);
      return NextResponse.json(
        { error: `Erreur lors de la récupération du token Spotify: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    let topArtists;
    try {
      topArtists = await spotifyGetTopArtists(accessToken, 'medium_term');
    } catch (error: any) {
      console.error('[Spotify Sync] Erreur lors de la récupération des top artists:', error);
      return NextResponse.json(
        { error: `Erreur lors de la récupération des artistes Spotify: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    const allSpotifyGenres = Array.from(
      new Set(topArtists.items.flatMap((a) => a.genres || [])),
    );

    const pulseGenres = mapSpotifyGenresToPulseGenres(allSpotifyGenres);
    const pulseStyles = Array.from(
      new Set(pulseGenres.flatMap((g) => mapSpotifyGenresToPulseStyles(allSpotifyGenres, g))),
    );

    // Upsert intérêts (source spotify). On garde un score simple basé sur occurrences.
    const counts = new Map<string, number>();
    for (const g of allSpotifyGenres) {
      for (const pg of mapSpotifyGenresToPulseGenres([g])) {
        counts.set(pg, (counts.get(pg) ?? 0) + 1);
      }
    }

    // Option: nettoyer anciens tags spotify (pour éviter accumulation)
    await prisma.userInterestTag.deleteMany({
      where: { userId: session.user.id, source: 'spotify', category: 'genre' },
    });
    await prisma.userInterestTag.deleteMany({
      where: { userId: session.user.id, source: 'spotify', category: 'style' },
    });

    if (pulseGenres.length > 0) {
      await prisma.userInterestTag.createMany({
        data: pulseGenres.map((genre) => ({
          userId: session.user.id,
          category: 'genre',
          value: genre,
          source: 'spotify',
          score: Math.min(1, (counts.get(genre) ?? 1) / 20),
        })),
      });
    }

    if (pulseStyles.length > 0) {
      await prisma.userInterestTag.createMany({
        data: pulseStyles.map((style) => ({
          userId: session.user.id,
          category: 'style',
          value: style,
          source: 'spotify',
          score: 1,
        })),
      });
    }

    await prisma.musicServiceConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      service: 'spotify',
      spotifyGenresCount: allSpotifyGenres.length,
      pulseGenres,
      pulseStyles,
    });
  } catch (error: any) {
    console.error('[Spotify Sync] Erreur inattendue:', error);
    return NextResponse.json(
      { error: `Erreur lors de la synchronisation: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}


