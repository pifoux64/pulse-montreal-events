import { Event, Organizer, Venue } from '@prisma/client';

interface EventWithRelations extends Event {
  organizer?: Organizer | null;
  venue?: Venue | null;
}

interface VenueWithRelations extends Venue {
  owner?: { id: string; name: string | null } | null;
  _count?: { events: number } | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NODE_ENV === 'production' ? 'https://pulse-mtl.vercel.app' : 'http://localhost:3000');

const formatPrice = (cents?: number | null) => {
  if (typeof cents !== 'number') return undefined;
  return Number((cents / 100).toFixed(2));
};

export const buildEventJsonLd = (event: EventWithRelations) => {
  const startDateISO = event.startAt?.toISOString?.() ?? new Date(event.startAt).toISOString();
  const endDateISO = event.endAt ? new Date(event.endAt).toISOString() : undefined;

  const baseJson: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${SITE_URL}/evenement/${event.id}#event`,
    name: event.title,
    description: event.description,
    startDate: startDateISO,
    eventStatus: event.status === 'CANCELLED' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.venue ? 'https://schema.org/OfflineEventAttendanceMode' : 'https://schema.org/OnlineEventAttendanceMode',
    image: event.imageUrl ? [event.imageUrl] : undefined,
    inLanguage: event.language === 'FR' ? 'fr-CA' : event.language === 'EN' ? 'en-CA' : 'fr-CA',
    location: event.venue
      ? {
          '@type': 'Place',
          name: event.venue.name,
          address: event.venue
            ? {
                '@type': 'PostalAddress',
                streetAddress: event.venue.address,
                addressLocality: event.venue.city,
                postalCode: event.venue.postalCode,
                addressCountry: 'CA',
              }
            : undefined,
          geo:
            typeof event.venue?.lat === 'number' && typeof event.venue?.lon === 'number'
              ? {
                  '@type': 'GeoCoordinates',
                  latitude: event.venue.lat,
                  longitude: event.venue.lon,
                }
              : undefined,
        }
      : undefined,
    organizer: event.organizer
      ? {
          '@type': 'Organization',
          name: event.organizer.displayName,
          url: `${SITE_URL}/organisateur/${event.organizer.id}`,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: event.currency || 'CAD',
      availability: 'https://schema.org/InStock',
      url: event.url ? event.url : `${SITE_URL}/evenement/${event.id}`,
      price: formatPrice(event.priceMin) ?? 0,
      priceSpecification:
        event.priceMin || event.priceMax
          ? {
              '@type': 'UnitPriceSpecification',
              priceCurrency: event.currency || 'CAD',
              price: formatPrice(event.priceMin ?? event.priceMax ?? 0),
              referenceQuantity: {
                '@type': 'QuantitativeValue',
                value: 1,
                unitCode: 'EACH',
              },
            }
          : undefined,
    },
  };

  if (endDateISO) {
    baseJson.endDate = endDateISO;
  }

  if (event.tags?.length) {
    baseJson.keywords = event.tags.join(', ');
  }

  return baseJson;
};

export const buildVenueJsonLd = (venue: VenueWithRelations) => {
  const baseJson: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': `${SITE_URL}/salle/${venue.slug}#venue`,
    name: venue.name,
    description: venue.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressLocality: venue.city,
      postalCode: venue.postalCode,
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: venue.lat,
      longitude: venue.lon,
    },
  };

  if (venue.phone) {
    baseJson.telephone = venue.phone;
  }

  if (venue.website) {
    baseJson.url = venue.website;
  }

  if (venue.types && venue.types.length > 0) {
    baseJson.additionalType = venue.types.map(
      (type) => `https://schema.org/${type.charAt(0).toUpperCase() + type.slice(1)}`
    );
  }

  if (venue.capacity) {
    baseJson.maximumAttendeeCapacity = venue.capacity;
  }

  return baseJson;
};

export const canonicalUrlForPath = (path: string) => {
  if (!path.startsWith('http')) {
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  return path;
};
