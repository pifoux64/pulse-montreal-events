/**
 * API Routes pour les favoris - Pulse Montreal
 * GET /api/favorites - Liste des favoris de l'utilisateur
 * POST /api/favorites - Ajouter un favori
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddFavoriteSchema = z.object({
  eventId: z.string().uuid(),
});

/**
 * GET /api/favorites - Récupère les favoris de l'utilisateur
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;

    try {
      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId: session.user.id },
          include: {
            event: {
              include: {
                venue: true,
                organizer: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    favorites: true,
                  },
                },
              },
            },
          },
          orderBy: { id: 'desc' }, // Utiliser id comme fallback si createdAt n'existe pas encore
          skip,
          take: pageSize,
        }),
        prisma.favorite.count({
          where: { userId: session.user.id },
        }),
      ]);

      return NextResponse.json({
        items: favorites.map(fav => fav.event),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (dbError: any) {
      // Si la table n'existe pas encore, retourner une liste vide
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        console.warn('Table favorites n\'existe pas encore, retour d\'une liste vide');
        return NextResponse.json({
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des favoris' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites - Ajouter un événement aux favoris
 */
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
    const { eventId } = AddFavoriteSchema.parse(body);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Ajouter aux favoris (upsert pour éviter les doublons)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      create: {
        userId: session.user.id,
        eventId,
      },
      update: {},
      include: {
        event: {
          include: {
            venue: true,
            organizer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(favorite, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    
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

/**
 * DELETE /api/favorites - Supprimer tous les favoris de l'utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Supprimer tous les favoris de l'utilisateur
    const deletedCount = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'Tous les favoris ont été supprimés',
      deletedCount: deletedCount.count,
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression des favoris' },
      { status: 500 }
    );
  }
}
