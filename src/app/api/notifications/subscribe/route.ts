import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().optional().nullable(),
    p256dh: z.string().optional().nullable(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const body = await request.json();
    const subscription = subscriptionSchema.parse(body);

    await prisma.notificationSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
        },
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        authKey: subscription.keys.auth,
        p256dhKey: subscription.keys.p256dh,
      },
      update: {
        authKey: subscription.keys.auth,
        p256dhKey: subscription.keys.p256dh,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications][Subscribe] Erreur:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Impossible d’enregistrer la souscription.' }, { status: 500 });
  }
}

