import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createPromotionCheckoutSession, 
  createSubscriptionCheckoutSession,
  PRICING_PLANS,
  type PricingPlanId 
} from '@/lib/stripe';
import { z } from 'zod';

// Schéma de validation pour la requête
const createCheckoutSchema = z.object({
  planId: z.string(),
  type: z.enum(['promotion', 'subscription']),
  eventId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Valider les données de la requête
    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);
    
    const { planId, type, eventId, successUrl, cancelUrl } = validatedData;

    // Vérifier que le plan existe
    if (!(planId in PRICING_PLANS)) {
      return new NextResponse('Invalid plan ID', { status: 400 });
    }

    const plan = PRICING_PLANS[planId as PricingPlanId];
    
    // Vérifier la cohérence du type
    if (plan.type !== type) {
      return new NextResponse('Plan type mismatch', { status: 400 });
    }

    let checkoutSession;

    if (type === 'promotion') {
      // Vérifier qu'un eventId est fourni pour les promotions
      if (!eventId) {
        return new NextResponse('Event ID required for promotions', { status: 400 });
      }

      // TODO: Vérifier que l'utilisateur est propriétaire de l'événement
      // const event = await prisma.event.findFirst({
      //   where: { id: eventId, organizerId: session.user.organizerId }
      // });
      // if (!event) {
      //   return new NextResponse('Event not found or unauthorized', { status: 404 });
      // }

      checkoutSession = await createPromotionCheckoutSession({
        eventId,
        planId: planId as PricingPlanId,
        organizerId: session.user.id, // Temporaire - utiliser organizerId réel
        successUrl,
        cancelUrl,
      });
    } else {
      // Abonnement utilisateur
      checkoutSession = await createSubscriptionCheckoutSession({
        planId: planId as PricingPlanId,
        userId: session.user.id,
        userEmail: session.user.email,
        successUrl,
        cancelUrl,
      });
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request data', details: error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
