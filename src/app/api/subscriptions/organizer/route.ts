/**
 * API Route pour gérer l'abonnement d'un organisateur
 * GET /api/subscriptions/organizer - Récupère l'abonnement actuel
 * POST /api/subscriptions/organizer - Crée ou met à jour l'abonnement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSubscriptionCheckoutSession } from '@/lib/stripe';

/**
 * GET /api/subscriptions/organizer - Récupère l'abonnement actuel
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    const subscription = organizer.subscriptions[0] || null;

    return NextResponse.json({
      subscription,
      plan: subscription?.plan || 'ORGANIZER_BASIC',
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions/organizer - Crée ou met à jour l'abonnement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId requis' },
        { status: 400 }
      );
    }

    // Récupérer l'organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Créer la session de checkout Stripe
    const checkoutSession = await createSubscriptionCheckoutSession({
      planId: planId as any,
      userId: session.user.id,
      userEmail: session.user.email || '',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/organisateur/dashboard?subscription=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/organisateur/dashboard?subscription=cancelled`,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'abonnement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
