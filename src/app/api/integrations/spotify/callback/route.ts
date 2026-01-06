/**
 * GET /api/integrations/spotify/callback?code=...&state=...
 * Échange le code OAuth contre tokens et sauvegarde la connexion
 * 
 * Cette route est l'endpoint standardisé pour le callback OAuth Spotify.
 * L'ancienne route /api/user/music-services/spotify/callback reste disponible pour compatibilité.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeSpotifyCodeForTokens, spotifyGetMe, buildSpotifyRedirectUri } from '@/lib/music-services/spotify';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 secondes max

export async function GET(request: NextRequest) {
  try {
    console.log('[Spotify Callback] Début du callback');
    console.log('[Spotify Callback] URL:', request.url);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Spotify Callback] Pas de session, redirection vers signin');
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/profil', request.url));
    }

    console.log('[Spotify Callback] Session trouvée pour user:', session.user.id);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const err = searchParams.get('error');

    if (err) {
      console.log('[Spotify Callback] Erreur dans les paramètres:', err);
      return NextResponse.redirect(new URL(`/profil?error=${encodeURIComponent(err)}`, request.url));
    }
    if (!code || !state) {
      console.log('[Spotify Callback] Code ou state manquant');
      return NextResponse.redirect(new URL('/profil?error=missing_code_or_state', request.url));
    }

    console.log('[Spotify Callback] Vérification du state...');
    // Vérifier state stocké (protection CSRF)
    const stateRow = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: `spotify_oauth:${session.user.id}`, token: state } },
    });
    if (!stateRow || stateRow.expires < new Date()) {
      console.log('[Spotify Callback] State invalide ou expiré', { 
        found: !!stateRow, 
        expired: stateRow ? stateRow.expires < new Date() : 'N/A' 
      });
      return NextResponse.redirect(new URL('/profil?error=invalid_state', request.url));
    }

    console.log('[Spotify Callback] State valide, suppression...');
    // Consommer le token de state
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: `spotify_oauth:${session.user.id}`, token: state } },
    });

    console.log('[Spotify Callback] Échange du code contre tokens...');
    const redirectUri = buildSpotifyRedirectUri();
    const tokens = await exchangeSpotifyCodeForTokens(code, redirectUri);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    console.log('[Spotify Callback] Récupération des infos utilisateur Spotify...');
    const me = await spotifyGetMe(tokens.access_token);

    console.log('[Spotify Callback] Sauvegarde de la connexion...');
    // Chiffrer les tokens avant stockage
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    await prisma.musicServiceConnection.upsert({
      where: { unique_user_music_service: { userId: session.user.id, service: 'spotify' } },
      create: {
        userId: session.user.id,
        service: 'spotify',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        externalUserId: me.id,
        scopes: tokens.scope || 'user-top-read',
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken ?? undefined,
        expiresAt,
        externalUserId: me.id,
        scopes: tokens.scope || 'user-top-read',
        updatedAt: new Date(),
      },
    });

    console.log('[Spotify Callback] Succès, redirection vers profil');
    return NextResponse.redirect(new URL('/profil?success=spotify_connected', request.url));
  } catch (error: any) {
    console.error('[Spotify Callback] Erreur:', error);
    console.error('[Spotify Callback] Stack:', error?.stack);
    
    // Extraire un message d'erreur lisible
    let errorMessage = 'unknown_error';
    if (error?.message) {
      if (error.message.includes('Configuration Spotify manquante')) {
        errorMessage = 'spotify_config_missing';
      } else if (error.message.includes('token exchange failed')) {
        errorMessage = 'spotify_token_exchange_failed';
      } else if (error.message.includes('/me failed')) {
        errorMessage = 'spotify_api_error';
      } else if (error.message.includes('P2002') || error.message.includes('Unique constraint')) {
        errorMessage = 'database_constraint_error';
      } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'database_connection_error';
      } else {
        errorMessage = encodeURIComponent(error.message.substring(0, 100));
      }
    }
    
    return NextResponse.redirect(
      new URL(`/profil?error=${errorMessage}`, request.url)
    );
  }
}

