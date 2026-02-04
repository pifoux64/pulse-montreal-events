/**
 * API: Mettre à jour le statut d'un Pulse Picks
 * Sprint V3: Admin workflow - Review/Approve/Publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  publishedAt: z.string().optional(), // ISO string pour PUBLISHED
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { status, publishedAt } = UpdateStatusSchema.parse(body);

    const post = await prisma.editorialPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Pulse Picks introuvable' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Si on publie, définir publishedAt
    if (status === 'PUBLISHED' && !post.publishedAt) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
    }

    // Si on archive ou met en draft, on peut garder publishedAt (historique)

    const updatedPost = await prisma.editorialPost.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('Erreur PATCH /api/editorial/pulse-picks/[id]/status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}

