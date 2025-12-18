/**
 * API: Tracking des interactions utilisateur
 * POST /api/user/interactions
 * SPRINT 2: Personalization & Recommendations
 * 
 * Permet au frontend d'enregistrer des interactions (CLICK, SHARE, DISMISS)
 * FAVORITE est géré par /api/favorites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trackInteraction } from '@/lib/recommendations/interactionTracker';
import { UserEventInteractionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, type } = body;

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId est requis' }, { status: 400 });
    }

    const validTypes: UserEventInteractionType[] = ['CLICK', 'SHARE', 'DISMISS'];
    if (!type || !validTypes.includes(type as UserEventInteractionType)) {
      return NextResponse.json(
        { error: `type doit être l'un de: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    await trackInteraction(session.user.id, eventId, type as UserEventInteractionType);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur /api/user/interactions:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de l\'enregistrement de l\'interaction',
      },
      { status: 500 }
    );
  }
}



