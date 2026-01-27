/**
 * POST /api/roles/enable-organizer
 * Active le rôle ORGANIZER pour l'utilisateur connecté
 * Crée aussi un OrganizerProfile si nécessaire
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Vérifier si l'utilisateur a déjà le rôle ORGANIZER
    const existingAssignment = await prisma.userRoleAssignment.findUnique({
      where: {
        unique_user_role: {
          userId,
          role: UserRole.ORGANIZER,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { message: 'Rôle ORGANIZER déjà activé', alreadyHad: true },
        { status: 200 }
      );
    }

    // Créer l'assignation de rôle
    await prisma.userRoleAssignment.create({
      data: {
        userId,
        role: UserRole.ORGANIZER,
      },
    });

    // Mettre à jour le rôle legacy pour compatibilité
    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ORGANIZER },
    });

    // Créer un OrganizerProfile si nécessaire
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { userId },
    });

    if (!existingOrganizer) {
      const displayName = session.user.name || session.user.email?.split('@')[0] || 'Organisateur';
      
      await prisma.organizer.create({
        data: {
          userId,
          displayName,
          verified: false, // Nécessite vérification manuelle si ENFORCE_ORGANIZER_VERIFICATION
        },
      });
    }

    return NextResponse.json(
      { 
        message: 'Rôle ORGANIZER activé avec succès',
        organizerProfileCreated: !existingOrganizer,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur activation rôle ORGANIZER:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Rôle ORGANIZER déjà activé' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'activation du rôle' },
      { status: 500 }
    );
  }
}
