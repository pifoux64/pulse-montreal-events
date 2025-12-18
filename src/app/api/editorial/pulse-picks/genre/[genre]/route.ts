/**
 * API: Récupère le Top 5 publié pour un genre spécifique
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { genre: string } }
) {
  try {
    const { genre } = params;

    // Chercher le Top 5 publié le plus récent pour ce genre
    const post = await prisma.editorialPost.findFirst({
      where: {
        status: 'PUBLISHED',
        theme: genre,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        events: {
          orderBy: {
            id: 'asc', // Utiliser l'ordre des eventsOrder
          },
          take: 5,
        },
      },
    });

    if (!post) {
      return NextResponse.json({ post: null });
    }

    // Enrichir avec le nombre d'événements
    const enrichedPost = {
      ...post,
      eventsCount: post.eventsOrder.length,
    };

    return NextResponse.json({ post: enrichedPost });
  } catch (error: any) {
    console.error('Erreur GET /api/editorial/pulse-picks/genre/[genre]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du Top 5' },
      { status: 500 }
    );
  }
}

