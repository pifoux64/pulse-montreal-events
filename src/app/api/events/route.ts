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
import { geocodeAddress, getDefaultCoordinates } from '@/lib/geocode';
import { EventCategory, EventLanguage, EventStatus, UserRole, PromotionStatus } from '@prisma/client';
import { enrichEventWithTags } from '@/lib/tagging/eventTaggingService';

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
    lat: z.number().optional(),
    lon: z.number().optional(),
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
  // SPRINT 1: Paramètre scope pour today/weekend
  scope: z.enum(['today', 'weekend', 'all']).optional(),
  tag: z.string().optional(), // SPRINT 1: Filtre par tag unique
  genre: z.string().optional(), // Sprint tagging: filtre par genre structuré
  type: z.string().optional(), // SPRINT 2: Filtre par type d'événement (EventTag)
  ambiance: z.string().optional(), // SPRINT 2: Filtre par ambiance (EventTag)
  public: z.string().optional(), // SPRINT 2: Filtre par public (EventTag)
  q: z.string().optional(),
  category: z.nativeEnum(EventCategory).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().optional(), // Accepte ISO datetime ou date simple
  dateTo: z.string().optional(), // Accepte ISO datetime ou date simple
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  free: z.boolean().optional(),
  lang: z.nativeEnum(EventLanguage).optional(),
  neighborhood: z.string().optional(),
  distanceKm: z.number().min(0).max(100).optional(),
  lat: z.number().optional(), // SPRINT 1: lat optionnel
  lng: z.number().optional(), // SPRINT 1: lng optionnel (alias de lon)
  lon: z.number().optional(),
  radius: z.number().min(0).optional(), // SPRINT 1: radius optionnel (en km)
  organizerId: z.string().uuid().optional(),
  sort: z.enum(['proximity', 'time', 'popularity']).default('time'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/events - Recherche et liste des événements
 * SPRINT 1: Support scope=today|weekend avec logique temporelle Montréal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parser les paramètres de requête
    const params = Object.fromEntries(searchParams.entries());
    
    // Convertir les paramètres string en types appropriés
    const filters = EventFiltersSchema.parse({
      ...params,
      scope: params.scope || undefined, // SPRINT 1: today | weekend | all
      tag: params.tag || undefined, // SPRINT 1: tag unique
      genre: params.genre || undefined,
      type: params.type || undefined, // SPRINT 2: type d'événement
      ambiance: params.ambiance || undefined, // SPRINT 2: ambiance
      public: params.public || undefined, // SPRINT 2: public
      tags: params.tags ? params.tags.split(',') : undefined,
      priceMin: params.priceMin ? parseInt(params.priceMin) : undefined,
      priceMax: params.priceMax ? parseInt(params.priceMax) : undefined,
      free: params.free === 'true',
      distanceKm: params.distanceKm ? parseFloat(params.distanceKm) : params.radius ? parseFloat(params.radius) : undefined, // SPRINT 1: support radius
      lat: params.lat ? parseFloat(params.lat) : undefined,
      lon: params.lon ? parseFloat(params.lon) : params.lng ? parseFloat(params.lng) : undefined, // SPRINT 1: support lng
      organizerId: params.organizerId || undefined,
      page: params.page ? parseInt(params.page) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
      // SPRINT 2: Support dateFrom et dateTo pour dates personnalisées
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    });

    // SPRINT 1: Logique temporelle selon scope (timezone Montréal)
    // Les dates dans la DB sont en UTC, on filtre selon l'heure locale de Montréal
    const montrealTimezone = 'America/Montreal';
    const now = new Date();
    
    // Fonction helper pour obtenir une date en heure de Montréal
    const getMontrealDate = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: montrealTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const year = parseInt(parts.find(p => p.type === 'year')!.value);
      const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
      const day = parseInt(parts.find(p => p.type === 'day')!.value);
      const hour = parseInt(parts.find(p => p.type === 'hour')!.value);
      const minute = parseInt(parts.find(p => p.type === 'minute')!.value);
      const second = parseInt(parts.find(p => p.type === 'second')!.value);
      return new Date(year, month, day, hour, minute, second);
    };
    
    const nowMontreal = getMontrealDate(now);
    
    // Aujourd'hui : début et fin de journée (timezone Montréal)
    const todayStart = new Date(nowMontreal);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(nowMontreal);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Calculer le week-end (vendredi 00:00 à dimanche 23:59)
    const dayOfWeek = nowMontreal.getDay(); // 0 = dimanche, 5 = vendredi, 6 = samedi
    let weekendStart: Date;
    let weekendEnd: Date;
    
    if (dayOfWeek === 0) {
      // Dimanche : week-end actuel (vendredi passé à dimanche actuel)
      weekendStart = new Date(nowMontreal);
      weekendStart.setDate(nowMontreal.getDate() - 2); // Vendredi
      weekendStart.setHours(0, 0, 0, 0);
      weekendEnd = new Date(nowMontreal);
      weekendEnd.setHours(23, 59, 59, 999);
    } else if (dayOfWeek >= 5) {
      // Vendredi ou samedi : week-end actuel
      weekendStart = new Date(nowMontreal);
      if (dayOfWeek === 6) {
        weekendStart.setDate(nowMontreal.getDate() - 1); // Vendredi
      }
      weekendStart.setHours(0, 0, 0, 0);
      weekendEnd = new Date(weekendStart);
      weekendEnd.setDate(weekendStart.getDate() + 2); // Dimanche
      weekendEnd.setHours(23, 59, 59, 999);
    } else {
      // Lundi à jeudi : week-end prochain
      const daysUntilFriday = 5 - dayOfWeek;
      weekendStart = new Date(nowMontreal);
      weekendStart.setDate(nowMontreal.getDate() + daysUntilFriday);
      weekendStart.setHours(0, 0, 0, 0);
      weekendEnd = new Date(weekendStart);
      weekendEnd.setDate(weekendStart.getDate() + 2); // Dimanche
      weekendEnd.setHours(23, 59, 59, 999);
    }
    
    // Les dates JavaScript sont toujours stockées en UTC
    // getMontrealDate crée des dates avec les composants locaux mais elles sont interprétées en UTC
    // Pour la requête DB, on utilise directement les dates car Prisma/PostgreSQL gère les timezones
    // On doit juste s'assurer que les dates représentent bien l'heure locale de Montréal
    
    // Méthode simple : utiliser les dates telles quelles car elles sont déjà en UTC
    // La DB compare les dates UTC stockées avec les dates UTC passées
    const todayStartUTC = todayStart;
    const todayEndUTC = todayEnd;
    const weekendStartUTC = weekendStart;
    const weekendEndUTC = weekendEnd;
    
    // Log pour déboguer
    if (filters.scope === 'weekend') {
      console.log('🔍 Debug weekend:', {
        jourActuel: nowMontreal.toLocaleDateString('fr-CA', { weekday: 'long' }),
        weekendStart: weekendStart.toLocaleString('fr-CA'),
        weekendEnd: weekendEnd.toLocaleString('fr-CA'),
        weekendStartUTC: weekendStartUTC.toISOString(),
        weekendEndUTC: weekendEndUTC.toISOString(),
      });
    }

    // Construire la requête Prisma
    // Inclure les événements SCHEDULED et UPDATED (pas CANCELLED)
    const where: any = {
      status: {
        in: [EventStatus.SCHEDULED, EventStatus.UPDATED],
      },
    };

    // SPRINT 1: Appliquer le filtre scope (seulement si pas de dateFrom/dateTo)
    // Les dates personnalisées (dateFrom/dateTo) ont priorité sur scope
    if (!filters.dateFrom && !filters.dateTo) {
      if (filters.scope === 'today') {
        // Aujourd'hui : événements du jour (timezone Montréal)
        where.startAt = {
          gte: todayStartUTC,
          lte: todayEndUTC,
        };
      } else if (filters.scope === 'weekend') {
        // Week-end : vendredi 00:00 à dimanche 23:59
        where.startAt = {
          gte: weekendStartUTC,
          lte: weekendEndUTC,
        };
      } else {
        // Par défaut : événements futurs (si pas de scope spécifié)
        where.startAt = {
          gte: now,
        };
      }
    } else {
      // Si on a dateFrom/dateTo, on initialise startAt pour les dates personnalisées
      where.startAt = {};
    }

    // Filtres par catégorie
    if (filters.category) {
      where.category = filters.category;
    }

    // SPRINT 1: Filtre par tag unique (prioritaire sur tags multiple)
    if (filters.tag) {
      where.tags = {
        has: filters.tag,
      };
    } else if (filters.tags && filters.tags.length > 0) {
      // Filtres par tags multiples (si pas de tag unique)
      where.tags = {
        hasAll: filters.tags,
      };
    }

    // SPRINT 2: Filtres par tags structurés (EventTag)
    // Pour l'instant, on supporte un seul filtre EventTag à la fois
    // TODO: Implémenter support multiple filtres avec AND logique
    if (filters.genre) {
      where.eventTags = {
        some: {
          category: 'genre',
          value: filters.genre,
        },
      };
    } else if (filters.type) {
      where.eventTags = {
        some: {
          category: 'type',
          value: filters.type,
        },
      };
    } else if (filters.ambiance) {
      where.eventTags = {
        some: {
          category: 'ambiance',
          value: filters.ambiance,
        },
      };
    } else if (filters.public) {
      where.eventTags = {
        some: {
          category: 'public',
          value: filters.public,
        },
      };
    }

    // Filtres par dates (SPRINT 2: Support dates personnalisées)
    // Ces filtres ont priorité sur scope
    if (filters.dateFrom) {
      try {
        const dateFrom = new Date(filters.dateFrom);
        if (!isNaN(dateFrom.getTime())) {
          // Si c'est juste une date (sans heure), commencer à 00:00:00
          if (filters.dateFrom.length === 10) {
            dateFrom.setHours(0, 0, 0, 0);
          }
          if (!where.startAt) {
            where.startAt = {};
          }
          where.startAt.gte = dateFrom;
        }
      } catch (e) {
        console.error('Erreur parsing dateFrom:', filters.dateFrom, e);
      }
    }
    if (filters.dateTo) {
      try {
        const dateTo = new Date(filters.dateTo);
        if (!isNaN(dateTo.getTime())) {
          // Si c'est juste une date (sans heure), terminer à 23:59:59
          if (filters.dateTo.length === 10) {
            dateTo.setHours(23, 59, 59, 999);
          }
          if (!where.startAt) {
            where.startAt = {};
          }
          where.startAt.lte = dateTo;
        }
      } catch (e) {
        console.error('Erreur parsing dateTo:', filters.dateTo, e);
      }
    }
    
    // S'assurer qu'on a au moins un filtre de date si aucun n'a été défini
    // (Cela ne devrait jamais arriver car on l'a déjà défini plus haut, mais sécurité)
    if (!where.startAt || (typeof where.startAt === 'object' && Object.keys(where.startAt).length === 0)) {
      where.startAt = {
        gte: now, // Par défaut : événements futurs
      };
    }
    
    // Validation : s'assurer que where.startAt a au moins une propriété valide
    if (where.startAt && typeof where.startAt === 'object') {
      const startAtKeys = Object.keys(where.startAt);
      if (startAtKeys.length === 0) {
        // Si vide, ajouter au moins gte
        where.startAt.gte = now;
      }
      // S'assurer que les dates sont des objets Date valides
      if (where.startAt.gte && !(where.startAt.gte instanceof Date)) {
        where.startAt.gte = new Date(where.startAt.gte);
      }
      if (where.startAt.lte && !(where.startAt.lte instanceof Date)) {
        where.startAt.lte = new Date(where.startAt.lte);
      }
    }

    // Filtres par prix
    if (filters.free) {
      // Pour les événements gratuits, on utilise une condition OR
      // Utiliser OR directement dans where au lieu de where.OR pour éviter les conflits
      if (!where.OR) {
        where.OR = [
          { priceMin: 0 },
          { priceMin: null }
        ];
      } else {
        // Si on a déjà un OR, on doit combiner avec AND
        const existingOr = Array.isArray(where.OR) ? where.OR : [where.OR];
        where.AND = [
          { OR: existingOr },
          { OR: [
            { priceMin: 0 },
            { priceMin: null }
          ]}
        ];
        delete where.OR;
      }
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
      // Pour la recherche, on utilise une condition OR
      const searchOr = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { tags: { has: filters.q } }
      ];
      
      // Si on a déjà un OR (pour free), on doit combiner avec AND
      if (where.OR && Array.isArray(where.OR)) {
        where.AND = [
          { OR: where.OR },
          { OR: searchOr }
        ];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    // SPRINT 1: Filtre géographique par distance (Haversine)
    // Support lat/lng (ou lat/lon) et radius (ou distanceKm)
    let distanceFilter: any = null;
    const userLat = filters.lat;
    const userLon = filters.lon || filters.lng; // SPRINT 1: support lng
    const radius = filters.radius || filters.distanceKm; // SPRINT 1: support radius
    
    if (userLat && userLon && radius) {
      distanceFilter = {
        lat: userLat,
        lon: userLon,
        distanceKm: radius,
      };
    }

    // Tri
    let orderBy: any = [{ startAt: 'asc' }];
    if (filters.sort === 'popularity') {
      orderBy = [{ favorites: { _count: 'desc' } }, { startAt: 'asc' }];
    }

    // Pagination
    const skip = (filters.page - 1) * filters.pageSize;

    // Log de débogage pour la structure where (en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Structure where:', JSON.stringify(where, null, 2));
    }

    // Exécuter la requête (utilise 'now' défini plus haut)
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
              status: PromotionStatus.ACTIVE,
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
            orderBy: {
              kind: 'asc', // Priorité: HOMEPAGE > LIST_TOP > MAP_TOP
            },
          },
          eventTags: true,
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

    // Trier par promotions actives en priorité
    // Les événements avec promotions actives apparaissent en premier
    const sortedByPromotions = [...filteredEvents].sort((a, b) => {
      const aHasPromotion = a.promotions && a.promotions.length > 0;
      const bHasPromotion = b.promotions && b.promotions.length > 0;
      
      if (aHasPromotion && !bHasPromotion) return -1;
      if (!aHasPromotion && bHasPromotion) return 1;
      
      // Si les deux ont des promotions, trier par type de promotion
      if (aHasPromotion && bHasPromotion) {
        const aKind = a.promotions[0]?.kind || '';
        const bKind = b.promotions[0]?.kind || '';
        const kindOrder: Record<string, number> = {
          'HOMEPAGE': 0,
          'LIST_TOP': 1,
          'MAP_TOP': 2,
        };
        return (kindOrder[aKind] || 999) - (kindOrder[bKind] || 999);
      }
      
      return 0;
    });

    // Si recherche par proximité, trier par distance
    let sortedEvents = sortedByPromotions;
    if (filters.sort === 'proximity' && filters.lat && filters.lon) {
      sortedEvents = sortedByPromotions
        .map(event => ({
          ...event,
          distance: event.venue ? calculateDistance(
            filters.lat!,
            filters.lon!,
            event.venue.lat,
            event.venue.lon
          ) : Infinity,
        }))
        .sort((a, b) => {
          // Garder la priorité des promotions même avec le tri par distance
          const aHasPromotion = a.promotions && a.promotions.length > 0;
          const bHasPromotion = b.promotions && b.promotions.length > 0;
          if (aHasPromotion && !bHasPromotion) return -1;
          if (!aHasPromotion && bHasPromotion) return 1;
          return a.distance - b.distance;
        });
    } else if (distanceFilter) {
      // Ajouter la distance même si on ne trie pas par proximité
      sortedEvents = sortedByPromotions.map(event => ({
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

    // Headers de cache pour améliorer les performances
    const response = NextResponse.json({
      items: sortedEvents,
      total: finalTotal,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(finalTotal / filters.pageSize),
    });

    // Headers de cache pour améliorer les performances
    // Cache public pendant 2 minutes, stale-while-revalidate pour 10 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    response.headers.set('X-Cache-Status', 'MISS'); // Sera mis à jour par le CDN si en cache

    return response;

  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    // Logger plus de détails pour le débogage
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      // Si c'est une erreur Prisma, logger les détails
      if ('code' in error) {
        console.error('Code d\'erreur Prisma:', (error as any).code);
        console.error('Meta Prisma:', (error as any).meta);
      }
    }
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération des événements',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
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
      const venueInput = { ...eventData.venue };
      let lat = venueInput.lat;
      let lon = venueInput.lon;

      if (
        lat === undefined ||
        lon === undefined ||
        Number.isNaN(lat) ||
        Number.isNaN(lon)
      ) {
        const coords =
          (await geocodeAddress({
            address: venueInput.address,
            city: venueInput.city,
            postalCode: venueInput.postalCode,
          })) || getDefaultCoordinates();
        lat = coords.lat;
        lon = coords.lon;
      }

      const venue = await prisma.venue.create({
        data: {
          ...venueInput,
          lat,
          lon,
        },
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

    // Enrichir l'événement avec des tags structurés
    try {
      await enrichEventWithTags(event.id);
    } catch (error) {
      console.error(
        'Erreur lors de l’enrichissement des tags structurés pour le nouvel événement:',
        error,
      );
    }

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
