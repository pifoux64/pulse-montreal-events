/**
 * Spotify OAuth callback
 *
 * GET /api/user/music-services/spotify/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeSpotifyCodeForTokens, spotifyGetMe } from '@/lib/music-services/spotify';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const err = searchParams.get('error');

  if (err) {
    return NextResponse.redirect(new URL(`/profil?error=${encodeURIComponent(err)}`, request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/profil?error=missing_code_or_state', request.url));
  }

  // Vérifier state stocké
  const stateRow = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `spotify_oauth:${session.user.id}`, token: state } },
  });
  if (!stateRow || stateRow.expires < new Date()) {
    return NextResponse.redirect(new URL('/profil?error=invalid_state', request.url));
  }

  // Consommer le token de state
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: `spotify_oauth:${session.user.id}`, token: state } },
  });

  const tokens = await exchangeSpotifyCodeForTokens(code);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const me = await spotifyGetMe(tokens.access_token);

  await prisma.musicServiceConnection.upsert({
    where: { unique_user_music_service: { userId: session.user.id, service: 'spotify' } },
    create: {
      userId: session.user.id,
      service: 'spotify',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      externalUserId: me.id,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt,
      externalUserId: me.id,
      updatedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL('/profil?success=spotify_connected', request.url));
}


