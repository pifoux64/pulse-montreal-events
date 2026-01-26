/**
 * API Route pour gérer une demande de réservation spécifique
 * PATCH /api/venue-requests/[id] - Accepter/refuser une demande
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VenueRequestStatus } from '@prisma/client';

/**
 * PATCH /api/venue-requests/[id] - Mettre à jour le statut d'une demande
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { status, comments } = body;

    // Validation du statut
    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide (ACCEPTED ou DECLINED requis)' },
        { status: 400 }
      );
    }

    // Récupérer la demande
    const venueRequest = await prisma.venueRequest.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            ownerUserId: true,
          },
        },
      },
    });

    if (!venueRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur possède la venue
    if (venueRequest.venue.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.venueRequest.update({
      where: { id },
      data: {
        status: status as VenueRequestStatus,
        comments: comments || null,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        organizer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ venueRequest: updatedRequest });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la demande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la demande' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/venue-requests/[id] - Récupérer une demande spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const venueRequest = await prisma.venueRequest.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            ownerUserId: true,
          },
        },
        organizer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!venueRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions : soit propriétaire de la venue, soit organisateur qui a fait la demande
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isVenueOwner = venueRequest.venue.ownerUserId === session.user.id;
    const isRequestOrganizer = organizer?.id === venueRequest.organizerId;

    if (!isVenueOwner && !isRequestOrganizer) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({ venueRequest });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de la demande' },
      { status: 500 }
    );
  }
}
