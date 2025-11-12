/**
 * API Route pour le profil organisateur de l'utilisateur connecté
 * GET /api/organizers/me - Récupère le profil organisateur de l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/organizers/me - Récupère le profil organisateur de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Aucun profil organisateur trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(organizer);

  } catch (error) {
    console.error('Erreur lors de la récupération du profil organisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du profil organisateur' },
      { status: 500 }
    );
  }
}

