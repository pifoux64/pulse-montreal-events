/**
 * API pour gérer la préférence de langue
 * 
 * PATCH /api/user/preferences/language -> Met à jour la langue préférée
 * Body: { language: 'fr' | 'en' | 'es' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { locales, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const language = body.language as Locale;

    // Valider la langue
    if (!language || !locales.includes(language)) {
      return NextResponse.json(
        { error: `Langue invalide. Doit être l'une de: ${locales.join(', ')}` },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer UserPreferences avec la langue
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        language,
      },
      update: {
        language,
      },
    });

    return NextResponse.json({
      success: true,
      language,
    });
  } catch (error: any) {
    console.error('[Language Prefs] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

