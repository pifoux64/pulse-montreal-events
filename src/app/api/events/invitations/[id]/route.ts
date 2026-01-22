/**
 * API Route pour répondre à une invitation
 * PATCH /api/events/invitations/[id] - Accepter/refuser une invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide (ACCEPTED ou DECLINED requis)' },
        { status: 400 }
      );
    }

    // Récupérer l'invitation
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: params.id },
      select: {
        receiverId: true,
        status: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      );
    }

    if (invitation.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation déjà répondue' },
        { status: 409 }
      );
    }

    // Mettre à jour l'invitation
    const updated = await prisma.eventInvitation.update({
      where: { id: params.id },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Si acceptée, ajouter automatiquement aux favoris
    if (status === 'ACCEPTED') {
      try {
        await prisma.favorite.create({
          data: {
            userId: session.user.id,
            eventId: updated.event.id,
          },
        });
      } catch (error) {
        // Ignorer si déjà en favoris
      }
    }

    return NextResponse.json({ invitation: updated });

  } catch (error: any) {
    console.error('Erreur lors de la réponse à l\'invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
