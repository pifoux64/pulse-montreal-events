/**
 * Service de tracking des interactions utilisateur
 * SPRINT 2: Personalization & Recommendations
 * 
 * Permet d'enregistrer les interactions (VIEW, CLICK, FAVORITE, SHARE, DISMISS)
 */

import { prisma } from '@/lib/prisma';
import { UserEventInteractionType } from '@prisma/client';

/**
 * Enregistre une interaction utilisateur
 * Utilise upsert pour éviter les doublons (unique constraint sur userId+eventId+type)
 */
export async function trackInteraction(
  userId: string,
  eventId: string,
  type: UserEventInteractionType
): Promise<void> {
  try {
    await prisma.userEventInteraction.upsert({
      where: {
        unique_user_event_interaction: {
          userId,
          eventId,
          type,
        },
      },
      create: {
        userId,
        eventId,
        type,
      },
      update: {
        // Si l'interaction existe déjà, on met à jour la date (plus récente)
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Ignorer les erreurs de tracking (ne pas bloquer l'UX)
    console.error(`Erreur tracking interaction ${type} pour user ${userId}, event ${eventId}:`, error);
  }
}

/**
 * Enregistre plusieurs interactions en batch (plus efficace)
 */
export async function trackInteractions(
  interactions: Array<{ userId: string; eventId: string; type: UserEventInteractionType }>
): Promise<void> {
  try {
    await prisma.$transaction(
      interactions.map(({ userId, eventId, type }) =>
        prisma.userEventInteraction.upsert({
          where: {
            unique_user_event_interaction: {
              userId,
              eventId,
              type,
            },
          },
          create: {
            userId,
            eventId,
            type,
          },
          update: {
            createdAt: new Date(),
          },
        })
      )
    );
  } catch (error) {
    console.error('Erreur tracking interactions batch:', error);
  }
}



