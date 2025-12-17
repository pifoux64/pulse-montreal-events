/**
 * Service de notifications personnalisées basées sur les goûts musicaux
 * Détermine si un utilisateur doit être notifié pour un nouvel événement
 * basé sur ses préférences musicales (genres, styles)
 */

import { prisma } from '@/lib/prisma';
import { buildUserMusicProfile } from '@/lib/recommendations/userProfileBuilder';
import { NotificationType } from '@prisma/client';

export interface NotificationReason {
  type: 'genre' | 'style' | 'favorite_similar';
  value: string;
  source?: 'spotify' | 'apple_music' | 'manual';
}

/**
 * Détermine si un utilisateur doit être notifié pour un événement
 * basé sur ses goûts musicaux et préférences
 */
export async function shouldNotifyUser(
  eventId: string,
  userId: string
): Promise<{ shouldNotify: boolean; reason: NotificationReason | null }> {
  // Récupérer l'événement avec ses tags
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventTags: true,
    },
  });

  if (!event) {
    return { shouldNotify: false, reason: null };
  }

  // Construire le profil musical de l'utilisateur
  const userProfile = await buildUserMusicProfile(userId);

  // Si l'utilisateur n'a aucun intérêt musical, ne pas notifier
  if (
    userProfile.genres.size === 0 &&
    userProfile.styles.size === 0 &&
    userProfile.types.size === 0 &&
    userProfile.ambiances.size === 0
  ) {
    return { shouldNotify: false, reason: null };
  }

  // Extraire les tags de l'événement
  const eventGenres = event.eventTags
    .filter((t) => t.category === 'genre')
    .map((t) => t.value);
  const eventStyles = event.eventTags
    .filter((t) => t.category === 'style')
    .map((t) => t.value);

  // Vérifier la correspondance avec les genres préférés
  for (const genre of eventGenres) {
    if (userProfile.genres.has(genre)) {
      // Trouver la source du tag (spotify, apple_music, manual)
      const interestTag = await prisma.userInterestTag.findFirst({
        where: {
          userId,
          category: 'genre',
          value: genre,
        },
      });

      return {
        shouldNotify: true,
        reason: {
          type: 'genre',
          value: genre,
          source: interestTag?.source as 'spotify' | 'apple_music' | 'manual' | undefined,
        },
      };
    }
  }

  // Vérifier la correspondance avec les styles préférés
  for (const style of eventStyles) {
    if (userProfile.styles.has(style)) {
      const interestTag = await prisma.userInterestTag.findFirst({
        where: {
          userId,
          category: 'style',
          value: style,
        },
      });

      return {
        shouldNotify: true,
        reason: {
          type: 'style',
          value: style,
          source: interestTag?.source as 'spotify' | 'apple_music' | 'manual' | undefined,
        },
      };
    }
  }

  // Vérifier si l'événement est similaire aux favoris de l'utilisateur
  if (userProfile.favoriteGenres.length > 0 || userProfile.favoriteStyles.length > 0) {
    const matchingGenres = eventGenres.filter((g) => userProfile.favoriteGenres.includes(g));
    const matchingStyles = eventStyles.filter((s) => userProfile.favoriteStyles.includes(s));

    if (matchingGenres.length > 0 || matchingStyles.length > 0) {
      return {
        shouldNotify: true,
        reason: {
          type: 'favorite_similar',
          value: matchingGenres[0] || matchingStyles[0] || '',
        },
      };
    }
  }

  return { shouldNotify: false, reason: null };
}

/**
 * Crée une notification personnalisée pour un utilisateur
 */
export async function createPersonalizedNotification(
  userId: string,
  eventId: string,
  reason: NotificationReason
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      startAt: true,
      venue: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!event) {
    return;
  }

  // Générer le titre et le corps de la notification
  let title = 'Nouvel événement pour vous';
  let body = '';

  if (reason.type === 'genre') {
    const genreLabel = reason.value.replace(/_/g, ' ');
    const sourceLabel =
      reason.source === 'spotify'
        ? ' (basé sur Spotify)'
        : reason.source === 'apple_music'
          ? ' (basé sur Apple Music)'
          : '';
    title = `Nouvel événement ${genreLabel}${sourceLabel}`;
    body = `${event.title} pourrait vous plaire !`;
  } else if (reason.type === 'style') {
    const styleLabel = reason.value.replace(/_/g, ' ');
    title = `Nouvel événement ${styleLabel}`;
    body = `${event.title} correspond à vos goûts musicaux.`;
  } else if (reason.type === 'favorite_similar') {
    title = 'Événement similaire à vos favoris';
    body = `${event.title} pourrait vous intéresser.`;
  }

  // Créer la notification dans la base de données
  await prisma.notification.create({
    data: {
      userId,
      eventId,
      type: NotificationType.SYSTEM,
      title,
      body,
      data: {
        reason: reason.type,
        value: reason.value,
        source: reason.source,
      },
    },
  });
}

/**
 * Vérifie et envoie des notifications pour les nouveaux événements
 * correspondant aux genres/styles préférés des utilisateurs
 */
export async function checkAndSendGenreNotifications(
  eventIds: string[]
): Promise<{ notified: number; errors: number }> {
  let notified = 0;
  let errors = 0;

  // Pour chaque événement, trouver les utilisateurs à notifier
  for (const eventId of eventIds) {
    try {
      // Récupérer tous les utilisateurs qui ont des intérêts musicaux
      const usersWithInterests = await prisma.user.findMany({
        where: {
          interestTags: {
            some: {
              category: {
                in: ['genre', 'style'],
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      // Pour chaque utilisateur, vérifier s'il doit être notifié
      for (const user of usersWithInterests) {
        const { shouldNotify, reason } = await shouldNotifyUser(eventId, user.id);

        if (shouldNotify && reason) {
          // Vérifier si l'utilisateur a déjà été notifié pour cet événement
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              eventId,
              type: NotificationType.SYSTEM,
            },
          });

          if (!existingNotification) {
            await createPersonalizedNotification(user.id, eventId, reason);
            notified++;
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'événement ${eventId}:`, error);
      errors++;
    }
  }

  return { notified, errors };
}

