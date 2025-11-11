import { DEFAULT_EVENT_IMAGE } from '@/lib/constants';

export interface FacebookPageConfig {
  pageId: string;
  accessToken: string;
}

const GRAPH_VERSION = 'v19.0';
const EVENT_FIELDS = [
  'id',
  'name',
  'description',
  'category',
  'start_time',
  'end_time',
  'event_times',
  'ticket_uri',
  'cover{source}',
  'place{name,location{city,street,zip,latitude,longitude}}',
  'attending_count',
  'interested_count',
  'maybe_count',
  'is_canceled'
].join(',');

type GraphEvent = {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  start_time?: string;
  end_time?: string;
  event_times?: Array<{ start_time?: string; end_time?: string }>;
  ticket_uri?: string;
  cover?: { source?: string };
  place?: {
    name?: string;
    location?: {
      city?: string;
      street?: string;
      zip?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  attending_count?: number;
  interested_count?: number;
  maybe_count?: number;
  is_canceled?: boolean;
};

const toFacebookApiUrl = (pageId: string, accessToken: string, cursor?: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: EVENT_FIELDS,
    time_filter: 'upcoming',
    limit: '50'
  });

  if (cursor) {
    params.set('after', cursor);
  }

  return `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/events?${params.toString()}`;
};

const pickNextOccurrence = (event: GraphEvent) => {
  const upcoming = (event.event_times || [])
    .filter((time) => time.start_time)
    .map((time) => time.start_time as string)
    .sort();

  return upcoming[0] || event.start_time;
};

const normaliseDate = (isoString?: string) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  const localDate = date.toISOString().split('T')[0];
  const localTime = date.toISOString().split('T')[1]?.slice(0, 8) || '19:00:00';
  return {
    dateTime: date.toISOString(),
    localDate,
    localTime
  };
};

const inferSegmentFromCategory = (category?: string, description = '') => {
  const base = (category || '').toLowerCase();
  const content = `${category || ''} ${description}`.toLowerCase();

  if (base.includes('music') || content.includes('concert') || content.includes('dj')) {
    return { segment: 'Music', genre: 'Live' };
  }

  if (base.includes('theater') || base.includes('theatre') || content.includes('théâtre')) {
    return { segment: 'Arts & Theatre', genre: 'Performance' };
  }

  if (base.includes('sports') || content.includes('tournoi')) {
    return { segment: 'Sports', genre: 'Sports' };
  }

  if (base.includes('food') || content.includes('cuisine') || content.includes('dégustation')) {
    return { segment: 'Food', genre: 'Workshop' };
  }

  return { segment: 'Community', genre: 'Community' };
};

const mapGraphEventToUnified = (event: GraphEvent) => {
  const primaryStart = pickNextOccurrence(event);
  const startDate = normaliseDate(primaryStart);
  const endDate = normaliseDate(event.end_time);
  const { segment, genre } = inferSegmentFromCategory(event.category, event.description);

  const venue = event.place?.location
    ? {
        name: event.place?.name || 'Lieu Facebook',
        address: {
          line1: event.place?.location?.street || undefined,
          postalCode: event.place?.location?.zip || undefined
        },
        city: {
          name: event.place?.location?.city || 'Montreal'
        },
        location: {
          latitude: String(event.place?.location?.latitude || 45.5088),
          longitude: String(event.place?.location?.longitude || -73.5542)
        }
      }
    : undefined;

  return {
    id: event.id,
    name: event.name || 'Événement Facebook',
    description: event.description || '',
    dates: {
      start: startDate,
      end: endDate
    },
    url: event.ticket_uri
      ? event.ticket_uri
      : `https://www.facebook.com/events/${event.id}`,
    images: [
      {
        url: event.cover?.source || DEFAULT_EVENT_IMAGE
      }
    ],
    classifications: [
      {
        segment: { name: segment },
        genre: { name: genre }
      }
    ],
    priceRanges: [
      {
        min: 0,
        max: 0,
        currency: 'CAD'
      }
    ],
    _embedded: venue
      ? {
          venues: [venue]
        }
      : undefined,
    source: 'facebook_events',
    sourceId: event.id,
    metrics: {
      attending: event.attending_count || 0,
      interested: event.interested_count || 0,
      maybe: event.maybe_count || 0
    },
    isCanceled: Boolean(event.is_canceled)
  };
};

export async function fetchFacebookEvents(pages: FacebookPageConfig[]) {
  if (!pages.length) return [];

  const results: any[] = [];

  for (const page of pages) {
    if (!page.accessToken) {
      console.warn(`⚠️ Token manquant pour la page Facebook ${page.pageId}, événement ignoré.`);
      continue;
    }

    console.log(`📘 Récupération des événements Facebook pour la page ${page.pageId}...`);
    let cursor: string | undefined;
    let pageCount = 0;

    try {
      do {
        const url = toFacebookApiUrl(page.pageId, page.accessToken, cursor);
        const response = await fetch(url);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`⚠️ Erreur Facebook API (${page.pageId}): ${response.status} - ${errorBody}`);
          break;
        }

        const data = await response.json();
        const events: GraphEvent[] = data?.data || [];

        if (!events.length) {
          console.log(`ℹ️ Aucun événement Facebook pour ${page.pageId} (page ${pageCount + 1}).`);
          break;
        }

        const mappedEvents = events
          .filter((evt) => !evt.is_canceled)
          .map(mapGraphEventToUnified);

        results.push(...mappedEvents);
        pageCount += 1;

        cursor = data?.paging?.cursors?.after;
      } while (cursor && pageCount < 5); // limiter à 5 pages (250 événements) pour éviter les quotas

      console.log(`✅ Facebook (${page.pageId}): ${pageCount} page(s) d'événements chargées (${results.length} cumulés).`);
    } catch (error: any) {
      console.error(`⚠️ Exception lors de la récupération Facebook (${page.pageId}):`, error.message);
    }
  }

  return results;
}

