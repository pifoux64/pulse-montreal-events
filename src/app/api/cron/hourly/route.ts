/**
 * CRON Job horaire - Plan Hobby Vercel (limite: 2 cron jobs, 1x/jour)
 * 
 * Ce job combine toutes les tâches horaires :
 * - Vérification des nouveaux événements et notifications personnalisées
 * - Ingestion complémentaire (si nécessaire)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAndSendGenreNotifications } from '@/lib/notifications/personalizedNotifications';
import { sendEventPostPushNotifications } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      logger.warn('Tentative d\'accès non autorisé au CRON horaire');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    logger.info('Début du CRON horaire');

    const results = {
      notifications: { success: false, notificationsSent: 0, errors: [] },
    };

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
      logger.info('Aucun nouvel événement dans la dernière heure');
      return NextResponse.json({
        success: true,
        eventsChecked: 0,
        notificationsSent: 0,
        errors: 0,
      });
    }

    logger.info(`${newEvents.length} nouveaux événements détectés`);

    // Envoyer les notifications personnalisées
    try {
      let totalNotifications = 0;

      for (const event of newEvents) {
        try {
          // Notifications basées sur les genres musicaux
          const genreNotifications = await checkAndSendGenreNotifications(event.id);
          totalNotifications += genreNotifications || 0;

          // Notifications push pour les événements
          await sendEventPostPushNotifications(event.id);
        } catch (error) {
          results.notifications.errors.push(`Event ${event.id}: ${error}`);
          logger.error(`Erreur lors de l'envoi de notifications pour l'événement ${event.id}`, error);
        }
      }

      results.notifications.success = true;
      results.notifications.notificationsSent = totalNotifications;
      logger.info(`Notifications envoyées: ${totalNotifications}`);
    } catch (error) {
      results.notifications.errors.push(String(error));
      logger.error('Erreur lors de l\'envoi des notifications', error);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      eventsChecked: newEvents.length,
      results,
    });
  } catch (error) {
    logger.error('Erreur dans le CRON horaire', error);
    return NextResponse.json(
      { error: 'Erreur interne', details: String(error) },
      { status: 500 }
    );
  }
}

