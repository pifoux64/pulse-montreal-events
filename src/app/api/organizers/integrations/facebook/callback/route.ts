/**
 * Callback OAuth Facebook
 * 
 * GET /api/organizers/integrations/facebook/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getFacebookPages } from '@/lib/publishing/facebookPublisher';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/organisateur/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/organisateur/integrations?error=no_code', request.url)
      );
    }
    
    // Récupérer l'organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!organizer) {
      return NextResponse.redirect(
        new URL('/organisateur/integrations?error=organizer_not_found', request.url)
      );
    }
    
    // Échanger le code contre un access token
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/organizers/integrations/facebook/callback`;
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/organisateur/integrations?error=config_missing', request.url)
      );
    }
    
    // Échanger le code
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        new URL(`/organisateur/integrations?error=${encodeURIComponent(errorData.error?.message || 'token_error')}`, request.url)
      );
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // 60 jours par défaut
    
    // Récupérer les informations de l'utilisateur
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    
    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL('/organisateur/integrations?error=user_info_error', request.url)
      );
    }
    
    const userData = await userResponse.json();
    
    // Récupérer les pages Facebook
    const pages = await getFacebookPages(accessToken);
    
    // Stocker la connexion
    await prisma.platformConnection.upsert({
      where: {
        organizerId_platform: {
          organizerId: organizer.id,
          platform: 'facebook',
        },
      },
      create: {
        organizerId: organizer.id,
        platform: 'facebook',
        platformUserId: userData.id,
        accessToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        metadata: {
          userName: userData.name,
          pages: pages.map(p => ({ id: p.id, name: p.name })),
          selectedPageId: pages.length > 0 ? pages[0].id : null,
        },
      },
      update: {
        platformUserId: userData.id,
        accessToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        metadata: {
          userName: userData.name,
          pages: pages.map(p => ({ id: p.id, name: p.name })),
          selectedPageId: pages.length > 0 ? pages[0].id : null,
        },
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.redirect(
      new URL('/organisateur/integrations?success=facebook_connected', request.url)
    );
  } catch (error: any) {
    console.error('Erreur callback Facebook:', error);
    return NextResponse.redirect(
      new URL(`/organisateur/integrations?error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  } finally {
    await prisma.$disconnect();
  }
}

