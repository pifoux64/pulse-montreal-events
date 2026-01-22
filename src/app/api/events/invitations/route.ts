/**
 * API Route pour les invitations d'événements
 * POST /api/events/invitations - Envoyer une invitation
 * GET /api/events/invitations - Récupérer mes invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/events/invitations - Envoyer une invitation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, receiverId, message } = body;

    if (!eventId || !receiverId) {
      return NextResponse.json(
        { error: 'eventId et receiverId requis' },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous inviter vous-même' },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le receiver existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si invitation déjà envoyée
    const existing = await prisma.eventInvitation.findFirst({
      where: {
        eventId,
        senderId: session.user.id,
        receiverId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Invitation déjà envoyée' },
        { status: 409 }
      );
    }

    // Créer l'invitation
    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId,
        senderId: session.user.id,
        receiverId,
        message: message || null,
        status: 'PENDING',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            imageUrl: true,
            venue: {
              select: {
                name: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ invitation }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/invitations - Récupérer mes invitations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent' | 'received'

    let where: any = {};

    if (type === 'sent') {
      where.senderId = session.user.id;
    } else {
      where.receiverId = session.user.id;
    }

    const invitations = await prisma.eventInvitation.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            imageUrl: true,
            venue: {
              select: {
                name: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des invitations:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
