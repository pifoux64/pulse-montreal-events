/**
 * API: Rafraîchir un token de plateforme
 * 
 * POST /api/organizers/integrations/[platform]/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { refreshFacebookToken } from '@/lib/publishing/facebookPublisher';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const platform = params.platform;
    
    // Récupérer l'organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer la connexion
    const connection = await prisma.platformConnection.findUnique({
      where: {
        organizerId_platform: {
          organizerId: organizer.id,
          platform,
        },
      },
    });
    
    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        { error: 'Connexion non trouvée' },
        { status: 404 }
      );
    }
    
    // Rafraîchir selon la plateforme
    switch (platform) {
      case 'facebook': {
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        
        if (!appId || !appSecret) {
          return NextResponse.json(
            { error: 'Configuration Facebook manquante' },
            { status: 500 }
          );
        }
        
        const newToken = await refreshFacebookToken(
          appId,
          appSecret,
          connection.accessToken
        );
        
        // Mettre à jour la connexion
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newToken.access_token,
            expiresAt: new Date(Date.now() + newToken.expires_in * 1000),
            updatedAt: new Date(),
          },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Token rafraîchi avec succès',
        });
      }
      
      case 'eventbrite':
        // Eventbrite utilise des tokens long-lived, pas besoin de refresh
        return NextResponse.json(
          { error: 'Eventbrite ne nécessite pas de rafraîchissement de token' },
          { status: 400 }
        );
      
      default:
        return NextResponse.json(
          { error: `Rafraîchissement non supporté pour ${platform}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erreur lors du rafraîchissement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

