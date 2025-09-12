import { BaseConnector, UnifiedEvent, ImportStats } from './base';

interface BandsintownEvent {
  id: string;
  title: string;
  description?: string;
  datetime: string;
  venue: {
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    city: string;
    region: string;
    country: string;
  };
  artist: {
    name: string;
    image_url?: string;
    facebook_page_url?: string;
  };
  offers?: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup?: string[];
  url?: string;
}

interface BandsintownResponse {
  events: BandsintownEvent[];
}

export class BandsintownConnector extends BaseConnector {
  private readonly appId: string;
  private readonly baseUrl = 'https://rest.bandsintown.com';

  constructor() {
    super('BANDSINTOWN');
    this.appId = process.env.BANDSINTOWN_APP_ID || '';
    
    if (!this.appId) {
      console.warn('BANDSINTOWN_APP_ID not configured, using demo mode');
    }
  }

  async listUpdatedSince(since: Date): Promise<UnifiedEvent[]> {
    if (!this.appId) {
      console.log('🎸 Bandsintown: Generating demo events (API key not configured)');
      return this.generateDemoEvents();
    }

    try {
      const events: UnifiedEvent[] = [];
      
      // Recherche par ville (Montreal)
      const montrealEvents = await this.fetchEventsByLocation('Montreal,QC,Canada', since);
      events.push(...montrealEvents);
      
      // Recherche par artistes populaires au Canada
      const popularArtists = [
        'Arcade Fire',
        'The Weeknd', 
        'Drake',
        'Leonard Cohen',
        'Céline Dion',
        'Simple Plan',
      ];

      for (const artist of popularArtists) {
        try {
          const artistEvents = await this.fetchEventsByArtist(artist, since);
          // Filtrer seulement les événements à Montreal
          const montrealArtistEvents = artistEvents.filter(event => 
            event.venue?.address?.toLowerCase().includes('montreal') ||
            event.venue?.address?.toLowerCase().includes('québec') ||
            event.venue?.city?.toLowerCase() === 'montreal'
          );
          events.push(...montrealArtistEvents);
        } catch (error) {
          console.warn(`Failed to fetch events for artist ${artist}:`, error);
        }
      }

      return this.deduplicateEvents(events);
    } catch (error) {
      console.error('Bandsintown API error:', error);
      return this.generateDemoEvents();
    }
  }

  private async fetchEventsByLocation(location: string, since: Date): Promise<UnifiedEvent[]> {
    const url = `${this.baseUrl}/events/search`;
    const params = new URLSearchParams({
      app_id: this.appId,
      location: location,
      radius: '50', // 50km autour de Montreal
      date: `${since.toISOString().split('T')[0]},${this.getDatePlus30Days()}`,
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Pulse Montreal Events Platform',
      },
    });

    if (!response.ok) {
      throw new Error(`Bandsintown API error: ${response.status}`);
    }

    const events: BandsintownEvent[] = await response.json();
    return events.map(event => this.mapToUnifiedEvent(event));
  }

  private async fetchEventsByArtist(artistName: string, since: Date): Promise<UnifiedEvent[]> {
    const url = `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`;
    const params = new URLSearchParams({
      app_id: this.appId,
      date: `${since.toISOString().split('T')[0]},${this.getDatePlus30Days()}`,
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Pulse Montreal Events Platform',
      },
    });

    if (!response.ok) {
      // Artiste non trouvé ou pas d'événements
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Bandsintown API error for ${artistName}: ${response.status}`);
    }

    const events: BandsintownEvent[] = await response.json();
    return events.map(event => this.mapToUnifiedEvent(event));
  }

  private mapToUnifiedEvent(event: BandsintownEvent): UnifiedEvent {
    const startDate = new Date(event.datetime);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3h par défaut

    return {
      sourceId: event.id,
      title: `${event.artist.name}${event.title ? ` - ${event.title}` : ''}`,
      description: event.description || `Concert de ${event.artist.name} à ${event.venue.name}`,
      startAt: startDate,
      endAt: endDate,
      timezone: 'America/Montreal',
      
      venue: {
        name: event.venue.name,
        address: `${event.venue.location}, ${event.venue.city}, ${event.venue.region}`,
        city: event.venue.city,
        lat: event.venue.latitude,
        lng: event.venue.longitude,
      },
      
      organizer: {
        name: event.artist.name,
        website: event.artist.facebook_page_url,
      },
      
      category: 'MUSIC',
      subcategory: this.inferMusicGenre(event.artist.name, event.title),
      
      imageUrl: event.artist.image_url,
      url: event.offers?.[0]?.url || event.url,
      
      tags: [
        'concert',
        'live',
        event.artist.name.toLowerCase().replace(/\s+/g, '-'),
        ...(event.lineup || []).map(artist => artist.toLowerCase().replace(/\s+/g, '-')),
      ],
      
      language: 'BOTH',
      accessibility: [],
      
      pricing: {
        isFree: false,
        currency: 'CAD',
        // Prix non disponible dans l'API Bandsintown gratuite
      },
      
      lastModified: new Date(),
    };
  }

  private inferMusicGenre(artistName: string, title?: string): string {
    const text = `${artistName} ${title || ''}`.toLowerCase();
    
    // Genres basés sur les mots-clés
    const genres: Record<string, string[]> = {
      'rock': ['rock', 'metal', 'punk', 'grunge', 'alternative'],
      'pop': ['pop', 'mainstream', 'radio'],
      'hip-hop': ['hip-hop', 'rap', 'urban', 'trap'],
      'electronic': ['electronic', 'edm', 'techno', 'house', 'dubstep', 'trance'],
      'jazz': ['jazz', 'blues', 'swing', 'bebop'],
      'folk': ['folk', 'acoustic', 'indie', 'singer-songwriter'],
      'reggae': ['reggae', 'ska', 'dancehall'],
      'classical': ['classical', 'orchestra', 'symphony', 'opera'],
      'country': ['country', 'bluegrass', 'americana'],
    };

    for (const [genre, keywords] of Object.entries(genres)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return genre;
      }
    }

    return 'live-music';
  }

  private generateDemoEvents(): UnifiedEvent[] {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1); // Demain

    return [
      {
        sourceId: 'bandsintown-demo-1',
        title: 'Arcade Fire - World Tour 2025',
        description: 'Le groupe montréalais légendaire revient sur scène pour une soirée inoubliable au Bell Centre.',
        startAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        endAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'Centre Bell',
          address: '1909 Avenue des Canadiens-de-Montréal, Montréal, QC',
          city: 'Montréal',
          lat: 45.496129,
          lng: -73.570472,
        },
        organizer: {
          name: 'Arcade Fire',
          website: 'https://arcadefire.com',
        },
        category: 'MUSIC',
        subcategory: 'indie-rock',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600',
        url: 'https://ticketmaster.ca/arcade-fire',
        tags: ['concert', 'indie', 'rock', 'montreal', 'arcade-fire'],
        language: 'BOTH',
        accessibility: ['wheelchair', 'hearing_assistance'],
        pricing: {
          isFree: false,
          min: 65,
          max: 150,
          currency: 'CAD',
        },
        lastModified: new Date(),
      },
      
      {
        sourceId: 'bandsintown-demo-2',
        title: 'Charlotte Cardin Live',
        description: 'L\'artiste québécoise présente son nouvel album dans un concert intimiste.',
        startAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 jours
        endAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'Théâtre Corona',
          address: '2490 Rue Notre-Dame O, Montréal, QC',
          city: 'Montréal',
          lat: 45.4814,
          lng: -73.5882,
        },
        organizer: {
          name: 'Charlotte Cardin',
          website: 'https://charlottecardin.com',
        },
        category: 'MUSIC',
        subcategory: 'pop',
        imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600',
        url: 'https://evenko.ca/charlotte-cardin',
        tags: ['concert', 'pop', 'quebec', 'francophone', 'charlotte-cardin'],
        language: 'FR',
        accessibility: ['wheelchair'],
        pricing: {
          isFree: false,
          min: 45,
          max: 85,
          currency: 'CAD',
        },
        lastModified: new Date(),
      },

      {
        sourceId: 'bandsintown-demo-3',
        title: 'Jazz Festival Preview - Oscar Peterson Tribute',
        description: 'Un hommage au légendaire pianiste montréalais avec les meilleurs musiciens de jazz du pays.',
        startAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000), // +21 jours
        endAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'Upstairs Jazz Bar & Grill',
          address: '1254 Rue Mackay, Montréal, QC',
          city: 'Montréal',
          lat: 45.4956,
          lng: -73.5736,
        },
        organizer: {
          name: 'Festival International de Jazz de Montréal',
          website: 'https://montrealjazzfest.com',
        },
        category: 'MUSIC',
        subcategory: 'jazz',
        imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=600',
        url: 'https://upstairsjazz.com/oscar-peterson-tribute',
        tags: ['jazz', 'tribute', 'piano', 'oscar-peterson', 'montreal-jazz'],
        language: 'BOTH',
        accessibility: ['wheelchair', 'hearing_assistance'],
        pricing: {
          isFree: false,
          min: 35,
          max: 55,
          currency: 'CAD',
        },
        lastModified: new Date(),
      },
    ];
  }

  private getDatePlus30Days(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  private deduplicateEvents(events: UnifiedEvent[]): UnifiedEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.title}-${event.startAt.toISOString()}-${event.venue?.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getImportStats(): Promise<ImportStats> {
    // Stats basiques pour Bandsintown
    return {
      totalProcessed: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      categories: {},
      venues: {},
      timeRange: {
        earliest: new Date(),
        latest: new Date(),
      },
    };
  }
}
