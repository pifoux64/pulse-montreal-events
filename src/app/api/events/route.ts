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
import { EventCategory, EventLanguage, EventStatus, UserRole, PromotionStatus, NotificationType } from '@prisma/client';
import { enrichEventWithTags } from '@/lib/tagging/eventTaggingService';
import { normalizeUrl } from '@/lib/utils';
import { sendEmailViaResend } from '@/lib/email/resend';

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
  longDescription: z.string().optional(), // SPRINT 4: Description longue pour Facebook/Eventbrite
  lineup: z.array(z.string()).optional(), // SPRINT 4: Liste d'artistes pour RA/Bandsintown
  startAt: z.string().transform((s) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw new Error('Date de début invalide');
    return d.toISOString();
  }),
  endAt: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return undefined;
      return d.toISOString();
    }),
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
    website: z.string()
      .transform((val) => val ? normalizeUrl(val) || val : val)
      .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
      .optional(),
  }).optional(),
  url: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
    .optional(),
  sourceUrl: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL source invalide')
    .optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  currency: z.string().length(3).default('CAD'),
  language: z.nativeEnum(EventLanguage).default(EventLanguage.FR),
  imageUrl: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
    .optional(),
  tags: z.array(z.string()).default([]),
  category: z.nativeEnum(EventCategory),
  subcategory: z.string().optional(),
  accessibility: z.array(z.string()).default([]),
  ageRestriction: z.string().optional(),
  ticketUrl: z.string()
    .transform((val) => val ? normalizeUrl(val) || val : val)
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'URL invalide')
    .optional(),
  musicUrls: z.object({
    spotifyUrl: z.string().optional().or(z.literal('')),
    youtubeUrl: z.string().optional().or(z.literal('')),
    soundcloudUrl: z.string().optional().or(z.literal('')),
    mixcloudUrl: z.string().optional().or(z.literal('')),
  }).optional(),
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
  futureOnly: z.boolean().optional(), // Si true, ne retourne que les événements futurs (par défaut: true = uniquement futurs)
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
      // Par défaut: uniquement les événements futurs (futureOnly=true). Passer futureOnly=false pour inclure les passés.
      futureOnly: params.futureOnly === 'false' ? false : true,
    });

    // SPRINT 1: Logique temporelle selon scope (timezone Montréal)
    // Les dates dans la DB sont en UTC, on filtre selon l'heure locale de Montréal
    const montrealTimezone = 'America/Montreal';
    const now = new Date();
    
    // Fonction helper pour obtenir les composants de date en timezone Montréal
    const getMontrealDateParts = (date: Date) => {
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
      return {
        year: parseInt(parts.find(p => p.type === 'year')!.value),
        month: parseInt(parts.find(p => p.type === 'month')!.value) - 1,
        day: parseInt(parts.find(p => p.type === 'day')!.value),
        hour: parseInt(parts.find(p => p.type === 'hour')!.value),
        minute: parseInt(parts.find(p => p.type === 'minute')!.value),
        second: parseInt(parts.find(p => p.type === 'second')!.value),
      };
    };
    
    // Fonction pour créer une date UTC à partir d'une date/heure locale de Montréal
    // Méthode simple : créer une date UTC de test et ajuster jusqu'à ce que les composants correspondent
    const createUTCDateFromMontreal = (year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date => {
      // Créer une string ISO pour cette date/heure
      const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      
      // Créer une date de test en UTC
      let testDate = new Date(isoString + 'Z');
      
      // Vérifier ce que cette date représente en Montréal
      let montrealParts = getMontrealDateParts(testDate);
      
      // Ajuster si nécessaire (maximum 3 tentatives pour éviter les boucles infinies)
      let attempts = 0;
      while ((montrealParts.year !== year || montrealParts.month !== month || montrealParts.day !== day || 
              montrealParts.hour !== hour || montrealParts.minute !== minute) && attempts < 3) {
        // Calculer la différence
        const diffHours = hour - montrealParts.hour;
        const diffDays = day - montrealParts.day;
        const diffMinutes = minute - montrealParts.minute;
        
        // Ajuster la date
        testDate = new Date(testDate.getTime() + (diffHours * 60 + diffDays * 24 * 60 + diffMinutes) * 60 * 1000);
        montrealParts = getMontrealDateParts(testDate);
        attempts++;
      }
      
      // Vérifier que la date est valide
      if (isNaN(testDate.getTime())) {
        // Fallback : utiliser l'offset moyen pour Montréal (UTC-5)
        return new Date(Date.UTC(year, month, day, hour + 5, minute, second));
      }
      
      return testDate;
    };
    
    // Obtenir les composants de la date actuelle en timezone Montréal
    const nowParts = getMontrealDateParts(now);
    
    // Aujourd'hui : début et fin de journée (timezone Montréal) en UTC
    let todayStartUTC = createUTCDateFromMontreal(nowParts.year, nowParts.month, nowParts.day, 0, 0, 0);
    let todayEndUTC = createUTCDateFromMontreal(nowParts.year, nowParts.month, nowParts.day, 23, 59, 59);
    
    // Calculer le week-end (vendredi 00:00 à dimanche 23:59) en timezone Montréal
    // Obtenir le jour de la semaine de manière fiable en utilisant les composants de date en timezone Montréal
    // Méthode 1 : Utiliser toLocaleString avec timezone Montréal
    const montrealWeekday = now.toLocaleString('en-US', { 
      timeZone: montrealTimezone, 
      weekday: 'long' 
    });
    
    // Convertir le nom du jour en nombre (0=dimanche, 1=lundi, ..., 6=samedi)
    const weekdayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const dayOfWeekFromString = weekdayMap[montrealWeekday] ?? 0;
    
    // Méthode 2 : Créer une date locale avec les composants Montréal et obtenir son jour
    // Cette méthode est plus fiable car elle utilise directement les composants de date en timezone Montréal
    const montrealLocalDate = new Date(nowParts.year, nowParts.month, nowParts.day);
    const dayOfWeekFromLocal = montrealLocalDate.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi
    
    // Utiliser dayOfWeekFromLocal comme source principale (plus fiable)
    // dayOfWeekFromString sert de vérification
    const finalDayOfWeek = dayOfWeekFromLocal;
    
    // Log de débogage si les deux méthodes donnent des résultats différents
    if (dayOfWeekFromString !== dayOfWeekFromLocal) {
      console.warn('⚠️ Incohérence dans le calcul du jour de la semaine:', {
        fromString: dayOfWeekFromString,
        fromLocal: dayOfWeekFromLocal,
        montrealWeekday,
        nowParts,
      });
    }
    
    let weekendStartUTC: Date;
    let weekendEndUTC: Date;
    
    // Calculer le week-end en utilisant les dates UTC créées avec createUTCDateFromMontreal
    if (finalDayOfWeek === 0) {
      // Dimanche : week-end actuel (vendredi passé à dimanche actuel)
      // Calculer vendredi (2 jours avant)
      const fridayParts = { ...nowParts };
      fridayParts.day -= 2;
      // Gérer le cas où on passe au mois précédent
      if (fridayParts.day < 1) {
        fridayParts.month -= 1;
        if (fridayParts.month < 0) {
          fridayParts.month = 11;
          fridayParts.year -= 1;
        }
        const daysInPrevMonth = new Date(fridayParts.year, fridayParts.month + 1, 0).getDate();
        fridayParts.day = daysInPrevMonth + fridayParts.day;
      }
      weekendStartUTC = createUTCDateFromMontreal(fridayParts.year, fridayParts.month, fridayParts.day, 0, 0, 0);
      weekendEndUTC = todayEndUTC;
    } else if (finalDayOfWeek >= 5) {
      // Vendredi ou samedi : week-end actuel
      if (finalDayOfWeek === 6) {
        // Samedi : vendredi était hier
        const fridayParts = { ...nowParts };
        fridayParts.day -= 1;
        if (fridayParts.day < 1) {
          fridayParts.month -= 1;
          if (fridayParts.month < 0) {
            fridayParts.month = 11;
            fridayParts.year -= 1;
          }
          const daysInPrevMonth = new Date(fridayParts.year, fridayParts.month + 1, 0).getDate();
          fridayParts.day = daysInPrevMonth;
        }
        weekendStartUTC = createUTCDateFromMontreal(fridayParts.year, fridayParts.month, fridayParts.day, 0, 0, 0);
      } else {
        // Vendredi : aujourd'hui
        weekendStartUTC = todayStartUTC;
      }
      // Dimanche = vendredi + 2 jours
      const sundayParts = { ...nowParts };
      if (finalDayOfWeek === 5) {
        // Vendredi : dimanche = +2 jours
        sundayParts.day += 2;
      } else {
        // Samedi : dimanche = +1 jour
        sundayParts.day += 1;
      }
      // Gérer le cas où on passe au mois suivant
      const daysInMonth = new Date(sundayParts.year, sundayParts.month + 1, 0).getDate();
      if (sundayParts.day > daysInMonth) {
        sundayParts.day -= daysInMonth;
        sundayParts.month += 1;
        if (sundayParts.month > 11) {
          sundayParts.month = 0;
          sundayParts.year += 1;
        }
      }
      weekendEndUTC = createUTCDateFromMontreal(sundayParts.year, sundayParts.month, sundayParts.day, 23, 59, 59);
    } else {
      // Lundi à jeudi : week-end prochain
      const daysUntilFriday = 5 - finalDayOfWeek;
      const fridayParts = { ...nowParts };
      fridayParts.day += daysUntilFriday;
      // Gérer le cas où on passe au mois suivant
      const daysInMonth = new Date(fridayParts.year, fridayParts.month + 1, 0).getDate();
      if (fridayParts.day > daysInMonth) {
        fridayParts.day -= daysInMonth;
        fridayParts.month += 1;
        if (fridayParts.month > 11) {
          fridayParts.month = 0;
          fridayParts.year += 1;
        }
      }
      weekendStartUTC = createUTCDateFromMontreal(fridayParts.year, fridayParts.month, fridayParts.day, 0, 0, 0);
      
      // Dimanche = vendredi + 2 jours
      const sundayParts = { ...fridayParts };
      sundayParts.day += 2;
      const daysInMonthSunday = new Date(sundayParts.year, sundayParts.month + 1, 0).getDate();
      if (sundayParts.day > daysInMonthSunday) {
        sundayParts.day -= daysInMonthSunday;
        sundayParts.month += 1;
        if (sundayParts.month > 11) {
          sundayParts.month = 0;
          sundayParts.year += 1;
        }
      }
      weekendEndUTC = createUTCDateFromMontreal(sundayParts.year, sundayParts.month, sundayParts.day, 23, 59, 59);
    }
    
    // Vérifier que les dates sont valides
    if (isNaN(todayStartUTC.getTime()) || isNaN(todayEndUTC.getTime())) {
      console.error('❌ Dates invalides pour today:', { todayStartUTC, todayEndUTC });
      // Fallback : utiliser maintenant comme date de début
      todayStartUTC = new Date(now);
      todayStartUTC.setUTCHours(0, 0, 0, 0);
      todayEndUTC = new Date(now);
      todayEndUTC.setUTCHours(23, 59, 59, 999);
    }
    
    if (isNaN(weekendStartUTC.getTime()) || isNaN(weekendEndUTC.getTime())) {
      console.error('❌ Dates invalides pour weekend:', { weekendStartUTC, weekendEndUTC });
      // Fallback : utiliser aujourd'hui comme week-end
      weekendStartUTC = new Date(todayStartUTC);
      weekendEndUTC = new Date(todayEndUTC);
    }
    
    // Log pour déboguer
    if (filters.scope === 'weekend') {
      const nowMontrealStr = now.toLocaleString('fr-CA', { timeZone: montrealTimezone, weekday: 'long' });
      const weekendStartMontreal = weekendStartUTC.toLocaleString('fr-CA', { timeZone: montrealTimezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const weekendEndMontreal = weekendEndUTC.toLocaleString('fr-CA', { timeZone: montrealTimezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      console.log('🔍 Debug weekend:', {
        jourActuel: nowMontrealStr,
        nowParts: nowParts,
        dayOfWeek: finalDayOfWeek,
        weekendStartUTC: weekendStartUTC.toISOString(),
        weekendStartMontreal: weekendStartMontreal,
        weekendEndUTC: weekendEndUTC.toISOString(),
        weekendEndMontreal: weekendEndMontreal,
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
        // Par défaut : uniquement les événements futurs (futureOnly=true). Si futureOnly=false, pas de filtre date.
        if (filters.futureOnly !== false) {
          where.startAt = {
            gte: now,
          };
        }
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
    
    // Par défaut (scope all, pas de dateFrom/dateTo) : uniquement futurs sauf si futureOnly=false
    if (!where.startAt || (typeof where.startAt === 'object' && Object.keys(where.startAt).length === 0)) {
      if (filters.futureOnly !== false) {
        where.startAt = {
          gte: now,
        };
      }
    }
    
    // Validation : s'assurer que where.startAt a au moins une propriété valide
    if (where.startAt && typeof where.startAt === 'object') {
      const startAtKeys = Object.keys(where.startAt);
      if (startAtKeys.length === 0 && filters.futureOnly !== false) {
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
    // Par défaut : événements futurs en premier (triés par date croissante), puis événements passés (triés par date décroissante)
    // On ne peut pas faire cela directement avec Prisma, donc on triera après la requête
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
    let events, total;
    try {
      [events, total] = await Promise.all([
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
    } catch (prismaError) {
      console.error('❌ Erreur Prisma lors de la requête:', prismaError);
      if (prismaError instanceof Error) {
        console.error('Message:', prismaError.message);
        console.error('Stack:', prismaError.stack);
      }
      if (prismaError && typeof prismaError === 'object' && 'code' in prismaError) {
        console.error('Code Prisma:', (prismaError as any).code);
        console.error('Meta Prisma:', JSON.stringify((prismaError as any).meta, null, 2));
      }
      // Re-lancer l'erreur pour qu'elle soit capturée par le catch global
      throw prismaError;
    }

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

    // Trier les événements : futurs en premier (par date croissante), puis passés (par date décroissante)
    const nowForSort = new Date();
    const futureEvents = sortedByPromotions.filter(e => new Date(e.startAt) >= nowForSort);
    const pastEvents = sortedByPromotions.filter(e => new Date(e.startAt) < nowForSort);
    
    // Trier les événements futurs par date croissante, et les passés par date décroissante
    futureEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    pastEvents.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    
    // Combiner : futurs en premier, puis passés
    const sortedByTime = [...futureEvents, ...pastEvents];

    // Si recherche par proximité, trier par distance
    let sortedEvents = sortedByTime;
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
    console.error('❌ Erreur lors de la récupération des événements:', error);
    // Logger plus de détails pour le débogage
    if (error instanceof Error) {
      console.error('📝 Message d\'erreur:', error.message);
      console.error('📍 Stack trace:', error.stack);
      // Si c'est une erreur Prisma, logger les détails
      if ('code' in error) {
        console.error('🔑 Code d\'erreur Prisma:', (error as any).code);
        console.error('📊 Meta Prisma:', JSON.stringify((error as any).meta, null, 2));
      }
    }
    
    // Détecter les erreurs de connexion à la base de données
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorCode = (error as any)?.code;
    
    const isDatabaseError = 
      errorMessage.includes('Can\'t reach database server') || 
                            errorMessage.includes('database server') ||
                            errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorCode === 'P1001' || // Can't reach database server
      errorCode === 'P1002' || // Database server closed the connection
      errorCode === 'P1003' || // Database does not exist
      errorCode === 'P1017';   // Server has closed the connection
    
    // Détecter si l'URL est une URL directe (db.xxx.supabase.co) au lieu d'un pooler
    const isDirectConnection = errorMessage.includes('db.') && errorMessage.includes('.supabase.co:5432');
    const databaseUrl = process.env.DATABASE_URL || '';
    const hasDirectUrl = databaseUrl.includes('db.') && databaseUrl.includes('.supabase.co:5432');
    const hasPoolerUrl = databaseUrl.includes('.pooler.supabase.com') || databaseUrl.includes(':6543');
    
    let helpMessage = 'Consultez docs/VERCEL_SUPABASE_SETUP.md pour la configuration';
    if (isDirectConnection || (hasDirectUrl && !databaseUrl.includes(':6543'))) {
      helpMessage = '⚠️ Vous utilisez une URL DIRECTE (db.xxx.supabase.co:5432) au lieu d\'un POOLER. Sur Vercel, vous DEVEZ utiliser l\'URL du pooler (xxx.pooler.supabase.com) ou le port 6543. Consultez docs/VERCEL_SUPABASE_SETUP.md';
    } else if (!hasPoolerUrl && !databaseUrl.includes(':6543') && isDatabaseError) {
      helpMessage = '⚠️ Votre DATABASE_URL ne semble pas utiliser le pooler Supabase. Consultez docs/VERCEL_SUPABASE_SETUP.md pour utiliser l\'URL du pooler ou le port 6543.';
    }
    
    // Logger l'environnement pour le débogage (sans exposer les secrets)
    console.error('🌍 Environnement:', {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlFormat: databaseUrl ? (databaseUrl.includes('pooler') ? 'pooler' : databaseUrl.includes(':6543') ? 'transaction-mode' : 'direct') : 'missing',
      errorCode,
    });
    
    return NextResponse.json(
      { 
        error: isDatabaseError 
          ? 'Erreur de connexion à la base de données. Veuillez vérifier la configuration DATABASE_URL sur Vercel.'
          : 'Erreur serveur lors de la récupération des événements',
        details: errorMessage,
        errorCode: errorCode || undefined,
        ...(isDatabaseError ? {
          help: helpMessage,
          ...(isDirectConnection || (hasDirectUrl && !databaseUrl.includes(':6543')) ? {
            issue: 'URL_DIRECTE_DETECTEE',
            solution: 'Utilisez l\'URL du pooler Supabase (xxx.pooler.supabase.com) ou le port 6543 au lieu de l\'URL directe (db.xxx.supabase.co:5432)'
          } : {})
        } : {})
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
    
    if (session.user.role === UserRole.ORGANIZER && session.user.organizer) {
      requireVerifiedOrganizer(session.user.organizer);
    }

    const body = await request.json();
    const eventData = CreateEventSchema.parse(body);

    // Créer ou récupérer le venue (réutiliser une salle existante si même nom + ville)
    let venueId = eventData.venueId;
    if (!venueId && eventData.venue) {
      const venueInput = { ...eventData.venue };
      const nameNorm = venueInput.name?.trim() || '';
      const cityNorm = venueInput.city?.trim() || '';

      const existingVenue = nameNorm && cityNorm
        ? await prisma.venue.findFirst({
            where: {
              name: { equals: nameNorm, mode: 'insensitive' },
              city: { equals: cityNorm, mode: 'insensitive' },
            },
            select: { id: true },
          })
        : null;

      if (existingVenue) {
        venueId = existingVenue.id;
      } else {
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

    // Enregistrer les nouveaux tags en base (TagDefinition) pour les prochaines fois
    const { ensureTagDefinitions } = await import('@/lib/tagging/ensureTagDefinitions');
    await ensureTagDefinitions(allTags);

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

    // SPRINT 4: Stocker longDescription, lineup et URLs musicales dans EventFeature
    const featuresToCreate: Array<{ eventId: string; featureKey: string; featureValue: any }> = [];
    
    if (eventData.longDescription) {
      featuresToCreate.push({
        eventId: event.id,
        featureKey: 'longDescription',
        featureValue: eventData.longDescription,
      });
    }
    
    if (eventData.lineup && eventData.lineup.length > 0) {
      featuresToCreate.push({
        eventId: event.id,
        featureKey: 'lineup',
        featureValue: eventData.lineup,
      });
    }
    
    // URLs musicales
    if ((eventData as any).musicUrls) {
      const musicUrls = (eventData as any).musicUrls;
      if (musicUrls.spotifyUrl && musicUrls.spotifyUrl.trim()) {
        featuresToCreate.push({
          eventId: event.id,
          featureKey: 'spotifyUrl',
          featureValue: musicUrls.spotifyUrl.trim(),
        });
      }
      if (musicUrls.youtubeUrl && musicUrls.youtubeUrl.trim()) {
        featuresToCreate.push({
          eventId: event.id,
          featureKey: 'youtubeUrl',
          featureValue: musicUrls.youtubeUrl.trim(),
        });
      }
      if (musicUrls.soundcloudUrl && musicUrls.soundcloudUrl.trim()) {
        featuresToCreate.push({
          eventId: event.id,
          featureKey: 'soundcloudUrl',
          featureValue: musicUrls.soundcloudUrl.trim(),
        });
      }
      if (musicUrls.mixcloudUrl && musicUrls.mixcloudUrl.trim()) {
        featuresToCreate.push({
          eventId: event.id,
          featureKey: 'mixcloudUrl',
          featureValue: musicUrls.mixcloudUrl.trim(),
        });
      }
    }
    
    if (featuresToCreate.length > 0) {
      await prisma.eventFeature.createMany({
        data: featuresToCreate,
      });
    }

    // Stocker source_url si fourni (URL d'origine de l'import)
    if (eventData.sourceUrl) {
      try {
        await prisma.eventSourceLink.create({
          data: {
            eventId: event.id,
            source: 'INTERNAL', // Source manuelle
            sourceUrl: eventData.sourceUrl,
            isPrimary: false,
          },
        });
      } catch (error) {
        // Logger mais ne pas faire échouer la création
        console.warn('Erreur lors de la création du lien source:', error);
      }
    }

    // SPRINT 6: Notifier les followers de l'organisateur (notifications + emails)
    try {
      const followers = await prisma.organizerFollow.findMany({
        where: { organizerId: organizer.id },
        include: {
          user: {
            include: {
              preferences: true,
            },
            select: {
              id: true,
              email: true,
              name: true,
              preferences: {
                select: {
                  notificationsEmail: true,
                },
              },
            },
          },
        },
      });

      if (followers.length > 0) {
        // Créer les notifications dans la base
        const notifications = followers.map((follow) => ({
          userId: follow.userId,
          eventId: event.id,
          type: 'SYSTEM' as const,
          title: `Nouvel événement de ${organizer.displayName}`,
          body: `${event.title} vient d'être créé.`,
          data: {
            organizerId: organizer.id,
            organizerName: organizer.displayName,
          },
        }));

        await prisma.notification.createMany({
          data: notifications,
        });

        // Envoyer les emails aux followers qui ont activé les notifications email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-mtl.vercel.app';
        const eventUrl = `${appUrl}/evenement/${event.id}`;
        // Construire l'URL de l'organisateur (slug peut être null)
        const organizerSlug = (organizer as any).slug;
        const organizerUrl = organizerSlug && organizerSlug.trim() 
          ? `${appUrl}/organisateur/${organizerSlug}`
          : `${appUrl}/organisateur/${organizer.id}`;

        // Formater la date
        const eventDate = new Date(event.startAt);
        const formattedDate = eventDate.toLocaleDateString('fr-CA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Montreal',
        });

        // Formater le prix
        let priceText = 'Gratuit';
        if (event.priceMin !== null && event.priceMin !== undefined) {
          if (event.priceMin === 0) {
            priceText = 'Gratuit';
          } else {
            const priceMinCAD = (event.priceMin / 100).toFixed(2);
            if (event.priceMax && event.priceMax !== event.priceMin) {
              const priceMaxCAD = (event.priceMax / 100).toFixed(2);
              priceText = `${priceMinCAD}$ - ${priceMaxCAD}$ CAD`;
            } else {
              priceText = `${priceMinCAD}$ CAD`;
            }
          }
        }

        // Envoyer les emails en arrière-plan (ne pas bloquer la réponse)
        Promise.all(
          followers
            .filter((follow) => {
              // Filtrer les utilisateurs qui ont activé les notifications email
              const prefs = follow.user.preferences;
              return prefs?.notificationsEmail !== false && follow.user.email;
            })
            .map(async (follow) => {
              if (!follow.user.email) return;

              const userName = follow.user.name || 'utilisateur';
              const subject = `🎉 Nouvel événement : ${event.title} - ${organizer.displayName}`;
              
              const html = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nouvel événement !</h1>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                      <p style="font-size: 16px; margin-bottom: 20px;">
                        Bonjour ${userName},
                      </p>
                      
                      <p style="font-size: 16px; margin-bottom: 20px;">
                        <strong>${organizer.displayName}</strong> vient de publier un nouvel événement que vous pourriez aimer :
                      </p>
                      
                      <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                        ${event.imageUrl ? `
                          <img src="${event.imageUrl}" alt="${event.title}" style="width: 100%; border-radius: 8px; margin-bottom: 15px; max-height: 300px; object-fit: cover;">
                        ` : ''}
                        
                        <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">${event.title}</h2>
                        
                        <p style="color: #6b7280; margin: 10px 0;">
                          📅 <strong>Date :</strong> ${formattedDate}
                        </p>
                        
                        ${event.venue ? `
                          <p style="color: #6b7280; margin: 10px 0;">
                            📍 <strong>Lieu :</strong> ${event.venue.name}
                            ${event.venue.address ? `<br>${event.venue.address}, ${event.venue.city}` : ''}
                          </p>
                        ` : ''}
                        
                        <p style="color: #6b7280; margin: 10px 0;">
                          💰 <strong>Prix :</strong> ${priceText}
                        </p>
                        
                        ${event.description ? `
                          <p style="color: #4b5563; margin: 15px 0; line-height: 1.6;">
                            ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}
                          </p>
                        ` : ''}
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Voir l'événement
                        </a>
                      </div>
                      
                      <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        Vous recevez cet email car vous suivez <strong>${organizer.displayName}</strong> sur Pulse Montréal.
                        <br>
                        <a href="${organizerUrl}" style="color: #667eea; text-decoration: none;">Voir le profil de l'organisateur</a>
                      </p>
                      
                      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px; text-align: center;">
                        Pulse Montréal - Votre guide des événements à Montréal
                        <br>
                        <a href="${appUrl}" style="color: #9ca3af; text-decoration: none;">${appUrl}</a>
                      </p>
                    </div>
                  </body>
                </html>
              `;

              const text = `
Bonjour ${userName},

${organizer.displayName} vient de publier un nouvel événement :

${event.title}
📅 Date : ${formattedDate}
${event.venue ? `📍 Lieu : ${event.venue.name}${event.venue.address ? `, ${event.venue.address}, ${event.venue.city}` : ''}` : ''}
💰 Prix : ${priceText}

${event.description ? `${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}` : ''}

Voir l'événement : ${eventUrl}

Vous recevez cet email car vous suivez ${organizer.displayName} sur Pulse Montréal.
Voir le profil : ${organizerUrl}

---
Pulse Montréal - Votre guide des événements à Montréal
${appUrl}
              `;

              try {
                await sendEmailViaResend({
                  to: follow.user.email,
                  subject,
                  html,
                  text,
                });
              } catch (emailError) {
                // Logger l'erreur mais ne pas faire échouer la création de l'événement
                console.error(`Erreur lors de l'envoi de l'email à ${follow.user.email}:`, emailError);
              }
            })
        ).catch((error) => {
          // Logger l'erreur globale mais ne pas faire échouer
          console.error('Erreur lors de l\'envoi des emails aux followers:', error);
        });

        // Envoyer les notifications push si configuré
        // (Le push sera géré par le système de notifications existant)
      }
    } catch (error) {
      // Ne pas faire échouer la création de l'événement si les notifications échouent
      console.error('Erreur lors de la notification des followers:', error);
    }

    // Enrichir l'événement avec des tags structurés
    try {
      await enrichEventWithTags(event.id);
    } catch (error) {
      console.error(
        'Erreur lors de l\'enrichissement des tags structurés pour le nouvel événement:',
        error,
      );
    }

    return NextResponse.json(event, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: 'Données invalides', details: zodError.issues },
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
