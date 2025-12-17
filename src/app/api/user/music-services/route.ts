/**
 * API: Connexions music services de l'utilisateur
 *
 * GET /api/user/music-services
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const connections = await prisma.musicServiceConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      service: true,
      externalUserId: true,
      expiresAt: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ connections });
}


