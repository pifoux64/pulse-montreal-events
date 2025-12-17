/**
 * API: Gérer les intégrations de plateformes pour les organisateurs
 * 
 * GET /api/organizers/integrations - Liste des connexions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
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
    
    // Récupérer les connexions
    const connections = await prisma.platformConnection.findMany({
      where: { organizerId: organizer.id },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        expiresAt: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        // Ne pas exposer les tokens
      },
    });
    
    return NextResponse.json({
      connections,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des intégrations:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

