'use client';

import { Event } from '@/types';
import EventCard from './EventCard';
import { useFavorites } from '@/hooks/useFavorites';

interface VenueEventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    startAt: Date;
    endAt: Date | null;
    imageUrl: string | null;
    url: string | null;
    priceMin: number | null;
    priceMax: number | null;
    currency: string;
    tags: string[];
    category: string;
    venue: {
      id: string;
      name: string;
      slug: string | null;
      address: string;
      city: string;
      postalCode: string;
      lat: number;
      lon: number;
    } | null;
    organizer: {
      user: {
        name: string | null;
      };
    } | null;
    _count: {
      favorites: number;
    };
  };
}

export default function VenueEventCard({ event }: VenueEventCardProps) {
  const { toggleFavorite, isFavorite, isFavoriteLoading } = useFavorites();

  // Convertir l'événement Prisma au format Event
  const eventData: Event = {
    id: event.id,
    title: event.title,
    description: event.description,
    shortDescription: event.description.substring(0, 100) + '...',
    startDate: new Date(event.startAt),
    endDate: event.endAt ? new Date(event.endAt) : new Date(event.startAt),
    location: event.venue
      ? {
          name: event.venue.name,
          address: event.venue.address,
          city: event.venue.city,
          postalCode: event.venue.postalCode,
          coordinates: {
            lat: event.venue.lat,
            lng: event.venue.lon,
          },
        }
      : null, // Ne pas créer de location par défaut - si venue est null, location sera null
    category: event.category,
    subCategory: undefined,
    tags: event.tags || [],
    price: event.priceMin != null || event.priceMax != null ? {
      amount: event.priceMin != null ? event.priceMin / 100 : (event.priceMax != null ? event.priceMax / 100 : 0),
      currency: event.currency || 'CAD',
      isFree: event.priceMin === 0 && event.priceMin != null,
    } : undefined, // Ne pas créer d'objet price si aucun prix n'est disponible
    imageUrl: event.imageUrl || undefined,
    ticketUrl: event.url || null,
    organizerId: event.organizer?.user?.name || 'default',
    organizer: {
      id: 'default',
      email: 'api@pulse.com',
      name: event.organizer?.user?.name || 'Organisateur',
      role: 'organizer',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: false,
      hearingAssistance: false,
      visualAssistance: false,
      quietSpace: false,
      signLanguage: false,
      audioDescription: false,
      braille: false,
    },
    targetAudience: [],
    maxCapacity: undefined,
    currentCapacity: 0,
    isFeatured: false,
    isVerified: false,
    rating: 0,
    reviewCount: 0,
    source: 'pulse',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Ajouter venueSlug si disponible
  if (event.venue && 'slug' in event.venue && event.venue.slug) {
    (eventData as any).venueSlug = event.venue.slug;
  }

  return (
    <EventCard
      event={eventData}
      onFavoriteToggle={async () => {
        await toggleFavorite(event.id);
      }}
      isFavorite={isFavorite(event.id)}
      isFavoriteLoading={isFavoriteLoading(event.id)}
      showImage={true}
    />
  );
}
