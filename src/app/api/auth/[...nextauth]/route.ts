/**
 * Route API NextAuth pour Pulse
 * Gère l'authentification via magic link et Google OAuth
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

// Wrapper pour mieux gérer les erreurs
async function handleAuthRequest(
  request: NextRequest,
  method: 'GET' | 'POST'
) {
  try {
    // Normaliser l'URL pour gérer localhost et 127.0.0.1
    const url = new URL(request.url);
    if (url.hostname === '127.0.0.1' && process.env.NEXTAUTH_URL?.includes('localhost')) {
      // Si NEXTAUTH_URL utilise localhost mais la requête vient de 127.0.0.1,
      // on peut avoir des problèmes. On laisse NextAuth gérer.
    }

    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error('[NextAuth] Erreur dans le handler:', error);
    
    // Rediriger vers la page d'erreur avec un message approprié
    const errorUrl = new URL('/auth/error', request.url);
    
    if (error?.message?.includes('token') || error?.message?.includes('expired')) {
      errorUrl.searchParams.set('error', 'Verification');
    } else if (error?.message?.includes('database') || error?.message?.includes('connection')) {
      errorUrl.searchParams.set('error', 'Configuration');
    } else {
      errorUrl.searchParams.set('error', 'Callback');
    }
    
    return NextResponse.redirect(errorUrl);
  }
}

export async function GET(request: NextRequest) {
  return handleAuthRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleAuthRequest(request, 'POST');
}
