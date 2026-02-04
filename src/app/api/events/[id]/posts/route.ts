import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { MediaKind } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildFavoriteNotificationPayloads,
  getEventPostType,
  getNotificationPreview,
  normalizeMediaPayload,
  sanitizePostContent,
} from '@/lib/event-feed';
import { sendEventPostPushNotifications } from '@/lib/notifications/push';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const mediaSchema = z.object({
  url: z.string().url(),
  kind: z.nativeEnum(MediaKind).optional(),
});

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  media: z.array(mediaSchema).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  mediaKind: z.nativeEnum(MediaKind).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedPagination = paginationSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    const skip = (parsedPagination.page - 1) * parsedPagination.pageSize;

    const [posts, total] = await prisma.$transaction([
      prisma.eventPost.findMany({
        where: { eventId: params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parsedPagination.pageSize,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          medias: true,
        },
      }),
      prisma.eventPost.count({
        where: { eventId: params.id },
      }),
    ]);

    return NextResponse.json({
      data: posts,
      meta: {
        page: parsedPagination.page,
        pageSize: parsedPagination.pageSize,
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error('[EventPosts][GET] Erreur:', error);
    return NextResponse.json({ error: 'Impossible de charger le fil.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = createPostSchema.parse(body);

    const legacyMedia = parsedBody.mediaUrls?.map((url) => ({
      url,
      kind: parsedBody.mediaKind ?? MediaKind.IMAGE,
    }));

    const normalizedMedia = normalizeMediaPayload(parsedBody.media ?? legacyMedia);
    const sanitizedContent = sanitizePostContent(parsedBody.content);

    if (!sanitizedContent) {
      return NextResponse.json({ error: 'Le contenu ne peut pas être vide.' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
    }

    if (!event.organizerId) {
      return NextResponse.json({ error: 'Aucun organisateur associé.' }, { status: 403 });
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id: event.organizerId },
      select: { userId: true },
    });

    if (!organizer || organizer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Seuls les organisateurs peuvent publier.' }, { status: 403 });
    }

    const { post, favoriteUserIds } = await prisma.$transaction(async (tx) => {
      const post = await tx.eventPost.create({
        data: {
          eventId: event.id,
          authorId: session.user.id,
          type: getEventPostType(normalizedMedia),
          content: sanitizedContent,
          medias: normalizedMedia.length
            ? {
                createMany: {
                  data: normalizedMedia.map((media) => ({
                    kind: media.kind ?? MediaKind.IMAGE,
                    url: media.url,
                  })),
                },
              }
            : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          medias: true,
        },
      });

      const favorites = await tx.favorite.findMany({
        where: { eventId: event.id },
        select: { userId: true },
      });

      if (favorites.length) {
        const notificationPreview = getNotificationPreview(sanitizedContent);
        const payloads = buildFavoriteNotificationPayloads({
          userIds: favorites
            .map((favorite) => favorite.userId)
            .filter((userId) => userId !== session.user.id),
          eventId: event.id,
          eventTitle: event.title,
          postId: post.id,
          previewText: notificationPreview,
        });

        if (payloads.length) {
          await tx.notification.createMany({
            data: payloads,
          });
        }
      }

      return {
        post,
        favoriteUserIds: favorites.map((favorite) => favorite.userId),
      };
    });

    const subscriptions = favoriteUserIds.length
      ? await prisma.notificationSubscription.findMany({
          where: { userId: { in: favoriteUserIds.filter((id) => id !== session.user.id) } },
          select: {
            endpoint: true,
            authKey: true,
            p256dhKey: true,
          },
        })
      : [];

    if (subscriptions.length) {
      await sendEventPostPushNotifications({
        subscriptions: subscriptions.map((subscription) => ({
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.authKey,
            p256dh: subscription.p256dhKey,
          },
        })),
        payload: {
          title: `Nouveau post pour ${event.title}`,
          body: getNotificationPreview(sanitizedContent),
          icon: '/icons/icon-128x128.png',
          badge: '/icons/icon-72x72.png',
          image: event.imageUrl,
          data: {
            eventId: event.id,
            postId: post.id,
            type: 'EVENT_POST_PUBLISHED',
          },
        },
      });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('[EventPosts][POST] Erreur:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Impossible de publier sur le fil.' }, { status: 500 });
  }
}

