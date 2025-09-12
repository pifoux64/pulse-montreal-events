import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
    // Mettre à jour l'abonnement utilisateur
    console.log('Creating/updating subscription:', {
      userId,
      planId,
      subscriptionId: session.subscription,
    });

    // TODO: Implémenter avec Prisma
    // await prisma.subscription.upsert({
    //   where: { userId },
    //   create: {
    //     userId,
    //     plan: planId === 'pro_monthly' ? 'PRO' : 'BASIC',
    //     billingMonthly: (session.amount_total || 0) / 100,
    //     active: true,
    //     stripeSubscriptionId: session.subscription as string,
    //   },
    //   update: {
    //     plan: planId === 'pro_monthly' ? 'PRO' : 'BASIC',
    //     billingMonthly: (session.amount_total || 0) / 100,
    //     active: true,
    //     stripeSubscriptionId: session.subscription as string,
    //   },
    // });

    // Envoyer email de bienvenue
    // await sendSubscriptionWelcomeEmail(userId, planId);
  }
}

/**
 * Gère la création d'un nouvel abonnement
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
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
