import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Handler error', { status: 500 });
  }
}

/**
 * Gère la finalisation d'un paiement (promotion ou abonnement)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { type, eventId, organizerId, userId, planId, duration } = session.metadata || {};

  if (type === 'promotion' && eventId && organizerId && planId && duration) {
    // Créer une promotion dans la base de données
    console.log('Creating promotion:', {
      eventId,
      organizerId,
      planId,
      duration: parseInt(duration),
      priceCents: session.amount_total,
    });

    // TODO: Implémenter avec Prisma
    // await prisma.promotion.create({
    //   data: {
    //     eventId,
    //     kind: 'FEATURED',
    //     startsAt: new Date(),
    //     endsAt: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000),
    //     priceCents: session.amount_total || 0,
    //   },
    // });

    // Envoyer email de confirmation à l'organisateur
    // await sendPromotionConfirmationEmail(organizerId, eventId, planId);
  }

  if (type === 'subscription' && userId && planId) {
    // Déterminer le type d'abonnement et le plan
    const isOrganizer = planId.includes('organizer');
    const isVenue = planId.includes('venue');
    
    let plan: 'ORGANIZER_PRO' | 'VENUE_PRO' | 'ORGANIZER_BASIC' | 'VENUE_BASIC';
    if (isOrganizer) {
      plan = planId.includes('pro') ? 'ORGANIZER_PRO' : 'ORGANIZER_BASIC';
    } else if (isVenue) {
      plan = planId.includes('pro') ? 'VENUE_PRO' : 'VENUE_BASIC';
    } else {
      console.error('Plan non reconnu:', planId);
      return;
    }

    if (isOrganizer) {
      // Récupérer l'organisateur
      const organizer = await prisma.organizer.findUnique({
        where: { userId },
      });

      if (!organizer) {
        console.error('Organisateur non trouvé pour userId:', userId);
        return;
      }

      // Désactiver les anciens abonnements
      await prisma.subscription.updateMany({
        where: {
          organizerId: organizer.id,
          active: true,
        },
        data: { active: false },
      });

      // Créer le nouvel abonnement
      await prisma.subscription.create({
        data: {
          organizerId: organizer.id,
          plan,
          billingMonthly: (session.amount_total || 0),
          active: true,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
        },
      });
    } else if (isVenue) {
      // Pour les salles, on a besoin du venueId dans les metadata
      const venueId = session.metadata?.venueId;
      if (!venueId) {
        console.error('venueId manquant dans les metadata');
        return;
      }

      // Vérifier que l'utilisateur est propriétaire
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue || venue.ownerUserId !== userId) {
        console.error('Salle non trouvée ou non autorisée');
        return;
      }

      // Désactiver les anciens abonnements
      await prisma.subscription.updateMany({
        where: {
          venueId: venue.id,
          active: true,
        },
        data: { active: false },
      });

      // Créer le nouvel abonnement
      await prisma.subscription.create({
        data: {
          venueId: venue.id,
          plan,
          billingMonthly: (session.amount_total || 0),
          active: true,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
        },
      });
    }
  }
}

/**
 * Gère la création d'un nouvel abonnement
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;

  if (!userId || !planId) {
    console.error('Metadata manquantes dans la subscription:', subscription.id);
    return;
  }

  const isOrganizer = planId.includes('organizer');
  const isVenue = planId.includes('venue');

  let plan: 'ORGANIZER_PRO' | 'VENUE_PRO' | 'ORGANIZER_BASIC' | 'VENUE_BASIC';
  if (isOrganizer) {
    plan = planId.includes('pro') ? 'ORGANIZER_PRO' : 'ORGANIZER_BASIC';
  } else if (isVenue) {
    plan = planId.includes('pro') ? 'VENUE_PRO' : 'VENUE_BASIC';
  } else {
    return;
  }

  if (isOrganizer) {
    const organizer = await prisma.organizer.findUnique({
      where: { userId },
    });

    if (organizer) {
      await prisma.subscription.updateMany({
        where: {
          organizerId: organizer.id,
          stripeSubscriptionId: subscription.id,
        },
        data: {
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  } else if (isVenue) {
    const venueId = subscription.metadata?.venueId;
    if (venueId) {
      await prisma.subscription.updateMany({
        where: {
          venueId,
          stripeSubscriptionId: subscription.id,
        },
        data: {
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }
}
  const { userId, planId } = subscription.metadata || {};

  if (userId && planId) {
    console.log('Subscription created:', {
      userId,
      planId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    // TODO: Mettre à jour la base de données
    // await prisma.subscription.upsert({
    //   where: { userId },
    //   create: {
    //     userId,
    //     plan: planId === 'pro_monthly' ? 'PRO' : 'BASIC',
    //     active: subscription.status === 'active',
    //     stripeSubscriptionId: subscription.id,
    //   },
    //   update: {
    //     active: subscription.status === 'active',
    //     stripeSubscriptionId: subscription.id,
    //   },
    // });
  }
}

/**
 * Gère la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      active: subscription.status === 'active',
    },
  });
}
  const { userId } = subscription.metadata || {};

  if (userId) {
    console.log('Subscription updated:', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    // TODO: Mettre à jour le statut de l'abonnement
    // await prisma.subscription.updateMany({
    //   where: { stripeSubscriptionId: subscription.id },
    //   data: {
    //     active: subscription.status === 'active',
    //   },
    // });

    // Si l'abonnement est annulé, envoyer un email
    if (subscription.status === 'canceled') {
      // await sendSubscriptionCancelledEmail(userId);
    }
  }
}

/**
 * Gère la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      active: false,
    },
  });
}
  const { userId } = subscription.metadata || {};

  if (userId) {
    console.log('Subscription deleted:', {
      userId,
      subscriptionId: subscription.id,
    });

    // TODO: Désactiver l'abonnement
    // await prisma.subscription.updateMany({
    //   where: { stripeSubscriptionId: subscription.id },
    //   data: { active: false },
    // });
  }
}

/**
 * Gère les paiements réussis (renouvellements)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    console.log('Payment succeeded for subscription:', invoice.subscription);
    
    // TODO: Enregistrer le paiement et prolonger l'abonnement
    // const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    // await prisma.subscription.updateMany({
    //   where: { stripeSubscriptionId: subscription.id },
    //   data: { 
    //     active: true,
    //     lastPaymentAt: new Date(),
    //   },
    // });
  }
}

/**
 * Gère les échecs de paiement
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    console.log('Payment failed for subscription:', invoice.subscription);
    
    // TODO: Notifier l'utilisateur et gérer la suspension
    // const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    // const { userId } = subscription.metadata || {};
    
    // if (userId) {
    //   await sendPaymentFailedEmail(userId);
    // }
  }
}
