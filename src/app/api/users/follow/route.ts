/**
 * API Route pour suivre/défollow un utilisateur
 * POST /api/users/follow - Suivre un utilisateur
 * DELETE /api/users/follow - Défollow un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/users/follow - Suivre un utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous suivre vous-même' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!userToFollow) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si déjà suivi
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Vous suivez déjà cet utilisateur' },
        { status: 409 }
      );
    }

    // Créer le follow
    const follow = await prisma.userFollow.create({
      data: {
        followerId: session.user.id,
        followingId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ follow });

  } catch (error: any) {
    console.error('Erreur lors du follow:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du follow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/follow - Défollow un utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Supprimer le follow
    await prisma.userFollow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur lors du unfollow:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du unfollow' },
      { status: 500 }
    );
  }
}
