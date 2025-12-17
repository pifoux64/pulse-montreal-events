/**
 * Callback OAuth Eventbrite
 * 
 * GET /api/organizers/integrations/eventbrite/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getEventbriteOrganizer } from '@/lib/publishing/eventbritePublisher';

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
    const clientId = process.env.EVENTBRITE_CLIENT_ID;
    const clientSecret = process.env.EVENTBRITE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/organizers/integrations/eventbrite/callback`;
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/organisateur/integrations?error=config_missing', request.url)
      );
    }
    
    // Échanger le code
    const tokenResponse = await fetch('https://www.eventbrite.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        new URL(`/organisateur/integrations?error=${encodeURIComponent(errorData.error_description || 'token_error')}`, request.url)
      );
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Récupérer l'organisateur Eventbrite
    const ebOrganizer = await getEventbriteOrganizer(accessToken);
    
    // Stocker la connexion
    await prisma.platformConnection.upsert({
      where: {
        organizerId_platform: {
          organizerId: organizer.id,
          platform: 'eventbrite',
        },
      },
      create: {
        organizerId: organizer.id,
        platform: 'eventbrite',
        platformUserId: ebOrganizer.id,
        accessToken,
        // Eventbrite tokens sont long-lived, pas d'expiration
        metadata: {
          organizerName: ebOrganizer.name,
        },
      },
      update: {
        platformUserId: ebOrganizer.id,
        accessToken,
        metadata: {
          organizerName: ebOrganizer.name,
        },
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.redirect(
      new URL('/organisateur/integrations?success=eventbrite_connected', request.url)
    );
  } catch (error: any) {
    console.error('Erreur callback Eventbrite:', error);
    return NextResponse.redirect(
      new URL(`/organisateur/integrations?error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  } finally {
    await prisma.$disconnect();
  }
}

