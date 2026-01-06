import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('[User Preferences] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur lors de la récupération: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

