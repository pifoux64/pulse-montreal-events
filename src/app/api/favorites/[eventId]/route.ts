/**
 * API Routes pour un favori spécifique - Pulse Montreal
 * DELETE /api/favorites/[eventId] - Supprimer un favori
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/favorites/[eventId] - Supprimer un événement des favoris
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Supprimer le favori
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        eventId: params.eventId,
      },
    });

    if (deletedFavorite.count === 0) {
      return NextResponse.json(
        { error: 'Favori non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Favori supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du favori' },
      { status: 500 }
    );
  }
}
