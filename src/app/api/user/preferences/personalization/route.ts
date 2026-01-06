/**
 * API pour gérer la préférence de personnalisation
 * 
 * GET /api/user/preferences/personalization -> Récupère l'état
 * PATCH /api/user/preferences/personalization -> Active/désactive la personnalisation
 * Body: { enabled: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { personalizationEnabled: true },
    });

    return NextResponse.json({
      enabled: prefs?.personalizationEnabled ?? true,
    });
  } catch (error: any) {
    console.error('[Personalization Prefs] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const enabled = body.enabled === true;

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        personalizationEnabled: enabled,
      },
      update: {
        personalizationEnabled: enabled,
      },
    });

    return NextResponse.json({
      success: true,
      enabled,
    });
  } catch (error: any) {
    console.error('[Personalization Prefs] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

