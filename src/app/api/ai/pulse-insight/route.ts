/**
 * API Route pour générer les insights Pulse (résumé IA d'un événement)
 * POST /api/ai/pulse-insight - Génère un résumé immersif (et le sauvegarde en BD si l'événement existe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePulseInsight } from '@/lib/ai/generatePulseInsight';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      title,
      description,
      category,
      tags = [],
      eventTags = [],
      venue,
      organizer,
      lineup = [],
      locale = 'fr',
    } = body;

    if (!eventId || !title) {
      return NextResponse.json(
        { error: 'eventId et title requis' },
        { status: 400 }
      );
    }

    const insight = await generatePulseInsight(
      eventId,
      {
        title,
        description,
        category,
        tags,
        eventTags,
        venue ? { name: venue.name, neighborhood: venue.neighborhood } : null,
        organizer ? { displayName: organizer.displayName } : null,
        lineup,
      },
      {
        locale: locale as 'fr' | 'en' | 'es',
        cacheKey: `pulse-insight:${eventId}:${locale}`,
        cacheTTL: 86400,
      }
    );

    // Sauvegarder en BD pour les prochains chargements (backfill événements existants sans insight)
    try {
      await prisma.event.update({
        where: { id: eventId },
        data: { pulseInsight: insight as object },
      });
    } catch (updateErr) {
      console.warn('[pulse-insight] Impossible de sauvegarder l\'insight en BD:', updateErr);
    }

    return NextResponse.json(insight);
  } catch (error: any) {
    console.error('Erreur génération Pulse Insight:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de l\'insight' },
      { status: 500 }
    );
  }
}
