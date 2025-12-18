/**
 * Route API pour générer des images OG dynamiques pour les événements
 * Sprint V1: OG Image Generator
 * 
 * Pour l'instant, retourne l'image de l'événement avec un fallback
 * TODO: Utiliser @vercel/og pour générer des images avec texte superposé
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        imageUrl: true,
        title: true,
      },
    });

    // Pour l'instant, rediriger vers l'image de l'événement ou une image par défaut
    // TODO: Utiliser @vercel/og pour générer une image avec titre, date, lieu superposés
    if (event?.imageUrl) {
      // Rediriger vers l'image de l'événement
      return NextResponse.redirect(event.imageUrl);
    }

    // Fallback: rediriger vers une image par défaut
    const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-event-default.png`;
    return NextResponse.redirect(defaultImage);
  } catch (error: any) {
    console.error('Erreur GET /api/og/event/[id]:', error);
    const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/og-event-default.png`;
    return NextResponse.redirect(defaultImage);
  }
}

