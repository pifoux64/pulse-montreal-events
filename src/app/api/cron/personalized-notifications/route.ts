/**
 * CRON job pour les notifications personnalisées basées sur les goûts musicaux
 * S'exécute toutes les heures pour vérifier les nouveaux événements
 * et envoyer des notifications aux utilisateurs concernés
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAndSendGenreNotifications } from '@/lib/notifications/personalizedNotifications';
import { sendEventPostPushNotifications } from '@/lib/notifications/push';

/**
 * POST /api/cron/personalized-notifications
 * Vérifie les nouveaux événements créés dans la dernière heure
 * et envoie des notifications aux utilisateurs concernés
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      console.warn('[CRON] Tentative d\'accès non autorisé au CRON de notifications personnalisées');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('[CRON] Début de la vérification des notifications personnalisées');

    // Calculer la date d'il y a 1 heure
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Récupérer les nouveaux événements créés dans la dernière heure
    const newEvents = await prisma.event.findMany({
      where: {
        status: 'SCHEDULED',
        createdAt: {
          gte: oneHourAgo,
        },
      },
      select: {
        id: true,
      },
    });

    if (newEvents.length === 0) {
      console.log('[CRON] Aucun nouvel événement dans la dernière heure');
      return NextResponse.json({
        success: true,
        eventsChecked: 0,
        notificationsSent: 0,
        errors: 0,
      });
    }

    console.log(`[CRON] ${newEvents.length} nouvel(le)(s) événement(s) à vérifier`);

    // Vérifier et envoyer les notifications
    const eventIds = newEvents.map((e) => e.id);
    const { notified, errors } = await checkAndSendGenreNotifications(eventIds);

    // Envoyer les notifications push pour les utilisateurs qui ont des souscriptions
    if (notified > 0) {
      // Récupérer les notifications créées dans cette exécution
      const notifications = await prisma.notification.findMany({
        where: {
          eventId: {
            in: eventIds,
          },
          type: 'SYSTEM',
          createdAt: {
            gte: oneHourAgo,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });

      // Grouper les notifications par utilisateur
      const notificationsByUser = new Map<string, typeof notifications>();
      for (const notification of notifications) {
        if (!notificationsByUser.has(notification.userId)) {
          notificationsByUser.set(notification.userId, []);
        }
        notificationsByUser.get(notification.userId)!.push(notification);
      }

      // Envoyer les push notifications
      let pushSent = 0;
      for (const [userId, userNotifications] of notificationsByUser.entries()) {
        try {
          // Récupérer les souscriptions push de l'utilisateur
          const subscriptions = await prisma.notificationSubscription.findMany({
            where: { userId },
          });

          if (subscriptions.length === 0) {
            continue;
          }

          // Envoyer une notification pour le premier événement (pour éviter le spam)
          const firstNotification = userNotifications[0];
          if (firstNotification && firstNotification.event) {
            const pushSubscriptions = subscriptions.map((sub) => ({
              endpoint: sub.endpoint,
              keys: {
                auth: sub.authKey || undefined,
                p256dh: sub.p256dhKey || undefined,
              },
            }));

            await sendEventPostPushNotifications({
              subscriptions: pushSubscriptions,
              payload: {
                title: firstNotification.title,
                body: firstNotification.body,
                icon: '/icons/icon-128x128.png',
                badge: '/icons/icon-72x72.png',
                image: firstNotification.event.imageUrl || undefined,
                data: {
                  eventId: firstNotification.eventId,
                  type: 'personalized_recommendation',
                },
              },
            });

            pushSent++;
          }
        } catch (error) {
          console.error(`[CRON] Erreur lors de l'envoi push pour l'utilisateur ${userId}:`, error);
        }
      }

      console.log(`[CRON] ${pushSent} notification(s) push envoyée(s)`);
    }

    console.log('[CRON] Vérification des notifications personnalisées terminée:', {
      eventsChecked: newEvents.length,
      notificationsSent: notified,
      errors,
    });

    return NextResponse.json({
      success: true,
      eventsChecked: newEvents.length,
      notificationsSent: notified,
      pushSent: notified > 0 ? 'sent' : 0,
      errors,
    });
  } catch (error) {
    console.error('[CRON] Erreur lors de la vérification des notifications personnalisées:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/personalized-notifications
 * Endpoint de test (développement uniquement)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Permettre l'exécution manuelle en développement
  const response = await POST(request);
  return response;
}

