/**
 * API Routes pour les promotions
 * GET /api/promotions - Liste des promotions
 * POST /api/promotions - Créer une promotion (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PromotionKind, PromotionStatus, UserRole } from '@prisma/client';

const CreatePromotionSchema = z.object({
  eventId: z.string().uuid(),
  kind: z.nativeEnum(PromotionKind),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  priceCents: z.number().int().min(0),
  status: z.nativeEnum(PromotionStatus).default(PromotionStatus.DRAFT),
});

/**
 * GET /api/promotions - Liste des promotions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const kind = searchParams.get('kind');
    const eventId = searchParams.get('eventId');

    const where: any = {};
    if (status) {
      where.status = status as PromotionStatus;
    }
    if (kind) {
      where.kind = kind as PromotionKind;
    }
    if (eventId) {
      where.eventId = eventId;
    }

    // Si non-admin, ne montrer que les promotions actives
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      where.status = PromotionStatus.ACTIVE;
      const now = new Date();
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
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
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startsAt: 'desc' },
      ],
    });

    return NextResponse.json({ items: promotions, total: promotions.length });

  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des promotions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions - Créer une promotion (admin uniquement)
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

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = CreatePromotionSchema.parse(body);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Créer la promotion
    const promotion = await prisma.promotion.create({
      data: {
        eventId: data.eventId,
        kind: data.kind,
        status: data.status,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        priceCents: data.priceCents,
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
