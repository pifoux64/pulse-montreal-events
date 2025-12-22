'use client';

/**
 * Wrapper client pour EventCard dans les pages Top 5
 * Permet d'utiliser useFavorites côté client
 */

import { useFavorites } from '@/hooks/useFavorites';
import EventCard from './EventCard';

interface Top5EventCardWrapperProps {
  event: any;
}

export default function Top5EventCardWrapper({ event }: Top5EventCardWrapperProps) {
  const { toggleFavorite, isFavorite, isFavoriteLoading } = useFavorites();

  return (
    <EventCard
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.description?.substring(0, 100) + '...',
        startDate: new Date(event.startAt),
        endDate: event.endAt ? new Date(event.endAt) : null,
        location: {
          name: event.venue?.name || 'Lieu à confirmer',
          address: event.venue?.address || '',
          city: event.venue?.city || 'Montréal',
          postalCode: '',
          coordinates: {
            lat: event.venue?.lat ?? 45.5088,
            lng: event.venue?.lon ?? -73.5542,
          },
        },
        category: event.category,
        subCategory: event.eventTags?.find((t: any) => t.category === 'genre')?.value || '',
        tags: event.tags || [],
        price: {
          amount: event.priceMin != null ? event.priceMin / 100 : 0,
          currency: event.currency || 'CAD',
          isFree: event.priceMin === 0 && event.priceMin != null, // Gratuit seulement si explicitement 0
        },
        imageUrl: event.imageUrl,
        ticketUrl: event.url || '#',
        organizerId: 'default',
        organizer: {
          id: 'default',
          email: 'api@pulse.com',
          name: 'Pulse',
          role: 'organizer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        customFilters: [],
        accessibility: [],
        status: 'published',
        source: 'pulse-picks',
        externalId: event.id,
        language: 'fr',
        minAttendees: 0,
        maxAttendees: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }}
      onFavoriteToggle={async () => {
        await toggleFavorite(event.id);
      }}
      isFavorite={isFavorite(event.id)}
      isFavoriteLoading={isFavoriteLoading(event.id)}
      showImage={true}
    />
  );
}

