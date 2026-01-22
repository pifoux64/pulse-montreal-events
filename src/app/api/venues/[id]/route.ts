/**
 * API Route pour gérer une venue spécifique
 * GET /api/venues/[id] - Récupère les détails d'un venue
 * PATCH /api/venues/[id] - Met à jour un venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fonction utilitaire pour générer un slug à partir d'un nom
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Fonction pour s'assurer que le slug est unique
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findUnique({
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

/**
 * GET /api/venues/[id] - Récupère les détails d'un venue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: false,
          },
        },
        events: {
          where: {
            status: 'SCHEDULED',
            startAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 10,
          include: {
            organizer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                favorites: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Lieu non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(venue);

  } catch (error) {
    console.error('Erreur lors de la récupération du venue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du venue' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/venues/[id] - Met à jour un venue
 */
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

    // Vérifier que la venue existe et appartient à l'utilisateur
    const existingVenue = await prisma.venue.findUnique({
      where: { id: params.id },
      select: { ownerUserId: true },
    });

    if (!existingVenue) {
      return NextResponse.json(
        { error: 'Venue non trouvée' },
        { status: 404 }
      );
    }

    if (existingVenue.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      capacity,
      address,
      city,
      postalCode,
      lat,
      lon,
      neighborhood,
      phone,
      website,
      contactEmail,
      types,
      tags,
    } = body;

    // Générer le slug si le nom a changé ou si la venue n'a pas de slug
    let slug: string | undefined = undefined;
    if (name) {
      // Récupérer le nom actuel pour comparer
      const currentVenue = await prisma.venue.findUnique({
        where: { id: params.id },
        select: { name: true, slug: true },
      });
      
      // Générer un slug si le nom change ou si la venue n'a pas de slug
      if (!currentVenue?.slug || name !== currentVenue.name) {
        const baseSlug = generateSlug(name);
        slug = await ensureUniqueSlug(baseSlug, params.id);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity, 10) : null;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lon !== undefined) updateData.lon = parseFloat(lon);
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (types !== undefined) updateData.types = types;
    if (tags !== undefined) updateData.tags = tags;

    const venue = await prisma.venue.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            events: true,
            requests: true,
          },
        },
      },
    });

    return NextResponse.json({ venue });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la venue:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une venue avec ce slug existe déjà' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la venue' },
      { status: 500 }
    );
  }
}
