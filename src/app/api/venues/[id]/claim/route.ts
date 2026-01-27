/**
 * POST /api/venues/[id]/claim
 * Créer une demande de claim pour une venue
 * 
 * GET /api/venues/[id]/claim
 * Vérifier le statut d'un claim pour une venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VenueClaimStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

const ClaimVenueSchema = z.object({
  roleAtVenue: z.enum(['owner', 'manager', 'booker']).optional(),
  professionalEmail: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialLink: z.string().url().optional().or(z.literal('')),
  submittedInfo: z.record(z.any()).optional(),
});

/**
 * POST - Créer une demande de claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la venue existe
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si un claim existe déjà
    const existingClaim = await prisma.venueClaim.findUnique({
      where: {
        unique_venue_claim: {
          venueId,
          userId: session.user.id,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { 
          error: 'Une demande de claim existe déjà pour cette venue',
          claim: existingClaim,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const claimData = ClaimVenueSchema.parse(body);

    // Créer le claim
    const claim = await prisma.venueClaim.create({
      data: {
        venueId,
        userId: session.user.id,
        status: VenueClaimStatus.PENDING,
        roleAtVenue: claimData.roleAtVenue || null,
        professionalEmail: claimData.professionalEmail || null,
        website: claimData.website || null,
        socialLink: claimData.socialLink || null,
        submittedInfo: claimData.submittedInfo || null,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'Demande de claim créée avec succès',
        claim,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur création claim venue:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du claim' },
      { status: 500 }
    );
  }
}

/**
 * GET - Vérifier le statut d'un claim
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const claim = await prisma.venueClaim.findUnique({
      where: {
        unique_venue_claim: {
          venueId,
          userId: session.user.id,
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { claim: null, hasClaim: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { claim, hasClaim: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur récupération claim venue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du claim' },
      { status: 500 }
    );
  }
}
