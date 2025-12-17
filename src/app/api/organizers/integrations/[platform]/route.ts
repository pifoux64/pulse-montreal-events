/**
 * API: Gérer une connexion de plateforme spécifique
 * 
 * DELETE /api/organizers/integrations/[platform] - Déconnecter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
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
    
    // Supprimer la connexion
    await prisma.platformConnection.deleteMany({
      where: {
        organizerId: organizer.id,
        platform,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Plateforme déconnectée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

