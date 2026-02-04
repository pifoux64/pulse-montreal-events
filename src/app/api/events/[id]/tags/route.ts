/**
 * API Routes pour gérer les tags d'un événement spécifique
 * PUT /api/events/[id]/tags - Mettre à jour les tags structurés (EventTag) d'un événement
 * POST /api/events/[id]/tags/reclassify - Reclassifier un événement avec l'IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { enrichEventWithTags } from '@/lib/tagging/eventTaggingService';
import { TagCategory, filterToAllowedTags } from '@/lib/tagging/taxonomy';

// Schéma de validation pour les tags
const UpdateEventTagsSchema = z.object({
  tags: z.array(
    z.object({
      category: z.enum(['type', 'genre', 'ambiance', 'public', 'style']),
      value: z.string(),
    })
  ),
});

/**
 * PUT /api/events/[id]/tags - Mettre à jour manuellement les tags d'un événement
 * Réservé aux admins
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent modifier les tags manuellement
    requireRole([UserRole.ADMIN])(session.user.role);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tags } = UpdateEventTagsSchema.parse(body);

    // Filtrer les tags pour ne garder que ceux valides dans la taxonomie
    const filteredTags = filterToAllowedTags({
      type: tags.find((t) => t.category === 'type')?.value || null,
      genres: tags.filter((t) => t.category === 'genre').map((t) => t.value),
      styles: tags.filter((t) => t.category === 'style').map((t) => t.value),
      ambiance: tags.filter((t) => t.category === 'ambiance').map((t) => t.value),
      public: tags.filter((t) => t.category === 'public').map((t) => t.value),
    });

    // Préparer les EventTag à créer
    const tagsToCreate: Array<{ eventId: string; category: TagCategory; value: string }> = [];

    if (filteredTags.type) {
      tagsToCreate.push({
        eventId: params.id,
        category: 'type',
        value: filteredTags.type,
      });
    }

    for (const genre of filteredTags.genres) {
      tagsToCreate.push({
        eventId: params.id,
        category: 'genre',
        value: genre,
      });
    }

    for (const style of filteredTags.styles || []) {
      tagsToCreate.push({
        eventId: params.id,
        category: 'style',
        value: style,
      });
    }

    for (const ambiance of filteredTags.ambiance) {
      tagsToCreate.push({
        eventId: params.id,
        category: 'ambiance',
        value: ambiance,
      });
    }

    for (const publicTag of filteredTags.public) {
      tagsToCreate.push({
        eventId: params.id,
        category: 'public',
        value: publicTag,
      });
    }

    // Transaction : remplacer tous les tags existants
    await prisma.$transaction([
      prisma.eventTag.deleteMany({ where: { eventId: params.id } }),
      tagsToCreate.length > 0
        ? prisma.eventTag.createMany({
            data: tagsToCreate,
            skipDuplicates: true,
          })
        : prisma.eventTag.createMany({ data: [] }), // no-op
    ]);

    // Récupérer l'événement avec ses nouveaux tags
    const updatedEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        eventTags: true,
      },
    });

    return NextResponse.json({
      message: 'Tags mis à jour avec succès',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tags:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour des tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/tags/reclassify - Reclassifier un événement avec l'IA
 * Réservé aux admins
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent reclassifier
    requireRole([UserRole.ADMIN])(session.user.role);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Reclassifier avec l'IA
    await enrichEventWithTags(params.id);

    // Récupérer l'événement avec ses nouveaux tags
    const updatedEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        eventTags: true,
      },
    });

    return NextResponse.json({
      message: 'Événement reclassifié avec succès',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Erreur lors de la reclassification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la reclassification' },
      { status: 500 }
    );
  }
}

