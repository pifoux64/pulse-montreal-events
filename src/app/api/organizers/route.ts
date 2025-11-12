/**
 * API Routes pour les organisateurs - Pulse Montreal
 * GET /api/organizers - Liste des organisateurs
 * POST /api/organizers - Créer un organisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateOrganizerSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  socials: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
});

/**
 * GET /api/organizers - Récupère la liste des organisateurs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (verified === 'true') {
      where.verified = true;
    }
    
    if (search) {
      where.displayName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [organizers, total] = await Promise.all([
      prisma.organizer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
        orderBy: {
          displayName: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.organizer.count({ where }),
    ]);

    return NextResponse.json({
      items: organizers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des organisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des organisateurs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizers - Créer un profil organisateur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur a déjà un profil organisateur
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });

    if (existingOrganizer) {
      return NextResponse.json(
        { error: 'Vous avez déjà un profil organisateur' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = CreateOrganizerSchema.parse(body);

    // Créer le profil organisateur
    const organizer = await prisma.organizer.create({
      data: {
        userId: session.user.id,
        displayName: data.displayName,
        website: data.website || null,
        socials: data.socials || null,
        verified: false, // Par défaut non vérifié
      },
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

    // Mettre à jour le rôle de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ORGANIZER' },
    });

    return NextResponse.json(organizer, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'organisateur:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'organisateur' },
      { status: 500 }
    );
  }
}

