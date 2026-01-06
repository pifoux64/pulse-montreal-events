/**
 * DELETE /api/integrations/spotify/disconnect
 * Déconnecte Spotify et optionnellement supprime les données dérivées
 * 
 * Body: { deleteData?: boolean }
 * - deleteData: true = supprime aussi les tags Spotify (UserInterestTag avec source='spotify')
 * - deleteData: false ou absent = garde les tags mais supprime la connexion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const deleteData = body.deleteData === true;

    console.log(`[Spotify Disconnect] User ${session.user.id}, deleteData: ${deleteData}`);

    // Supprimer la connexion Spotify
    const deleted = await prisma.musicServiceConnection.deleteMany({
      where: { 
        userId: session.user.id, 
        service: 'spotify' 
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Spotify non connecté' }, { status: 400 });
    }

    // Si deleteData, supprimer aussi les tags Spotify dérivés
    if (deleteData) {
      const deletedTags = await prisma.userInterestTag.deleteMany({
        where: { 
          userId: session.user.id, 
          source: 'spotify' 
        },
      });
      
      console.log(`[Spotify Disconnect] ${deletedTags.count} tags Spotify supprimés`);
      
      // Optionnel : Supprimer UserTasteProfile si uniquement basé sur Spotify
      // Pour l'instant, on garde le profil car il peut contenir d'autres sources
    }

    return NextResponse.json({ 
      success: true,
      deletedConnection: true,
      deletedData: deleteData,
    });
  } catch (error: any) {
    console.error('[Spotify Disconnect] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur lors de la déconnexion: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

