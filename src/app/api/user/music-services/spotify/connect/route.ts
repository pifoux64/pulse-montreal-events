/**
 * Spotify OAuth connect
 *
 * POST /api/user/music-services/spotify/connect
 * -> returns { authUrl }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSpotifyAuthorizeUrl, generateOAuthState } from '@/lib/music-services/spotify';

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const state = generateOAuthState();

  // Stocker un state temporaire (10 min) en EventFeature-like? On fait simple: DB UserPreferences customFilters.
  // MVP: stocker dans user.preferences.customFilters n'existe pas en DB. Donc on stocke dans UserInterestTag temporaire.
  // Plus propre: table dédiée; pour MVP on stocke dans user_preferences via Prisma Json n'existe pas.
  // => On stocke dans table VerificationToken (déjà présente) avec identifier = `spotify_oauth:${userId}`
  await prisma.verificationToken.create({
    data: {
      identifier: `spotify_oauth:${session.user.id}`,
      token: state,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const authUrl = buildSpotifyAuthorizeUrl(state);
  return NextResponse.json({ authUrl });
}


