import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    const skip = (pagination.page - 1) * pagination.pageSize;

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.pageSize,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: session.user.id },
      }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    });

    return NextResponse.json({
      data: notifications,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        unreadCount,
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error('[Notifications][GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Impossible de charger les notifications.' },
      { status: 500 }
    );
  }
}

