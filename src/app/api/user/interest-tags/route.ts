/**
 * API: User interest tags (SPRINT 6)
 *
 * GET  /api/user/interest-tags?category=genre|style|type|ambiance&source=manual|spotify|apple_music|auto
 * POST /api/user/interest-tags  { category, value, source?, score? }
 * DELETE /api/user/interest-tags { category, value, source? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PostSchema = z.object({
  category: z.string().min(1),
  value: z.string().min(1),
  source: z.string().optional().default('manual'),
  score: z.number().min(0).max(1).optional(),
});

const DeleteSchema = z.object({
  category: z.string().min(1),
  value: z.string().min(1),
  source: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const source = searchParams.get('source') || undefined;

  const tags = await prisma.userInterestTag.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category } : {}),
      ...(source ? { source } : {}),
    },
    select: {
      id: true,
      category: true,
      value: true,
      score: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ category: 'asc' }, { score: 'desc' }, { value: 'asc' }],
  });

  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const input = PostSchema.parse(body);

  const tag = await prisma.userInterestTag.upsert({
    where: {
      unique_user_tag_interest: {
        userId: session.user.id,
        category: input.category,
        value: input.value,
      },
    },
    create: {
      userId: session.user.id,
      category: input.category,
      value: input.value,
      source: input.source,
      score: input.score ?? 1,
    },
    update: {
      source: input.source,
      score: input.score ?? undefined,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ tag });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const input = DeleteSchema.parse(body);

  await prisma.userInterestTag.deleteMany({
    where: {
      userId: session.user.id,
      category: input.category,
      value: input.value,
      ...(input.source ? { source: input.source } : {}),
    },
  });

  return NextResponse.json({ success: true });
}


