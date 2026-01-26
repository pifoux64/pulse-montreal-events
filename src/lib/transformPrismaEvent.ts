/**
 * Fonction utilitaire pour transformer un événement Prisma en format ApiEvent
 * pour utilisation avec transformApiEvent
 */

import { transformApiEvent } from '@/hooks/useEvents';
import { Event } from '@/types';

export function transformPrismaEventToEvent(prismaEvent: any): Event {
  // Convertir le format Prisma en format ApiEvent
  const apiEvent = {
    id: prismaEvent.id,
    title: prismaEvent.title,
    description: prismaEvent.description || '',
    startAt: prismaEvent.startAt instanceof Date 
      ? prismaEvent.startAt.toISOString() 
      : prismaEvent.startAt,
    endAt: prismaEvent.endAt 
      ? (prismaEvent.endAt instanceof Date 
          ? prismaEvent.endAt.toISOString() 
          : prismaEvent.endAt)
      : undefined,
    venue: prismaEvent.venue ? {
      name: prismaEvent.venue.name,
      address: prismaEvent.venue.address || undefined,
      city: prismaEvent.venue.city || undefined,
      lat: prismaEvent.venue.lat || 0,
      lon: prismaEvent.venue.lon || 0,
      slug: prismaEvent.venue.slug || undefined,
    } : undefined,
    address: prismaEvent.venue?.address,
    city: prismaEvent.venue?.city,
    category: prismaEvent.category,
    subcategory: prismaEvent.subcategory || undefined,
    tags: prismaEvent.tags || [],
    priceMin: prismaEvent.priceMin || undefined,
    priceMax: prismaEvent.priceMax || undefined,
    currency: prismaEvent.currency || 'CAD',
    imageUrl: prismaEvent.imageUrl || undefined,
    url: prismaEvent.url || undefined,
    organizerId: prismaEvent.organizerId || undefined,
    source: prismaEvent.source || 'INTERNAL',
    lat: prismaEvent.venue?.lat,
    lon: prismaEvent.venue?.lon,
    eventTags: prismaEvent.eventTags?.map((tag: any) => ({
      category: tag.category,
      value: tag.value,
    })) || [],
    promotions: prismaEvent.promotions?.map((p: any) => ({
      id: p.id,
      kind: p.kind,
      status: p.status,
      startsAt: p.startsAt instanceof Date ? p.startsAt.toISOString() : p.startsAt,
      endsAt: p.endsAt instanceof Date ? p.endsAt.toISOString() : p.endsAt,
    })) || [],
  };

  return transformApiEvent(apiEvent);
}
