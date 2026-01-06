/**
 * Spotify OAuth + API helpers (SPRINT 6)
 *
 * Objectif: connecter Spotify à un profil Pulse pour extraire goûts musicaux.
 * Docs: https://developer.spotify.com/documentation/web-api
 */

import crypto from 'crypto';

export type SpotifyTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export type SpotifyMe = {
  id: string;
  display_name?: string;
};

export type SpotifyTopArtistsResponse = {
  items: Array<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
  }>;
};

export function getSpotifyEnv() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectBase = process.env.NEXTAUTH_URL;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Configuration Spotify manquante: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET",
    );
  }

  return { clientId, clientSecret, redirectBase };
}

export function buildSpotifyRedirectUri() {
  // Priorité: SPOTIFY_REDIRECT_URI > NEXTAUTH_URL + path
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI;
  }
  
  const { redirectBase } = getSpotifyEnv();
  if (!redirectBase) {
    throw new Error('SPOTIFY_REDIRECT_URI or NEXTAUTH_URL must be configured');
  }
  
  // Utiliser le nouveau chemin par défaut
  return `${redirectBase}/api/integrations/spotify/callback`;
}

export function generateOAuthState() {
  return crypto.randomBytes(16).toString('hex');
}

export function buildSpotifyAuthorizeUrl(state: string) {
  const { clientId } = getSpotifyEnv();
  const redirectUri = buildSpotifyRedirectUri();

  // Scopes minimaux pour faciliter l'approbation Spotify
  // user-top-read est suffisant pour récupérer les top artists et dériver les genres
  const scopes = [
    'user-top-read',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${token}`;
}

export async function exchangeSpotifyCodeForTokens(code: string, redirectUri?: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret } = getSpotifyEnv();
  const finalRedirectUri = redirectUri || buildSpotifyRedirectUri();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: finalRedirectUri,
  });

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Spotify token exchange failed: ${resp.status} ${txt}`);
  }

  return (await resp.json()) as SpotifyTokens;
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret } = getSpotifyEnv();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Spotify token refresh failed: ${resp.status} ${txt}`);
  }

  return (await resp.json()) as SpotifyTokens;
}

export async function spotifyGetMe(accessToken: string): Promise<SpotifyMe> {
  const resp = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Spotify /me failed: ${resp.status} ${txt}`);
  }
  return (await resp.json()) as SpotifyMe;
}

/**
 * Gets a valid access token for a user, refreshing if necessary
 * This function should be used instead of directly accessing the token from DB
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  const { decrypt, encrypt } = await import('@/lib/encryption');
  
  const conn = await prisma.musicServiceConnection.findUnique({
    where: { unique_user_music_service: { userId, service: 'spotify' } },
  });
  
  if (!conn) {
    throw new Error('Spotify not connected');
  }
  
  // Déchiffrer token
  let accessToken: string;
  try {
    accessToken = decrypt(conn.accessToken);
  } catch (error) {
    // Si le déchiffrement échoue, peut-être que le token n'est pas chiffré (ancien format)
    // Essayer de l'utiliser tel quel
    accessToken = conn.accessToken;
  }
  
  // Vérifier expiration (refresh si < 5 min restantes)
  if (conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    if (!conn.refreshToken) {
      throw new Error('Refresh token missing. Please reconnect Spotify.');
    }
    
    let refreshTokenValue: string;
    try {
      refreshTokenValue = decrypt(conn.refreshToken);
    } catch (error) {
      refreshTokenValue = conn.refreshToken;
    }
    
    const refreshed = await refreshSpotifyToken(refreshTokenValue);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    
    // Chiffrer et sauvegarder
    await prisma.musicServiceConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encrypt(refreshed.access_token),
        refreshToken: refreshed.refresh_token ? encrypt(refreshed.refresh_token) : undefined,
        expiresAt: newExpiresAt,
      },
    });
    
    return refreshed.access_token;
  }
  
  return accessToken;
}

export async function spotifyGetTopArtists(
  accessToken: string,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
): Promise<SpotifyTopArtistsResponse> {
  const params = new URLSearchParams({
    limit: '50',
    time_range: timeRange,
  });
  const resp = await fetch(`https://api.spotify.com/v1/me/top/artists?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    let errorMessage = `Spotify top artists failed: ${resp.status}`;
    
    if (resp.status === 403) {
      errorMessage = `Accès refusé (403). L'utilisateur doit être enregistré dans le dashboard Spotify Developer. Vérifiez les paramètres sur developer.spotify.com/dashboard et assurez-vous que l'utilisateur est ajouté aux utilisateurs de test de l'application.`;
    } else if (resp.status === 401) {
      errorMessage = `Token invalide ou expiré (401). Veuillez reconnecter votre compte Spotify.`;
    } else {
      try {
        const errorData = JSON.parse(txt);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch {
        errorMessage += ` - ${txt.substring(0, 200)}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  return (await resp.json()) as SpotifyTopArtistsResponse;
}


