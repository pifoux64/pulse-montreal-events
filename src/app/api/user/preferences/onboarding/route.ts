import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      musicPreferences = [],
      categoryPreferences = [],
      vibePreferences = [],
      preferredDays = [],
      preferredTimes = [],
      preferredNeighborhoods = [],
      onboardingCompleted = false,
    } = body;

    // Upsert UserPreferences
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        musicPreferences,
        categoryPreferences,
        vibePreferences,
        preferredDays,
        preferredTimes,
        favoriteNeighborhoods: preferredNeighborhoods, // Utiliser favoriteNeighborhoods existant
        onboardingCompleted,
      },
      update: {
        musicPreferences,
        categoryPreferences,
        vibePreferences,
        preferredDays,
        preferredTimes,
        favoriteNeighborhoods: preferredNeighborhoods,
        onboardingCompleted,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Onboarding] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

