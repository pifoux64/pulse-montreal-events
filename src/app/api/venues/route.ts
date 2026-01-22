/**
 * API Route pour créer et mettre à jour des venues
 * POST /api/venues - Créer une nouvelle venue
 * PATCH /api/venues/[id] - Mettre à jour une venue
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
 * POST /api/venues - Créer une nouvelle venue
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

    // Validation des champs requis
    if (!name || !address || !city || !postalCode || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Générer le slug
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    const venue = await prisma.venue.create({
      data: {
        name,
        slug,
        description,
        capacity: capacity ? parseInt(capacity, 10) : null,
        address,
        city,
        postalCode,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        neighborhood,
        phone,
        website,
        contactEmail,
        types: types || [],
        tags: tags || [],
        ownerUserId: session.user.id,
      },
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

    return NextResponse.json({ venue }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de la création de la venue:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une venue avec ce slug existe déjà' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la venue' },
      { status: 500 }
    );
  }
}
