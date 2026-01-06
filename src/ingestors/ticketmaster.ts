import { BaseConnector, UnifiedEvent } from './base';
import { EventLanguage, EventSource, EventStatus } from '@prisma/client';

const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const PREFERRED_IMAGE_RATIOS = ['16_9', '3_2', '4_3', 'square'];
// Patterns à exclure : images d'attraction, artiste, performer, logo, portrait, etc.
const EXCLUDED_IMAGE_PATTERNS = [
  /ATTRACTION/i,
  /ARTIST/i,
  /PERFORMER/i,
  /LOGO/i,
  /TABLET/i,
  /RETINA/i,
  /PORTRAIT/i,
  /_SQUARE_/i,
  /HEADSHOT/i,
  /PROFILE/i,
];

const toIsoUtc = (date: Date) => {
  const iso = date.toISOString();
  return iso.endsWith('Z') ? iso : `${iso.slice(0, 19)}Z`;
};

const toCents = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : undefined);

/**
 * Sélectionne la meilleure image pour un événement Ticketmaster
 * Priorise les images de l'événement lui-même, exclut les images d'attraction/artiste
 */
const pickTicketmasterImage = (event: any): string | undefined => {
  if (!event?.images || !Array.isArray(event.images) || event.images.length === 0) {
    return undefined;
  }

  // Filtrer les images en excluant les patterns indésirables
  const filtered = event.images.filter((image: any) => {
    if (!image?.url) return false;
    const url = image.url.toLowerCase();
    // Exclure les images d'attraction, artiste, logo, portrait, etc.
    return !EXCLUDED_IMAGE_PATTERNS.some((pattern) => pattern.test(url));
  });

  if (filtered.length === 0) {
    // Si toutes les images sont filtrées, prendre la première disponible
    return event.images[0]?.url;
  }

  // Trier par qualité (largeur) en ordre décroissant
  const sorted = [...filtered].sort((a: any, b: any) => (b?.width || 0) - (a?.width || 0));

  // Chercher par ratio préféré
  for (const ratio of PREFERRED_IMAGE_RATIOS) {
    const match = sorted.find((image: any) => image?.ratio?.toLowerCase() === ratio);
    if (match?.url) return match.url;
  }

  // Retourner la meilleure image disponible (la plus large)
  return sorted[0]?.url;
};

export class TicketmasterConnector extends BaseConnector {
  constructor(apiKey: string) {
    super(EventSource.TICKETMASTER, apiKey, TICKETMASTER_BASE_URL, 4);

    if (!apiKey) {
      throw new Error('TICKETMASTER_API_KEY must be configured to use the Ticketmaster connector.');
    }
  }

  async listUpdatedSince(_since: Date, limit: number = 200): Promise<any[]> {
    // Ticketmaster est très strict sur le format de startDateTime et renvoie
    // facilement des erreurs 400 (DIS1015) si le format ne correspond pas
    // exactement à leurs attentes. Pour un MVP robuste, on préfère :
    // - ne pas utiliser de filtre startDateTime côté API
    // - récupérer un batch d'événements triés par date
    // - laisser la logique d'application filtrer par date si nécessaire.
    
    const allEvents: any[] = [];
    const pageSize = 200; // Maximum par page selon l'API Ticketmaster
    let page = 0;
    const maxPages = Math.ceil(limit / pageSize);

    while (page < maxPages && allEvents.length < limit) {
      const params = new URLSearchParams({
        apikey: this.apiKey as string,
        countryCode: 'CA',
        city: 'Montreal',
        locale: '*',
        sort: 'date,asc',
        size: pageSize.toString(),
        page: page.toString(),
      });

      const url = `${this.baseUrl}/events.json?${params.toString()}`;
      console.log(`🎫 Ticketmaster ingestion page ${page + 1}:`, url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Pulse-Montreal/1.0',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ticketmaster API error ${response.status}: ${body}`);
      }

      const data = await response.json();
      const events = data?._embedded?.events ?? [];
      
      if (events.length === 0) {
        // Plus d'événements disponibles
        break;
      }

      allEvents.push(...events);
      
      // Vérifier s'il y a une page suivante
      const totalPages = data?.page?.totalPages ?? 1;
      if (page >= totalPages - 1 || allEvents.length >= limit) {
        break;
      }

      page++;
      await this.rateLimit(); // Respecter les limites de taux
    }

    // Filtrer les événements passés (garder seulement les événements futurs)
    const now = new Date();
    const futureEvents = allEvents.filter((event) => {
      const eventDate = event?.dates?.start?.dateTime 
        ? new Date(event.dates.start.dateTime)
        : event?.dates?.start?.localDate 
          ? new Date(`${event.dates.start.localDate}T${event.dates.start.localTime || '00:00:00'}`)
          : null;
      
      return eventDate && eventDate >= now;
    });

    console.log(`✅ Ticketmaster: ${futureEvents.length} événements futurs récupérés (${allEvents.length} total, ${allEvents.length - futureEvents.length} passés exclus)`);
    
    return futureEvents.slice(0, limit);
  }

  /**
   * Récupère les détails d'un événement depuis l'API Ticketmaster pour obtenir les prix
   * si ils ne sont pas disponibles dans la liste
   */
  private async fetchEventDetails(eventId: string): Promise<any | null> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey as string,
        locale: '*',
      });

      const url = `${this.baseUrl}/events/${eventId}.json?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Pulse-Montreal/1.0',
        },
      });

      if (!response.ok) {
        // Si l'endpoint de détails échoue, on retourne null et on continue sans prix
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`⚠️ Erreur lors de la récupération des détails de l'événement ${eventId}:`, error);
      return null;
    }
  }

  async mapToUnifiedEvent(rawEvent: any): Promise<UnifiedEvent> {
    const startIso = rawEvent?.dates?.start?.dateTime
      || (rawEvent?.dates?.start?.localDate
        ? `${rawEvent.dates.start.localDate}T${rawEvent.dates.start.localTime || '19:00:00'}`
        : undefined);

    if (!startIso) {
      throw new Error('Ticketmaster event missing start date.');
    }

    const startAt = new Date(startIso);
    const endIso = rawEvent?.dates?.end?.dateTime;
    const endAt = endIso ? new Date(endIso) : undefined;
    const timezone = rawEvent?.dates?.timezone || 'America/Montreal';

    const statusCode = rawEvent?.dates?.status?.code?.toLowerCase?.();
    const status = statusCode === 'cancelled' ? EventStatus.CANCELLED : undefined;

    const venue = rawEvent?._embedded?.venues?.[0];
    let priceRange = rawEvent?.priceRanges?.[0];

    // Si les prix ne sont pas disponibles dans la liste, essayer de les récupérer depuis l'endpoint de détails
    if (!priceRange && rawEvent?.id) {
      const eventDetails = await this.fetchEventDetails(rawEvent.id);
      if (eventDetails?.priceRanges?.[0]) {
        priceRange = eventDetails.priceRanges[0];
      }
      // Respecter le rate limit après l'appel supplémentaire
      await this.rateLimit();
    }

    let venueLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined;
    let venueLon = venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined;

    if ((!venueLat || !venueLon) && venue) {
      const addressParts = [
        venue.address?.line1,
        venue.city?.name,
        venue.state?.name,
        venue.country?.name,
        venue.postalCode,
      ]
        .filter(Boolean)
        .join(', ');

      if (addressParts) {
        const coords = await this.geocodeAddress(addressParts, venue.city?.name || 'Montréal');
        if (coords) {
          venueLat = coords.lat;
          venueLon = coords.lon;
        }
      }
    }

    const title: string = rawEvent?.name || 'Événement Ticketmaster';
    const infoPieces = [rawEvent?.info, rawEvent?.pleaseNote, rawEvent?.description]?.filter(Boolean);
    const description = (infoPieces.find(Boolean) as string | undefined) || `Événement listé par Ticketmaster: ${title}`;

    const tags = [
      ...(rawEvent?.classifications?.map((c: any) => c?.segment?.name?.toLowerCase?.()).filter(Boolean) ?? []),
      ...(rawEvent?.classifications?.map((c: any) => c?.genre?.name?.toLowerCase?.()).filter(Boolean) ?? []),
    ].filter(Boolean);

    const category = this.categorizeEvent(title, description, tags);
    const language = this.detectLanguage(title, description);

    return {
      source: EventSource.TICKETMASTER,
      sourceId: rawEvent?.id,
      title,
      description,
      startAt,
      endAt,
      timezone,
      status,
      venue: venue
        ? {
            name: venue?.name || 'Lieu Ticketmaster',
            address: [venue?.address?.line1, venue?.city?.name, venue?.state?.name, venue?.country?.name]
              .filter(Boolean)
              .join(', '),
            city: venue?.city?.name || 'Montréal',
            postalCode: venue?.postalCode || '',
            lat: venueLat ?? 45.5088,
            lon: venueLon ?? -73.5542,
            phone: venue?.boxOfficeInfo?.phoneNumberDetail,
            website: venue?.url,
          }
        : undefined,
      url: rawEvent?.url,
      priceMin: toCents(priceRange?.min),
      priceMax: toCents(priceRange?.max),
      currency: priceRange?.currency || 'CAD',
      language,
      imageUrl: pickTicketmasterImage(rawEvent),
      tags,
      category,
      subcategory: rawEvent?.classifications?.[0]?.genre?.name,
      accessibility: []
        .concat(rawEvent?.accessibleSeatingDetail ? ['accessible'] : [])
        .concat(rawEvent?.pleaseNote?.toLowerCase()?.includes('18+') ? ['18+'] : []),
      ageRestriction: rawEvent?.ageRestrictions?.legalAgeEnforced ? '18+' : undefined,
      lastModified: rawEvent?.dates?.status?.updateDateTime ? new Date(rawEvent.dates.status.updateDateTime) : undefined,
    };
  }
}
