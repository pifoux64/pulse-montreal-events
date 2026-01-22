/**
 * API Routes pour un organisateur spécifique - Pulse Montreal
 * GET /api/organizers/[id] - Détails d'un organisateur
 * PUT /api/organizers/[id] - Modifier un organisateur
 * DELETE /api/organizers/[id] - Supprimer un organisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Fonction utilitaire pour générer un slug à partir d'un nom
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
    .substring(0, 100); // Limiter la longueur
}

// Fonction pour s'assurer que le slug est unique
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organizer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const UpdateOrganizerSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  socials: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
});

/**
 * GET /api/organizers/[id] - Récupère les détails d'un organisateur
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const organizer = await prisma.organizer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        events: {
          where: {
            status: 'SCHEDULED',
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 10,
          select: {
            id: true,
            title: true,
            startAt: true,
            imageUrl: true,
            category: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(organizer);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'organisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'organisateur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizers/[id] - Modifier un organisateur
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire ou un admin
    const isOwner = organizer.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas l\'autorisation de modifier cet organisateur' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = UpdateOrganizerSchema.parse(body);

    // Seuls les admins peuvent modifier le statut verified
    const updateData: any = {};
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.socials) updateData.socials = data.socials;

    // Les admins peuvent aussi modifier le statut verified
    if (isAdmin && body.verified !== undefined) {
      updateData.verified = body.verified === true;
    }

    const updatedOrganizer = await prisma.organizer.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOrganizer);

  } catch (error) {
    console.error('Erreur lors de la modification de l\'organisateur:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la modification de l\'organisateur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizers/[id] - Supprimer un organisateur
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire ou un admin
    const isOwner = organizer.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas l\'autorisation de supprimer cet organisateur' },
        { status: 403 }
      );
    }

    // Supprimer l'organisateur (cascade supprimera aussi les événements associés si configuré)
    await prisma.organizer.delete({
      where: { id },
    });

    // Si c'est le propriétaire, remettre le rôle à USER
    if (isOwner) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'USER' },
      });
    }

    return NextResponse.json({ message: 'Organisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'organisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de l\'organisateur' },
      { status: 500 }
    );
  }
}

