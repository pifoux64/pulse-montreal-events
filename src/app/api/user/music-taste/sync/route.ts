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
import { refreshSpotifyToken, spotifyGetTopArtists } from '@/lib/music-services/spotify';
import { mapSpotifyGenresToPulseGenres } from '@/lib/music-services/genreMapping';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const service = body?.service ?? 'spotify';
  if (service !== 'spotify') {
    return NextResponse.json({ error: 'Service non supporté pour l’instant' }, { status: 400 });
  }

  const conn = await prisma.musicServiceConnection.findUnique({
    where: { unique_user_music_service: { userId: session.user.id, service: 'spotify' } },
  });
  if (!conn) {
    return NextResponse.json({ error: 'Spotify non connecté' }, { status: 400 });
  }

  let accessToken = conn.accessToken;
  let refreshToken = conn.refreshToken ?? null;
  let expiresAt = conn.expiresAt;

  // Refresh si expiré (ou presque)
  if (expiresAt.getTime() < Date.now() + 60_000) {
    if (!refreshToken) {
      return NextResponse.json({ error: 'Token Spotify expiré, veuillez reconnecter.' }, { status: 400 });
    }
    const refreshed = await refreshSpotifyToken(refreshToken);
    accessToken = refreshed.access_token;
    expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    if (refreshed.refresh_token) refreshToken = refreshed.refresh_token;

    await prisma.musicServiceConnection.update({
      where: { id: conn.id },
      data: {
        accessToken,
        refreshToken: refreshToken ?? undefined,
        expiresAt,
      },
    });
  }

  const topArtists = await spotifyGetTopArtists(accessToken, 'medium_term');
  const allSpotifyGenres = Array.from(
    new Set(topArtists.items.flatMap((a) => a.genres || [])),
  );

  const pulseGenres = mapSpotifyGenresToPulseGenres(allSpotifyGenres);

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

  await prisma.userInterestTag.createMany({
    data: pulseGenres.map((genre) => ({
      userId: session.user.id,
      category: 'genre',
      value: genre,
      source: 'spotify',
      score: Math.min(1, (counts.get(genre) ?? 1) / 20),
    })),
  });

  await prisma.musicServiceConnection.update({
    where: { id: conn.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    service: 'spotify',
    spotifyGenresCount: allSpotifyGenres.length,
    pulseGenres,
  });
}


