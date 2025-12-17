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

  if (!clientId || !clientSecret || !redirectBase) {
    throw new Error(
      "Configuration Spotify manquante: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, NEXTAUTH_URL",
    );
  }

  return { clientId, clientSecret, redirectBase };
}

export function buildSpotifyRedirectUri() {
  const { redirectBase } = getSpotifyEnv();
  return `${redirectBase}/api/user/music-services/spotify/callback`;
}

export function generateOAuthState() {
  return crypto.randomBytes(16).toString('hex');
}

export function buildSpotifyAuthorizeUrl(state: string) {
  const { clientId } = getSpotifyEnv();
  const redirectUri = buildSpotifyRedirectUri();

  const scopes = [
    'user-top-read',
    'user-read-email',
    'user-read-private',
    // Optionnel plus tard:
    // 'user-read-recently-played',
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

export async function exchangeSpotifyCodeForTokens(code: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret } = getSpotifyEnv();
  const redirectUri = buildSpotifyRedirectUri();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
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
    throw new Error(`Spotify top artists failed: ${resp.status} ${txt}`);
  }
  return (await resp.json()) as SpotifyTopArtistsResponse;
}


