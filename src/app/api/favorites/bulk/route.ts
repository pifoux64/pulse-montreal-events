/**
 * API: Ajouter plusieurs événements aux favoris en bulk
 * Sprint V3: Save all 5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { trackInteraction } from '@/lib/recommendations/interactionTracker';

const BulkAddFavoritesSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(10), // Max 10 pour éviter les abus
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventIds } = BulkAddFavoritesSchema.parse(body);

    // Vérifier que tous les événements existent
    const events = await prisma.event.findMany({
      where: {
        id: {
          in: eventIds,
        },
      },
    });

    if (events.length !== eventIds.length) {
      return NextResponse.json(
        { error: 'Certains événements n\'existent pas' },
        { status: 404 }
      );
    }

    // Ajouter tous les favoris (upsert pour éviter les doublons)
    const favorites = await Promise.all(
      eventIds.map(async (eventId) => {
        const favorite = await prisma.favorite.upsert({
          where: {
            unique_user_event_favorite: {
              userId: session.user.id,
              eventId,
            },
          },
          create: {
            userId: session.user.id,
            eventId,
          },
          update: {},
        });

        // Tracker chaque favori
        await trackInteraction(session.user.id, eventId, 'FAVORITE').catch(() => {});

        return favorite;
      })
    );

    return NextResponse.json({
      message: `${favorites.length} événement(s) ajouté(s) aux favoris`,
      count: favorites.length,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'ajout en bulk aux favoris:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'ajout aux favoris' },
      { status: 500 }
    );
  }
}

