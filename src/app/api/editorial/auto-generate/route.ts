/**
 * API Route pour générer automatiquement les pages éditoriales
 * POST /api/editorial/auto-generate - Génère les Top 5 pour la semaine/week-end
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upsertPulsePicksPost } from '@/lib/editorial/pulsePicksEngine';
import { prisma } from '@/lib/prisma';
import { MONTREAL_TIMEZONE } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier que l'utilisateur est admin (pour sécurité)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé (admin requis)' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { themes, period } = body;

    // Thèmes par défaut si non fournis
    const defaultThemes = ['rock', 'famille', 'gratuit', 'hip_hop', 'techno'];
    const themesToGenerate = themes || defaultThemes;
    const periodType = period || 'week'; // 'week' ou 'weekend'

    const now = new Date();
    const montrealDate = new Date(now.toLocaleString('en-US', { timeZone: MONTREAL_TIMEZONE }));

    let periodStart: Date;
    let periodEnd: Date;

    if (periodType === 'weekend') {
      // Weekend (samedi et dimanche)
      const dayOfWeek = montrealDate.getDay();
      if (dayOfWeek === 0) {
        // Dimanche : prendre samedi et dimanche
        periodStart = new Date(montrealDate);
        periodStart.setDate(montrealDate.getDate() - 1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(montrealDate);
        periodEnd.setHours(23, 59, 59, 999);
      } else if (dayOfWeek === 6) {
        // Samedi : prendre samedi et dimanche
        periodStart = new Date(montrealDate);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(montrealDate);
        periodEnd.setDate(montrealDate.getDate() + 1);
        periodEnd.setHours(23, 59, 59, 999);
      } else {
        // Autre jour : prendre le prochain weekend
        const daysUntilSaturday = 6 - dayOfWeek;
        periodStart = new Date(montrealDate);
        periodStart.setDate(montrealDate.getDate() + daysUntilSaturday);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 1);
        periodEnd.setHours(23, 59, 59, 999);
      }
    } else {
      // Semaine (lundi à dimanche)
      const dayOfWeek = montrealDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      periodStart = new Date(montrealDate);
      periodStart.setDate(montrealDate.getDate() + diff);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    }

    const results = [];

    for (const theme of themesToGenerate) {
      try {
        const result = await upsertPulsePicksPost({
          theme: theme as any,
          periodStart,
          periodEnd,
          limit: 5,
          authorId: session.user.id,
        });

        // Publier automatiquement
        const publishedPost = await prisma.editorialPost.update({
          where: { id: result.post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        results.push({
          theme,
          slug: publishedPost.slug,
          eventsCount: result.candidates.length,
          success: true,
        });
      } catch (error: any) {
        console.error(`Erreur pour "${theme}":`, error);
        results.push({
          theme,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      period: {
        start: periodStart,
        end: periodEnd,
        type: periodType,
      },
      results,
    });

  } catch (error: any) {
    console.error('Erreur lors de la génération automatique:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
