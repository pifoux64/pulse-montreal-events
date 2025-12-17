/**
 * API: Connecter une plateforme
 * 
 * POST /api/organizers/integrations/[platform]/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

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
    
    // Générer l'URL d'autorisation selon la plateforme
    let authUrl: string;
    
    switch (platform) {
      case 'facebook': {
        const clientId = process.env.FACEBOOK_APP_ID;
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/organizers/integrations/facebook/callback`;
        const scopes = 'pages_manage_events,pages_show_list';
        
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
        break;
      }
      
      case 'eventbrite': {
        const clientId = process.env.EVENTBRITE_CLIENT_ID;
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/organizers/integrations/eventbrite/callback`;
        
        authUrl = `https://www.eventbrite.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;
      }
      
      case 'resident_advisor': {
        // RA n'a pas d'API publique, donc pas d'OAuth
        // On peut juste créer une connexion "manuelle" pour l'export
        await prisma.platformConnection.upsert({
          where: {
            organizerId_platform: {
              organizerId: organizer.id,
              platform: 'resident_advisor',
            },
          },
          create: {
            organizerId: organizer.id,
            platform: 'resident_advisor',
            metadata: { type: 'export_only' },
          },
          update: {
            metadata: { type: 'export_only' },
          },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Resident Advisor configuré pour l\'export',
        });
      }
      
      case 'bandsintown': {
        // Bandsintown utilise une API key plutôt qu'OAuth
        // Pour l'instant, on retourne une erreur indiquant qu'il faut configurer l'API key
        return NextResponse.json(
          { error: 'Bandsintown nécessite une API key. Veuillez la configurer dans les paramètres.' },
          { status: 400 }
        );
      }
      
      default:
        return NextResponse.json(
          { error: `Plateforme non supportée: ${platform}` },
          { status: 400 }
        );
    }
    
    // Stocker l'état OAuth dans la session ou un token temporaire
    // Pour simplifier, on peut utiliser un cookie ou stocker dans la DB
    
    return NextResponse.json({
      authUrl,
    });
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

