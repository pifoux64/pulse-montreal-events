/**
 * API Routes pour une promotion spécifique
 * GET /api/promotions/[id] - Récupère une promotion
 * PATCH /api/promotions/[id] - Met à jour une promotion (admin uniquement)
 * DELETE /api/promotions/[id] - Supprime une promotion (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PromotionKind, PromotionStatus, UserRole } from '@prisma/client';

const UpdatePromotionSchema = z.object({
  kind: z.nativeEnum(PromotionKind).optional(),
  status: z.nativeEnum(PromotionStatus).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  priceCents: z.number().int().min(0).optional(),
});

/**
 * GET /api/promotions/[id] - Récupère une promotion
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
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

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(promotion);

  } catch (error) {
    console.error('Erreur lors de la récupération de la promotion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de la promotion' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/promotions/[id] - Met à jour une promotion (admin uniquement)
 */
export async function PATCH(
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

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = UpdatePromotionSchema.parse(body);

    const updateData: any = {};
    if (data.kind !== undefined) updateData.kind = data.kind;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
    if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
    if (data.priceCents !== undefined) updateData.priceCents = data.priceCents;

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(promotion);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la promotion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la promotion' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/promotions/[id] - Supprime une promotion (admin uniquement)
 */
export async function DELETE(
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

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    await prisma.promotion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Promotion supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de la promotion' },
      { status: 500 }
    );
  }
}

