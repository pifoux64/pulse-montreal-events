/**
 * API Admin: Pulse Picks
 * SPRINT 3: Pulse Picks (Top 5)
 *
 * GET  /api/editorial/pulse-picks      -> liste les posts éditoriaux
 * POST /api/editorial/pulse-picks      -> génère/maj un Pulse Picks pour un thème/période (DRAFT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertPulsePicksPost, PulsePicksTheme } from '@/lib/editorial/pulsePicksEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const theme = (searchParams.get('theme') as PulsePicksTheme | null) || null;

    const posts = await prisma.editorialPost.findMany({
      where: theme ? { theme } : {},
      orderBy: {
        periodStart: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Erreur GET /api/editorial/pulse-picks:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des Pulse Picks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { theme, periodStart, periodEnd, limit } = body;

    if (!theme || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'theme, periodStart et periodEnd sont requis' },
        { status: 400 }
      );
    }

    const themeValue = theme as PulsePicksTheme;

    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);

    const { post, candidates } = await upsertPulsePicksPost({
      theme: themeValue,
      periodStart: periodStartDate,
      periodEnd: periodEndDate,
      limit: limit ?? 5,
      authorId: session.user.id,
    });

    return NextResponse.json({ post, candidates });
  } catch (error: any) {
    console.error('Erreur POST /api/editorial/pulse-picks:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des Pulse Picks' },
      { status: 500 }
    );
  }
}
