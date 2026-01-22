/**
 * API Route pour récupérer les utilisateurs que je suis
 * GET /api/users/following - Liste des utilisateurs suivis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const following = await prisma.userFollow.findMany({
      where: {
        followerId: session.user.id,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            email: false,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      following: following.map((f) => f.following),
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des following:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
