import { BaseConnector, UnifiedEvent } from './base';
import { EventCategory, EventLanguage, EventSource, EventStatus } from '@prisma/client';

const BANDSINTOWN_BASE_URL = 'https://rest.bandsintown.com';
const DEFAULT_APP_ID = 'pulse-montreal'; // App ID requis par Bandsintown (peut être n'importe quelle string)

const toCents = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : undefined);

export class BandsintownConnector extends BaseConnector {
  private appId: string;

  constructor(appId?: string) {
    super(EventSource.BANDSINTOWN, undefined, BANDSINTOWN_BASE_URL, 2); // Rate limit: 2 req/sec
    
    // Bandsintown nécessite un app_id (peut être n'importe quelle string)
    // Si non fourni, utiliser la valeur par défaut
    this.appId = appId || process.env.BANDSINTOWN_APP_ID || DEFAULT_APP_ID;
  }

  async listUpdatedSince(_since: Date, limit: number = 200): Promise<any[]> {
    const allEvents: any[] = [];
    
    try {
      // Bandsintown API: recherche par localisation
      // Format: "city,state,country" ou "city,country"
      const location = 'Montreal,QC,Canada';
      
      // Format date: "upcoming" pour tous les événements futurs
      // ou "YYYY-MM-DD,YYYY-MM-DD" pour une plage spécifique
      const dateRange = 'upcoming'; // Récupérer tous les événements à venir
      
      const params = new URLSearchParams({
        app_id: this.appId,
        location: location,
        date: dateRange,
        radius: '50', // 50km autour de Montréal
      });

      const url = `${this.baseUrl}/events/search?${params.toString()}`;
      console.log(`🎸 Bandsintown ingestion:`, url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Pulse-Montreal/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bandsintown API error ${response.status}: ${body}`);
      }

      const data = await response.json();
      
      // Bandsintown peut retourner soit un tableau directement, soit un objet avec events
      const events = Array.isArray(data) ? data : (data as any).events || [];
      
      console.log(`✅ Bandsintown: ${events.length} événements récupérés`);
      
      // Filtrer les événements passés (garder seulement les événements futurs)
      const now = new Date();
      const futureEvents = events.filter((event: any) => {
        if (!event?.datetime) return false;
        const eventDate = new Date(event.datetime);
        return eventDate >= now;
      });

      console.log(`✅ Bandsintown: ${futureEvents.length} événements futurs (${events.length - futureEvents.length} passés exclus)`);
      
      return futureEvents.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Erreur Bandsintown API:', error);
      throw error;
    }
  }

  async mapToUnifiedEvent(rawEvent: any): Promise<UnifiedEvent> {
    if (!rawEvent?.datetime) {
      throw new Error('Bandsintown event missing datetime.');
    }

    const startAt = new Date(rawEvent.datetime);
    
    // Estimer la fin (par défaut +3h pour un concert)
    const endAt = rawEvent.end_time 
      ? new Date(rawEvent.end_time)
      : new Date(startAt.getTime() + 3 * 60 * 60 * 1000); // +3h par défaut

    const timezone = 'America/Montreal';

    const venue = rawEvent?.venue;
    if (!venue?.name) {
      throw new Error('Bandsintown event missing venue name.');
    }

    // Construire le titre
    const artistName = rawEvent.lineup?.[0] || 'Artiste';
    const title = rawEvent.title || `${artistName}${rawEvent.lineup?.length > 1 ? ` + ${rawEvent.lineup.slice(1).join(', ')}` : ''}`;

    // Description
    const description = rawEvent.description || 
      `Concert de ${artistName}${rawEvent.lineup?.length > 1 ? ` avec ${rawEvent.lineup.slice(1).join(', ')}` : ''} à ${venue.name}`;

    // Coordonnées géographiques
    let venueLat: number | undefined;
    let venueLon: number | undefined;
    
    if (venue.latitude && venue.longitude) {
      venueLat = parseFloat(venue.latitude);
      venueLon = parseFloat(venue.longitude);
    } else if (venue.lat && venue.lng) {
      venueLat = parseFloat(venue.lat);
      venueLon = parseFloat(venue.lng);
    }

    // Si pas de coordonnées, essayer de géocoder l'adresse
    if ((!venueLat || !venueLon) && venue) {
      const addressParts = [
        venue.location || venue.address,
        venue.city,
        venue.region || venue.state,
        venue.country,
      ]
        .filter(Boolean)
        .join(', ');

      if (addressParts) {
        const coords = await this.geocodeAddress(addressParts, venue.city || 'Montréal');
        if (coords) {
          venueLat = coords.lat;
          venueLon = coords.lon;
        }
      }
    }

    // URL de ticket
    let ticketUrl: string | undefined;
    if (rawEvent.offers && Array.isArray(rawEvent.offers) && rawEvent.offers.length > 0) {
      const ticketOffer = rawEvent.offers.find(
        (offer: any) => offer.type === 'Tickets' && offer.status === 'available'
      );
      ticketUrl = ticketOffer?.url || rawEvent.offers[0]?.url;
    }
    
    // Fallback sur l'URL de l'événement
    if (!ticketUrl && rawEvent.url) {
      ticketUrl = rawEvent.url;
    }

    // Tags basés sur le lineup et le genre
    const tags: string[] = [];
    if (rawEvent.lineup && Array.isArray(rawEvent.lineup)) {
      rawEvent.lineup.forEach((artist: string) => {
        tags.push(artist.toLowerCase().replace(/\s+/g, '-'));
      });
    }
    tags.push('concert', 'live', 'music');

    // Catégoriser l'événement (toujours MUSIC pour Bandsintown)
    const category = EventCategory.MUSIC;
    
    // Inférer le sous-genre musical
    const subcategory = this.inferMusicGenre(artistName, title, description);

    // Détecter la langue
    const language = this.detectLanguage(title, description);

    return {
      source: EventSource.BANDSINTOWN,
      sourceId: rawEvent.id || `${rawEvent.artist_id || artistName}-${startAt.toISOString()}`,
      title,
      description,
      startAt,
      endAt,
      timezone,
      status: EventStatus.SCHEDULED,
      venue: {
        name: venue.name,
        address: [
          venue.location || venue.address,
          venue.city,
          venue.region || venue.state,
          venue.country,
        ]
          .filter(Boolean)
          .join(', '),
        city: venue.city || 'Montréal',
        postalCode: venue.postal_code || venue.postalCode || '',
        lat: venueLat ?? 45.5088, // Coordonnées par défaut de Montréal
        lon: venueLon ?? -73.5542,
        phone: venue.phone,
        website: venue.url || venue.website,
      },
      url: ticketUrl,
      priceMin: undefined, // Prix non disponible dans l'API Bandsintown publique
      priceMax: undefined,
      currency: 'CAD',
      language,
      imageUrl: rawEvent.artist?.image_url || rawEvent.image_url,
      tags,
      category,
      subcategory,
      accessibility: [],
      ageRestriction: undefined,
      lastModified: rawEvent.updated_at ? new Date(rawEvent.updated_at) : undefined,
    };
  }

  /**
   * Infère le genre musical à partir du nom de l'artiste, titre et description
   */
  private inferMusicGenre(artistName: string, title?: string, description?: string): string {
    const text = `${artistName} ${title || ''} ${description || ''}`.toLowerCase();
    
    // Genres basés sur les mots-clés
    const genreKeywords: Record<string, string[]> = {
      'rock': ['rock', 'metal', 'punk', 'grunge', 'alternative', 'indie rock'],
      'pop': ['pop', 'mainstream', 'radio', 'top 40'],
      'hip_hop': ['hip-hop', 'hip hop', 'rap', 'urban', 'trap', 'drill'],
      'electronic': ['electronic', 'edm', 'techno', 'house', 'dubstep', 'trance', 'drum and bass'],
      'jazz': ['jazz', 'blues', 'swing', 'bebop', 'fusion'],
      'folk': ['folk', 'acoustic', 'indie folk', 'singer-songwriter', 'americana'],
      'reggae': ['reggae', 'ska', 'dancehall', 'dub'],
      'classique': ['classical', 'orchestra', 'symphony', 'opera', 'baroque'],
      'country': ['country', 'bluegrass', 'americana', 'country rock'],
      'latin': ['latin', 'salsa', 'bachata', 'reggaeton', 'cumbia'],
      'funk_soul': ['funk', 'soul', 'r&b', 'rnb', 'motown'],
    };

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return genre;
      }
    }

    return 'live_music'; // Fallback
  }
}
