/**
 * Spotify connection management
 *
 * DELETE /api/user/music-services/spotify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  await prisma.musicServiceConnection.deleteMany({
    where: { userId: session.user.id, service: 'spotify' },
  });

  // Option: supprimer aussi les tags issus de spotify
  await prisma.userInterestTag.deleteMany({
    where: { userId: session.user.id, source: 'spotify' },
  });

  return NextResponse.json({ success: true });
}


