/**
 * GET /api/integrations/spotify/auth
 * Redirige vers Spotify authorize URL
 * 
 * Cette route est l'endpoint standardisé pour l'OAuth Spotify.
 * L'ancienne route /api/user/music-services/spotify/connect reste disponible pour compatibilité.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSpotifyAuthorizeUrl, generateOAuthState } from '@/lib/music-services/spotify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/profil', request.url));
    }

    const state = generateOAuthState();

    // Stocker state temporaire (10 min) pour validation CSRF
    await prisma.verificationToken.create({
      data: {
        identifier: `spotify_oauth:${session.user.id}`,
        token: state,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const authUrl = buildSpotifyAuthorizeUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[Spotify Auth] Erreur:', error);
    return NextResponse.redirect(
      new URL(`/profil?error=${encodeURIComponent(error.message || 'Erreur lors de la connexion Spotify')}`, request.url)
    );
  }
}

