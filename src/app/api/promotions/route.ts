/**
 * API Routes pour les promotions - Pulse Montreal
 * GET /api/promotions - Liste des promotions actives
 * POST /api/promotions - Créer une promotion (organisateurs/admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PromotionKind, UserRole } from '@prisma/client';

const CreatePromotionSchema = z.object({
  eventId: z.string().uuid(),
  kind: z.nativeEnum(PromotionKind),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  priceCents: z.number().int().min(0),
});

/**
 * GET /api/promotions - Récupère les promotions actives
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind') as PromotionKind | null;
    
    const where: any = {
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    };

    if (kind) {
      where.kind = kind;
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        event: {
          include: {
            venue: true,
            organizer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: [
        { kind: 'asc' }, // FEATURED en premier
        { startsAt: 'desc' },
      ],
    });

    return NextResponse.json(promotions);

  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des promotions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions - Créer une nouvelle promotion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const promotionData = CreatePromotionSchema.parse(body);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: promotionData.eventId },
      include: {
        organizer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const isOwner = event.organizer?.user.id === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Vérifier les collisions de dates pour le même type de promotion
    const existingPromotion = await prisma.promotion.findFirst({
      where: {
        eventId: promotionData.eventId,
        kind: promotionData.kind,
        OR: [
          {
            startsAt: {
              lte: new Date(promotionData.endsAt),
            },
            endsAt: {
              gte: new Date(promotionData.startsAt),
            },
          },
        ],
      },
    });

    if (existingPromotion) {
      return NextResponse.json(
        { error: 'Une promotion du même type existe déjà pour cette période' },
        { status: 409 }
      );
    }

    // Créer la promotion
    const promotion = await prisma.promotion.create({
      data: {
        eventId: promotionData.eventId,
        kind: promotionData.kind,
        startsAt: new Date(promotionData.startsAt),
        endsAt: new Date(promotionData.endsAt),
        priceCents: promotionData.priceCents,
      },
      include: {
        event: {
          include: {
            venue: true,
            organizer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(promotion, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la promotion' },
      { status: 500 }
    );
  }
}
