/**
 * API Routes pour les événements - Pulse Montreal
 * GET /api/events - Liste des événements avec filtres
 * POST /api/events - Création d'événement (organisateurs uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireRole, requireVerifiedOrganizer } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventCategory, EventLanguage, EventStatus, UserRole } from '@prisma/client';

/**
 * Génère des tags automatiques basés sur le contenu de l'événement
 */
function generateAutoTags(eventData: z.infer<typeof CreateEventSchema>): string[] {
  const tags: string[] = [];
  const text = `${eventData.title} ${eventData.description || ''}`.toLowerCase();

  // Tag gratuit si priceMin est 0
  if (eventData.priceMin === 0) {
    tags.push('gratuit');
  }

  // Détection "gratuit" dans le texte
  const freePatterns = [
    /\bgratuit\b/i,
    /\bfree\b/i,
    /\bentrée gratuite\b/i,
    /\bentrée libre\b/i,
    /\bsans frais\b/i,
  ];
  if (freePatterns.some(pattern => pattern.test(text)) && !tags.includes('gratuit')) {
    tags.push('gratuit');
  }

  // Détection 18+
  const agePatterns = [
    /\b18\+\b/i,
    /\b21\+\b/i,
    /\b16\+\b/i,
    /\badult only\b/i,
    /\badultes uniquement\b/i,
  ];
  agePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        const ageTag = match[0].replace(/\s+/g, '').toLowerCase();
        if (!tags.includes(ageTag)) {
          tags.push(ageTag);
        }
      }
    }
  });

  // Détection plein air
  const outdoorPatterns = [
    /\bplein air\b/i,
    /\boutdoor\b/i,
    /\bextérieur\b/i,
    /\bparc\b/i,
  ];
  if (outdoorPatterns.some(pattern => pattern.test(text))) {
    tags.push('plein-air');
  }

  // Détection accessibilité
  if (eventData.accessibility && eventData.accessibility.length > 0) {
    tags.push('accessible');
  }
  if (text.includes('accessible') || text.includes('wheelchair') || text.includes('fauteuil roulant')) {
    if (!tags.includes('accessible')) {
      tags.push('accessible');
    }
  }

  return tags;
}

// Schéma de validation pour la création d'événement
const CreateEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  venueId: z.string().uuid().optional(),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
    lat: z.number(),
    lon: z.number(),
    neighborhood: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
  url: z.string().url().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  currency: z.string().length(3).default('CAD'),
  language: z.nativeEnum(EventLanguage).default(EventLanguage.FR),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  category: z.nativeEnum(EventCategory),
  subcategory: z.string().optional(),
  accessibility: z.array(z.string()).default([]),
  ageRestriction: z.string().optional(),
});

// Schéma pour les filtres de recherche
const EventFiltersSchema = z.object({
  q: z.string().optional(),
  category: z.nativeEnum(EventCategory).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  free: z.boolean().optional(),
  lang: z.nativeEnum(EventLanguage).optional(),
  neighborhood: z.string().optional(),
  distanceKm: z.number().min(0).max(100).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  organizerId: z.string().uuid().optional(),
  sort: z.enum(['proximity', 'time', 'popularity']).default('time'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/events - Recherche et liste des événements
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parser les paramètres de requête
    const params = Object.fromEntries(searchParams.entries());
    
    // Convertir les paramètres string en types appropriés
    const filters = EventFiltersSchema.parse({
      ...params,
      tags: params.tags ? params.tags.split(',') : undefined,
      priceMin: params.priceMin ? parseInt(params.priceMin) : undefined,
      priceMax: params.priceMax ? parseInt(params.priceMax) : undefined,
      free: params.free === 'true',
      distanceKm: params.distanceKm ? parseFloat(params.distanceKm) : undefined,
      lat: params.lat ? parseFloat(params.lat) : undefined,
      lon: params.lon ? parseFloat(params.lon) : undefined,
      organizerId: params.organizerId || undefined,
      page: params.page ? parseInt(params.page) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
    });

    // Construire la requête Prisma
    const where: any = {
      status: EventStatus.SCHEDULED,
      startAt: {
        gte: new Date(),
      },
    };

    // Filtres par catégorie
    if (filters.category) {
      where.category = filters.category;
    }

    // Filtres par tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasAll: filters.tags,
      };
    }

    // Filtres par dates
    if (filters.dateFrom) {
      where.startAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.startAt.lte = new Date(filters.dateTo);
    }

    // Filtres par prix
    if (filters.free) {
      where.OR = [
        { priceMin: 0 },
        { priceMin: null },
      ];
    } else {
      if (filters.priceMin !== undefined) {
        where.priceMin = { gte: filters.priceMin };
      }
      if (filters.priceMax !== undefined) {
        where.priceMax = { lte: filters.priceMax };
      }
    }

    // Filtre par langue
    if (filters.lang) {
      where.language = filters.lang;
    }

    // Recherche textuelle
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { tags: { has: filters.q } },
      ];
    }

    // Filtre géographique par distance (Haversine)
    // Si lat, lon et distanceKm sont fournis, filtrer par cercle
    let distanceFilter: any = null;
    if (filters.lat && filters.lon && filters.distanceKm) {
      // Utiliser une requête SQL brute avec la formule Haversine
      // Pour PostgreSQL avec PostGIS, on peut utiliser ST_DWithin
      // Sinon, on filtre après la requête
      distanceFilter = {
        lat: filters.lat,
        lon: filters.lon,
        distanceKm: filters.distanceKm,
      };
    }

    // Tri
    let orderBy: any = [{ startAt: 'asc' }];
    if (filters.sort === 'popularity') {
      orderBy = [{ favorites: { _count: 'desc' } }, { startAt: 'asc' }];
    }

    // Pagination
    const skip = (filters.page - 1) * filters.pageSize;

    // Exécuter la requête
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: filters.pageSize,
        include: {
          venue: true,
          organizer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          promotions: {
            where: {
              startsAt: { lte: new Date() },
              endsAt: { gte: new Date() },
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Appliquer le filtre de distance après la requête (si nécessaire)
    let filteredEvents = events;
    if (distanceFilter) {
      filteredEvents = events.filter(event => {
        if (!event.venue) return false;
        const distance = calculateDistance(
          distanceFilter.lat,
          distanceFilter.lon,
          event.venue.lat,
          event.venue.lon
        );
        return distance <= distanceFilter.distanceKm;
      });
    }

    // Si recherche par proximité, trier par distance
    let sortedEvents = filteredEvents;
    if (filters.sort === 'proximity' && filters.lat && filters.lon) {
      sortedEvents = filteredEvents
        .map(event => ({
          ...event,
          distance: event.venue ? calculateDistance(
            filters.lat!,
            filters.lon!,
            event.venue.lat,
            event.venue.lon
          ) : Infinity,
        }))
        .sort((a, b) => a.distance - b.distance);
    } else if (distanceFilter) {
      // Ajouter la distance même si on ne trie pas par proximité
      sortedEvents = filteredEvents.map(event => ({
        ...event,
        distance: event.venue ? calculateDistance(
          distanceFilter.lat,
          distanceFilter.lon,
          event.venue.lat,
          event.venue.lon
        ) : Infinity,
      }));
    }

    // Recalculer le total si on a filtré par distance
    const finalTotal = distanceFilter ? sortedEvents.length : total;

    return NextResponse.json({
      items: sortedEvents,
      total: finalTotal,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(finalTotal / filters.pageSize),
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des événements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events - Création d'un nouvel événement
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

    // Vérifier que l'utilisateur est un organisateur vérifié
    requireRole([UserRole.ORGANIZER, UserRole.ADMIN])(session.user.role);
    
    if (session.user.role === UserRole.ORGANIZER) {
      requireVerifiedOrganizer(session.user.organizer);
    }

    const body = await request.json();
    const eventData = CreateEventSchema.parse(body);

    // Créer ou récupérer le venue
    let venueId = eventData.venueId;
    if (!venueId && eventData.venue) {
      const venue = await prisma.venue.create({
        data: eventData.venue,
      });
      venueId = venue.id;
    }

    // Récupérer l'organisateur
    const organizer = await prisma.organizer.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: 'Profil organisateur non trouvé' },
        { status: 400 }
      );
    }

    // Générer les tags automatiques basés sur le contenu
    const autoTags = generateAutoTags(eventData);
    const allTags = [...new Set([...autoTags, ...(eventData.tags || [])])];

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        startAt: new Date(eventData.startAt),
        endAt: eventData.endAt ? new Date(eventData.endAt) : null,
        venueId,
        url: eventData.url,
        priceMin: eventData.priceMin,
        priceMax: eventData.priceMax,
        currency: eventData.currency,
        language: eventData.language,
        imageUrl: eventData.imageUrl,
        tags: allTags,
        category: eventData.category,
        subcategory: eventData.subcategory,
        accessibility: eventData.accessibility,
        ageRestriction: eventData.ageRestriction,
        organizerId: organizer.id,
        source: 'INTERNAL',
        status: EventStatus.SCHEDULED,
      },
      include: {
        venue: true,
        organizer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'événement' },
      { status: 500 }
    );
  }
}

/**
 * Calculer la distance entre deux points en kilomètres
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
