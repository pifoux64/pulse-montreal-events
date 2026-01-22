/**
 * API Route pour les demandes de réservation
 * POST /api/venue-requests - Créer une demande de réservation
 * GET /api/venue-requests?venueId=... - Récupérer les demandes d'une venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/venue-requests - Créer une demande de réservation
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

    // Vérifier que l'utilisateur est un organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Vous devez être organisateur pour faire une demande' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      venueId,
      concept,
      dateStart,
      dateEnd,
      expectedAttendance,
      budget,
    } = body;

    // Validation
    if (!venueId || !concept || !dateStart) {
      return NextResponse.json(
        { error: 'Champs requis manquants (venueId, concept, dateStart)' },
        { status: 400 }
      );
    }

    // Vérifier que la venue existe
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue non trouvée' },
        { status: 404 }
      );
    }

    // Créer la demande
    const venueRequest = await prisma.venueRequest.create({
      data: {
        venueId,
        organizerId: organizer.id,
        concept,
        dateStart: new Date(dateStart),
        dateEnd: dateEnd ? new Date(dateEnd) : null,
        expectedAttendance: expectedAttendance ? parseInt(expectedAttendance, 10) : null,
        budget: budget ? Math.round(parseFloat(budget) * 100) : null, // Convertir en cents
        status: 'PENDING',
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

    return NextResponse.json({ venueRequest }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de la création de la demande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la demande' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/venue-requests - Récupérer les demandes
 * Query params: venueId (pour les salles), organizerId (pour les organisateurs)
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
    const venueId = searchParams.get('venueId');
    const organizerId = searchParams.get('organizerId');

    let where: any = {};

    // Si venueId est fourni, vérifier que l'utilisateur possède la venue
    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { ownerUserId: true },
      });

      if (!venue) {
        return NextResponse.json(
          { error: 'Venue non trouvée' },
          { status: 404 }
        );
      }

      if (venue.ownerUserId !== session.user.id) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 403 }
        );
      }

      where.venueId = venueId;
    }

    // Si organizerId est fourni, vérifier que c'est l'organisateur connecté
    if (organizerId) {
      const organizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
        select: { userId: true },
      });

      if (!organizer || organizer.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 403 }
        );
      }

      where.organizerId = organizerId;
    }

    const requests = await prisma.venueRequest.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des demandes' },
      { status: 500 }
    );
  }
}
