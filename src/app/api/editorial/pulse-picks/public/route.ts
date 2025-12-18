/**
 * API Publique: Pulse Picks (Top 5)
 * Récupère les Top 5 publiés pour affichage public
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme');
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    const posts = await prisma.editorialPost.findMany({
      where: {
        status: 'PUBLISHED',
        ...(theme && { theme }),
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: limit,
      include: {
        _count: {
          select: {
            // Pas de relation directe, mais on peut compter les eventsOrder
          },
        },
      },
    });

    // Enrichir avec le nombre d'événements
    const enrichedPosts = posts.map((post) => ({
      ...post,
      eventsCount: post.eventsOrder.length,
    }));

    return NextResponse.json({ posts: enrichedPosts });
  } catch (error: any) {
    console.error('Erreur GET /api/editorial/pulse-picks/public:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des Pulse Picks' },
      { status: 500 }
    );
  }
}

