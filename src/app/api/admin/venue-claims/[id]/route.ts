/**
 * PATCH /api/admin/venue-claims/[id]
 * Approuver ou rejeter une demande de claim venue (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VenueClaimStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

const ReviewClaimSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

/**
 * PATCH - Approuver ou rejeter un claim
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        roleAssignments: {
          select: { role: true },
        },
      },
    });

    const userRoles = new Set([user?.role || 'USER']);
    user?.roleAssignments?.forEach(ra => userRoles.add(ra.role));
    
    if (!userRoles.has('ADMIN')) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 }
      );
    }

    // Récupérer le claim
    const claim = await prisma.venueClaim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        venue: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = ReviewClaimSchema.parse(body);

    if (action === 'approve') {
      // Approuver le claim
      const updatedClaim = await prisma.venueClaim.update({
        where: { id: claimId },
        data: {
          status: VenueClaimStatus.VERIFIED,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      // S'assurer que l'utilisateur a le rôle VENUE
      const hasVenueRole = await prisma.userRoleAssignment.findUnique({
        where: {
          unique_user_role: {
            userId: claim.userId,
            role: UserRole.VENUE,
          },
        },
      });

      if (!hasVenueRole) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: claim.userId,
            role: UserRole.VENUE,
          },
        });
      }

      // Mettre à jour le rôle legacy pour compatibilité
      await prisma.user.update({
        where: { id: claim.userId },
        data: { role: UserRole.VENUE },
      });

      // Optionnel: Lier la venue à l'utilisateur (ownerUserId)
      await prisma.venue.update({
        where: { id: claim.venueId },
        data: { ownerUserId: claim.userId },
      });

      return NextResponse.json(
        { 
          message: 'Claim approuvé avec succès',
          claim: updatedClaim,
        },
        { status: 200 }
      );
    } else {
      // Rejeter le claim
      const updatedClaim = await prisma.venueClaim.update({
        where: { id: claimId },
        data: {
          status: VenueClaimStatus.REJECTED,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || null,
        },
      });

      return NextResponse.json(
        { 
          message: 'Claim rejeté',
          claim: updatedClaim,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Erreur modération claim venue:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la modération du claim' },
      { status: 500 }
    );
  }
}
