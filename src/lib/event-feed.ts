import { EventPostType, MediaKind, NotificationType, Prisma } from '@prisma/client';

export interface MediaPayload {
  url: string;
  kind?: MediaKind | null;
}

export interface FavoriteNotificationInput {
  userIds: string[];
  eventId: string;
  eventTitle: string;
  postId: string;
  previewText: string;
}

const DEFAULT_NOTIFICATION_PREVIEW_LENGTH = 160;

export function sanitizePostContent(content: string): string {
  return content.trim();
}

export function normalizeMediaPayload(media?: MediaPayload[] | null): MediaPayload[] {
  if (!media || media.length === 0) {
    return [];
  }

  return media
    .filter((item): item is MediaPayload => Boolean(item?.url))
    .map((item) => ({
      url: item.url.trim(),
      kind: item.kind ?? MediaKind.IMAGE,
    }))
    .filter((item, index, array) => item.url !== '' && array.findIndex((i) => i.url === item.url) === index);
}

export function getEventPostType(media: MediaPayload[]): EventPostType {
  return media.length > 0 ? EventPostType.MEDIA : EventPostType.TEXT;
}

export function getNotificationPreview(content: string, maxLength = DEFAULT_NOTIFICATION_PREVIEW_LENGTH): string {
  const clean = sanitizePostContent(content);
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1)}…`;
}

export function buildFavoriteNotificationPayloads({
  userIds,
  eventId,
  eventTitle,
  postId,
  previewText,
}: FavoriteNotificationInput) {
  const uniqueUserIds = Array.from(new Set(userIds));
  const title = `Nouveau post pour ${eventTitle}`;

  return uniqueUserIds.map((userId) => ({
    userId,
    eventId,
    type: NotificationType.EVENT_POST_PUBLISHED,
    title,
    body: previewText,
    data: {
      eventId,
      postId,
    },
  }));
}

export function buildMarkAsReadWhereClause(params: {
  ids?: string[];
  userId: string;
  markAll?: boolean;
}): Prisma.NotificationWhereInput {
  const { ids, userId, markAll } = params;

  if (markAll) {
    return { userId, readAt: null };
  }

  if (!ids || ids.length === 0) {
    throw new Error('Aucun identifiant de notification fourni');
  }

  return {
    userId,
    id: { in: Array.from(new Set(ids)) },
    readAt: null,
  };
}

