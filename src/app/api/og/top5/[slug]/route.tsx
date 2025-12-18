/**
 * Route API pour générer des images OG dynamiques pour les Top 5
 * Sprint V1: OG Image Generator
 * 
 * Pour l'instant, retourne l'image du premier événement avec un fallback
 * TODO: Utiliser @vercel/og pour générer une image avec le thème, la semaine, et les covers des top événements
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const post = await prisma.editorialPost.findUnique({
      where: { slug },
      include: {
        events: {
          take: 1,
          select: {
            imageUrl: true,
          },
        },
      },
    });

    // Pour l'instant, rediriger vers l'image du premier événement ou une image par défaut
    // TODO: Utiliser @vercel/og pour générer une image avec thème, semaine, covers
    if (post?.events[0]?.imageUrl) {
      return NextResponse.redirect(post.events[0].imageUrl);
    }

    // Fallback: rediriger vers une image par défaut
    const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-top5-default.png`;
    return NextResponse.redirect(defaultImage);
  } catch (error: any) {
    console.error('Erreur GET /api/og/top5/[slug]:', error);
    const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-top5-default.png`;
    return NextResponse.redirect(defaultImage);
  }
}

