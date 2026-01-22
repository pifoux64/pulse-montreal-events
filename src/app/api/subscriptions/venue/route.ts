/**
 * API Route pour gérer l'abonnement d'une salle
 * GET /api/subscriptions/venue?venueId=... - Récupère l'abonnement actuel
 * POST /api/subscriptions/venue - Crée ou met à jour l'abonnement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSubscriptionCheckoutSession, PRICING_PLANS } from '@/lib/stripe';

/**
 * GET /api/subscriptions/venue - Récupère l'abonnement actuel
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

    const searchParams = request.nextUrl.searchParams;
    const venueId = searchParams.get('venueId');

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de la salle
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        subscriptions: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    if (venue.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const subscription = venue.subscriptions[0] || null;

    return NextResponse.json({
      subscription,
      plan: subscription?.plan || 'VENUE_BASIC',
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
 * POST /api/subscriptions/venue - Crée ou met à jour l'abonnement
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
    const { planId, venueId } = body;

    if (!planId || !venueId) {
      return NextResponse.json(
        { error: 'planId et venueId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de la salle
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    if (venue.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Créer la session de checkout Stripe
    const plan = { ...PRICING_PLANS[planId as keyof typeof PRICING_PLANS], venueId };
    const checkoutSession = await createSubscriptionCheckoutSession({
      planId: planId as any,
      userId: session.user.id,
      userEmail: session.user.email || '',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/venue/dashboard?subscription=success&venueId=${venueId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/venue/dashboard?subscription=cancelled&venueId=${venueId}`,
    }, plan as any);

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
