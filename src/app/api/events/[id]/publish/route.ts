/**
 * API Endpoint: Publier un événement sur toutes les plateformes connectées
 * 
 * POST /api/events/[id]/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publishEventEverywhere, updateEventEverywhere } from '@/lib/publishing/publishOrchestrator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
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
    
    const eventId = params.id;
    
    // Vérifier que l'utilisateur est organisateur et propriétaire de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
      },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      );
    }
    
    if (!event.organizerId) {
      return NextResponse.json(
        { error: 'Cet événement n\'a pas d\'organisateur' },
        { status: 400 }
      );
    }
    
    const organizer = await prisma.organizer.findUnique({
      where: { id: event.organizerId },
    });
    
    if (!organizer || organizer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à publier cet événement' },
        { status: 403 }
      );
    }
    
    // Vérifier si l'événement a déjà été publié
    const existingPublications = await prisma.publicationLog.findMany({
      where: {
        eventId,
        organizerId: event.organizerId,
        status: 'success',
      },
    });
    
    let result;
    if (existingPublications.length > 0) {
      // Mettre à jour les publications existantes
      result = await updateEventEverywhere(eventId, event.organizerId);
    } else {
      // Publier pour la première fois
      result = await publishEventEverywhere(eventId, event.organizerId);
    }
    
    return NextResponse.json({
      success: true,
      summary: result,
    });
  } catch (error: any) {
    console.error('Erreur lors de la publication:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la publication' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

