/**
 * API pour suivre/ne plus suivre un organisateur
 * POST /api/organizers/:id/follow - Suivre un organisateur
 * DELETE /api/organizers/:id/follow - Ne plus suivre un organisateur
 * GET /api/organizers/:id/follow - Vérifier si on suit l'organisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/organizers/:id/follow
 * Suivre un organisateur
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const organizerId = params.id;

    // Vérifier que l'organisateur existe
    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier qu'on ne suit pas soi-même
    if (organizer.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous suivre vous-même' },
        { status: 400 }
      );
    }

    // Créer ou récupérer le follow
    const follow = await prisma.organizerFollow.upsert({
      where: {
        unique_user_organizer_follow: {
          userId: session.user.id,
          organizerId,
        },
      },
      create: {
        userId: session.user.id,
        organizerId,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      follow,
    });
  } catch (error) {
    console.error('Erreur lors du suivi de l\'organisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizers/:id/follow
 * Ne plus suivre un organisateur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const organizerId = params.id;

    // Supprimer le follow
    await prisma.organizerFollow.deleteMany({
      where: {
        userId: session.user.id,
        organizerId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du suivi:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizers/:id/follow
 * Vérifier si l'utilisateur suit l'organisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ isFollowing: false });
    }

    const organizerId = params.id;

    const follow = await prisma.organizerFollow.findUnique({
      where: {
        unique_user_organizer_follow: {
          userId: session.user.id,
          organizerId,
        },
      },
    });

    return NextResponse.json({
      isFollowing: !!follow,
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du suivi:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

