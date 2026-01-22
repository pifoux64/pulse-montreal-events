import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

const assertStripe = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in the environment.');
  }
  return stripe;
};

// Plans de monétisation selon le prompt
export const PRICING_PLANS = {
  // Mise en avant d'événements
  FEATURED_7_DAYS: {
    id: 'featured_7_days',
    name: 'Mise en avant 7 jours',
    description: 'Votre événement apparaît en tête de liste pendant 7 jours',
    price: 1999, // 19.99 CAD en cents
    currency: 'cad',
    duration: 7,
    type: 'promotion' as const,
  },
  FEATURED_14_DAYS: {
    id: 'featured_14_days', 
    name: 'Mise en avant 14 jours',
    description: 'Votre événement apparaît en tête de liste pendant 14 jours',
    price: 3499, // 34.99 CAD en cents
    currency: 'cad',
    duration: 14,
    type: 'promotion' as const,
  },
  FEATURED_30_DAYS: {
    id: 'featured_30_days',
    name: 'Mise en avant 30 jours',
    description: 'Votre événement apparaît en tête de liste pendant 30 jours',
    price: 5999, // 59.99 CAD en cents
    currency: 'cad',
    duration: 30,
    type: 'promotion' as const,
  },
  
  // Abonnements organisateur
  ORGANIZER_PRO_MONTHLY: {
    id: 'organizer_pro_monthly',
    name: 'Organisateur Pro',
    description: 'Événements illimités + statistiques avancées + notifications ciblées + mises en avant',
    price: 2999, // 29.99 CAD en cents
    currency: 'cad',
    interval: 'month',
    type: 'subscription' as const,
    plan: 'ORGANIZER_PRO' as const,
    features: [
      'Événements illimités',
      'Statistiques avancées',
      'Notifications ciblées',
      'Mises en avant automatiques',
      'Support prioritaire',
    ],
  },
  
  // Abonnements salle
  VENUE_PRO_MONTHLY: {
    id: 'venue_pro_monthly',
    name: 'Salle Pro',
    description: 'Demandes de réservation illimitées + visibilité premium + statistiques détaillées',
    price: 3999, // 39.99 CAD en cents
    currency: 'cad',
    interval: 'month',
    type: 'subscription' as const,
    plan: 'VENUE_PRO' as const,
    features: [
      'Demandes de réservation illimitées',
      'Visibilité premium',
      'Statistiques détaillées',
      'Badge salle vérifiée',
      'Support prioritaire',
    ],
  },
  
  // Premium utilisateur
  PREMIUM_USER: {
    id: 'premium_user',
    name: 'Premium Utilisateur',
    description: 'Alertes avancées + synchronisation calendrier + sans publicité',
    price: 299, // 2.99 CAD en cents
    currency: 'cad',
    interval: 'month',
    type: 'subscription' as const,
    features: [
      'Alertes personnalisées avancées',
      'Synchronisation Google Calendar',
      'Interface sans publicité',
      'Accès anticipé aux nouveautés',
      'Export favoris illimité',
    ],
  },
} as const;

// Types pour TypeScript
export type PricingPlanId = keyof typeof PRICING_PLANS;
export type PricingPlan = typeof PRICING_PLANS[PricingPlanId];

/**
 * Crée une session de paiement Stripe pour une promotion d'événement
 */
export async function createPromotionCheckoutSession({
  eventId,
  planId,
  organizerId,
  successUrl,
  cancelUrl,
}: {
  eventId: string;
  planId: PricingPlanId;
  organizerId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PRICING_PLANS[planId];
  
  if (plan.type !== 'promotion') {
    throw new Error('Invalid plan type for promotion');
  }

  const client = assertStripe();

  const session = await client.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: `${plan.description} - Événement #${eventId}`,
            metadata: {
              type: 'event_promotion',
              eventId,
              organizerId,
              duration: plan.duration.toString(),
            },
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'promotion',
      eventId,
      organizerId,
      planId,
      duration: plan.duration.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
  });

  return session;
}

/**
 * Crée une session de paiement pour un abonnement
 */
export async function createSubscriptionCheckoutSession({
  planId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  planId: PricingPlanId;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}, extraPlanData?: any) {
  const plan = PRICING_PLANS[planId];
  
  if (plan.type !== 'subscription') {
    throw new Error('Invalid plan type for subscription');
  }

  const client = assertStripe();

  // Créer ou récupérer le client Stripe
  let customer;
  const existingCustomers = await client.customers.list({
    email: userEmail,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await client.customers.create({
      email: userEmail,
      metadata: {
        userId,
      },
    });
  }

  // Créer le produit et prix récurrents
  const product = await client.products.create({
    name: plan.name,
    description: plan.description,
    metadata: {
      type: plan.type,
      planId,
      features: plan.features.join('|'),
    },
  });

  const price = await client.prices.create({
    product: product.id,
    unit_amount: plan.price,
    currency: plan.currency,
    recurring: {
      interval: plan.interval as 'month' | 'year',
    },
  });

  const session = await client.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customer.id,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      type: 'subscription',
      userId,
      planId,
      ...(extraPlanData?.venueId && { venueId: extraPlanData.venueId }),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
  });

  return session;
}

/**
 * Crée un portail client pour gérer l'abonnement
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const client = assertStripe();
  const session = await client.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Vérifie le statut d'un abonnement
 */
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const client = assertStripe();
    const subscription = await client.subscriptions.retrieve(subscriptionId);
    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: subscription.items.data[0]?.price?.metadata,
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Annule un abonnement
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const client = assertStripe();
    const subscription = await client.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Formate un prix pour l'affichage
 */
export function formatPrice(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Calcule le prix avec taxes (TPS + TVQ pour le Québec)
 */
export function calculatePriceWithTaxes(amount: number): {
  subtotal: number;
  gst: number; // TPS 5%
  qst: number; // TVQ 9.975%
  total: number;
} {
  const gst = Math.round(amount * 0.05);
  const qst = Math.round(amount * 0.09975);
  const total = amount + gst + qst;

  return {
    subtotal: amount,
    gst,
    qst,
    total,
  };
}
