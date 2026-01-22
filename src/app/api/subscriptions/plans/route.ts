/**
 * API Route pour récupérer les plans d'abonnement disponibles
 * GET /api/subscriptions/plans - Liste des plans selon le type (organizer ou venue)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PRICING_PLANS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'organizer' ou 'venue'

    const plans = Object.values(PRICING_PLANS).filter((plan) => {
      if (plan.type !== 'subscription') return false;
      if (type === 'organizer') {
        return plan.id.includes('organizer');
      }
      if (type === 'venue') {
        return plan.id.includes('venue');
      }
      return true;
    });

    return NextResponse.json({ plans });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des plans:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
