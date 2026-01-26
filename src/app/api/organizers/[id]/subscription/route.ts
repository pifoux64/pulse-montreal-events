/**
 * API Route pour l'abonnement d'un organisateur
 * GET /api/organizers/[id]/subscription - Récupère l'abonnement
 * POST /api/organizers/[id]/subscription - Crée ou met à jour l'abonnement (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SubscriptionPlan, UserRole } from '@prisma/client';

const UpdateSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  billingMonthly: z.number().int().min(0),
  active: z.boolean().optional(),
});

/**
 * GET /api/organizers/[id]/subscription - Récupère l'abonnement de l'organisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier que l'utilisateur est authentifié
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const organizer = await prisma.organizer.findUnique({
      where: { id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    const isOwner = session.user.id === organizer.userId;
    const isAdmin = session.user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer l'abonnement actif
    const subscription = await prisma.subscription.findFirst({
      where: {
        organizerId: id,
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Si pas d'abonnement, retourner BASIC par défaut
    if (!subscription) {
      return NextResponse.json({
        plan: SubscriptionPlan.BASIC,
        billingMonthly: 0,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'abonnement' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizers/[id]/subscription - Crée ou met à jour l'abonnement (admin uniquement)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const organizer = await prisma.organizer.findUnique({
      where: { id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = UpdateSubscriptionSchema.parse(body);

    // Désactiver les autres abonnements actifs
    await prisma.subscription.updateMany({
      where: {
        organizerId: id,
        active: true,
      },
      data: {
        active: false,
      },
    });

    // Vérifier s'il existe déjà un abonnement pour ce plan
    const existing = await prisma.subscription.findFirst({
      where: {
        organizerId: id,
        plan: data.plan,
      },
    });

    // Créer ou mettre à jour l'abonnement
    const subscription = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: data.plan,
            billingMonthly: data.billingMonthly,
            active: data.active !== undefined ? data.active : true,
          },
        })
      : await prisma.subscription.create({
          data: {
            organizerId: id,
            plan: data.plan,
            billingMonthly: data.billingMonthly,
            active: data.active !== undefined ? data.active : true,
          },
        });

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'abonnement' },
      { status: 500 }
    );
  }
}

