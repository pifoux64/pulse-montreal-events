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
import { normalizeUrl } from '@/lib/utils';

const autoVerifyOrganizers = process.env.AUTO_VERIFY_ORGANIZERS !== 'false';

const CreateOrganizerSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  website: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), 'URL invalide')
    .optional()
    .or(z.literal('')),
  socials: z.object({
    facebook: z.string()
      .transform((val) => val ? normalizeUrl(val) || val : val)
      .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
      .optional(),
    instagram: z.string()
      .transform((val) => val ? normalizeUrl(val) || val : val)
      .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
      .optional(),
    twitter: z.string()
      .transform((val) => val ? normalizeUrl(val) || val : val)
      .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
      .optional(),
    linkedin: z.string()
      .transform((val) => val ? normalizeUrl(val) || val : val)
      .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
      .optional(),
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

  } catch (error: any) {
    // Si la table n'existe pas encore, retourner une liste vide
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    }
    console.error('Erreur lors de la récupération des organisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des organisateurs' },
      { status: 500 }
    );
  }
}

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
    let existingOrganizer;
    try {
      existingOrganizer = await prisma.organizer.findUnique({
        where: { userId: session.user.id },
      });
    } catch (dbError: any) {
      // Si la table n'existe pas encore, on peut continuer
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        existingOrganizer = null;
      } else {
        throw dbError;
      }
    }

    if (existingOrganizer) {
      return NextResponse.json(
        { error: 'Vous avez déjà un profil organisateur' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = CreateOrganizerSchema.parse(body);

    // Générer le slug
    const baseSlug = generateSlug(data.displayName);
    const slug = await ensureUniqueSlug(baseSlug);

    // Créer le profil organisateur
    const organizer = await prisma.organizer.create({
      data: {
        userId: session.user.id,
        displayName: data.displayName,
        slug,
        website: data.website || null,
        socials: data.socials || null,
        verified: autoVerifyOrganizers,
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

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'organisateur:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    // Si la table n'existe pas encore
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'La fonctionnalité organisateur n\'est pas encore disponible. La table doit être créée dans la base de données.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'organisateur' },
      { status: 500 }
    );
  }
}

