import { BaseConnector, UnifiedEvent, ImportStats } from './base';

interface MeetupEvent {
  id: string;
  name: string;
  description?: string;
  dateTime: string;
  endTime?: string;
  eventUrl: string;
  featuredPhoto?: {
    baseUrl: string;
  };
  venue?: {
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  group: {
    name: string;
    urlname: string;
    description?: string;
  };
  going: number;
  maxTickets?: number;
  isOnline: boolean;
  currency?: string;
  feeSettings?: {
    amount: number;
    currency: string;
  };
}

interface MeetupGraphQLResponse {
  data: {
    rankedEvents: {
      edges: Array<{
        node: MeetupEvent;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

export class MeetupConnector extends BaseConnector {
  private readonly accessToken: string;
  private readonly graphqlUrl = 'https://api.meetup.com/gql';

  constructor() {
    super('MEETUP');
    this.accessToken = process.env.MEETUP_TOKEN || '';
    
    if (!this.accessToken) {
      console.warn('MEETUP_TOKEN not configured, using demo mode');
    }
  }

  async listUpdatedSince(since: Date): Promise<UnifiedEvent[]> {
    if (!this.accessToken) {
      console.log('🤝 Meetup: Generating demo events (API token not configured)');
      return this.generateDemoEvents();
    }

    try {
      const events: UnifiedEvent[] = [];
      
      // Rechercher des événements à Montreal avec différents mots-clés
      const searchTerms = [
        'Montreal',
        'Montréal', 
        'tech',
        'startup',
        'networking',
        'developer',
        'design',
        'entrepreneur',
        'marketing',
        'business',
      ];

      for (const term of searchTerms) {
        try {
          const termEvents = await this.fetchEventsByTerm(term, since);
          events.push(...termEvents);
        } catch (error) {
          console.warn(`Failed to fetch Meetup events for term "${term}":`, error);
        }
      }

      return this.deduplicateEvents(events);
    } catch (error) {
      console.error('Meetup API error:', error);
      return this.generateDemoEvents();
    }
  }

  private async fetchEventsByTerm(searchTerm: string, since: Date): Promise<UnifiedEvent[]> {
    const query = `
      query($searchTerm: String!, $startDate: DateTime!, $endDate: DateTime!, $first: Int!, $after: String) {
        rankedEvents(
          filter: {
            query: $searchTerm
            startDateRange: { 
              startDate: $startDate
              endDate: $endDate 
            }
            lat: 45.5088
            lon: -73.5673
            radius: 50
          }
          first: $first
          after: $after
        ) {
          edges {
            node {
              id
              title
              description
              dateTime
              endTime
              eventUrl
              featuredPhoto {
                baseUrl
              }
              venue {
                name
                address
                city
                lat
                lng
              }
              group {
                name
                urlname
                description
              }
              going
              maxTickets
              isOnline
              currency
              feeSettings {
                amount
                currency
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const endDate = new Date(since);
    endDate.setDate(endDate.getDate() + 60); // 60 jours dans le futur

    const variables = {
      searchTerm,
      startDate: since.toISOString(),
      endDate: endDate.toISOString(),
      first: 50,
      after: null,
    };

    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'User-Agent': 'Pulse Montreal Events Platform',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Meetup GraphQL API error: ${response.status}`);
    }

    const data: MeetupGraphQLResponse = await response.json();
    
    if (!data.data?.rankedEvents?.edges) {
      return [];
    }

    return data.data.rankedEvents.edges
      .map(edge => this.mapToUnifiedEvent(edge.node))
      .filter(event => this.isInMontreal(event));
  }

  private mapToUnifiedEvent(event: MeetupEvent): UnifiedEvent {
    const startDate = new Date(event.dateTime);
    const endDate = event.endTime ? new Date(event.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // Déterminer la catégorie basée sur le nom et la description
    const category = this.inferCategory(event.name, event.description, event.group.name);
    
    return {
      sourceId: event.id,
      title: event.name,
      description: event.description || `Événement organisé par ${event.group.name}`,
      startAt: startDate,
      endAt: endDate,
      timezone: 'America/Montreal',
      
      venue: event.venue ? {
        name: event.venue.name,
        address: event.venue.address,
        city: event.venue.city,
        lat: event.venue.lat,
        lng: event.venue.lng,
      } : {
        name: event.isOnline ? 'En ligne' : 'Lieu à confirmer',
        address: event.isOnline ? 'Événement virtuel' : 'Montréal, QC',
        city: 'Montréal',
      },
      
      organizer: {
        name: event.group.name,
        website: `https://meetup.com/${event.group.urlname}`,
      },
      
      category,
      subcategory: this.inferSubcategory(event.name, event.description, event.group.name),
      
      imageUrl: event.featuredPhoto?.baseUrl,
      url: event.eventUrl,
      
      tags: [
        'meetup',
        'networking',
        event.group.urlname,
        ...(event.isOnline ? ['online', 'virtual'] : ['in-person']),
        ...this.extractTags(event.name, event.description),
      ],
      
      language: this.inferLanguage(event.name, event.description),
      accessibility: event.isOnline ? ['online'] : [],
      
      pricing: {
        isFree: !event.feeSettings || event.feeSettings.amount === 0,
        min: event.feeSettings?.amount,
        currency: event.feeSettings?.currency || 'CAD',
      },
      
      attendees: {
        going: event.going,
        capacity: event.maxTickets,
      },
      
      lastModified: new Date(),
    };
  }

  private inferCategory(name: string, description?: string, groupName?: string): string {
    const text = `${name} ${description || ''} ${groupName || ''}`.toLowerCase();
    
    if (text.match(/tech|developer|programming|coding|software|startup|innovation/)) {
      return 'EDUCATION';
    }
    if (text.match(/business|entrepreneur|marketing|sales|finance|leadership/)) {
      return 'EDUCATION';
    }
    if (text.match(/art|design|creative|photography|music|culture/)) {
      return 'EXHIBITION';
    }
    if (text.match(/sport|fitness|yoga|running|cycling|outdoor/)) {
      return 'SPORT';
    }
    if (text.match(/family|kids|children|parent/)) {
      return 'FAMILY';
    }
    if (text.match(/volunteer|charity|community|social/)) {
      return 'COMMUNITY';
    }
    
    return 'COMMUNITY';
  }

  private inferSubcategory(name: string, description?: string, groupName?: string): string {
    const text = `${name} ${description || ''} ${groupName || ''}`.toLowerCase();
    
    // Tech subcategories
    if (text.match(/javascript|js|react|vue|angular/)) return 'javascript';
    if (text.match(/python|django|flask/)) return 'python';
    if (text.match(/java|spring|kotlin/)) return 'java';
    if (text.match(/data|analytics|science|ml|ai/)) return 'data-science';
    if (text.match(/devops|cloud|aws|azure|kubernetes/)) return 'devops';
    if (text.match(/mobile|ios|android|flutter/)) return 'mobile';
    if (text.match(/blockchain|crypto|web3/)) return 'blockchain';
    
    // Business subcategories
    if (text.match(/startup|entrepreneur/)) return 'startup';
    if (text.match(/marketing|growth|seo/)) return 'marketing';
    if (text.match(/finance|investment|fintech/)) return 'finance';
    if (text.match(/hr|recruitment|talent/)) return 'hr';
    
    // Creative subcategories
    if (text.match(/design|ux|ui/)) return 'design';
    if (text.match(/photography|photo/)) return 'photography';
    if (text.match(/writing|content|blog/)) return 'writing';
    
    return 'networking';
  }

  private inferLanguage(name: string, description?: string): 'FR' | 'EN' | 'BOTH' {
    const text = `${name} ${description || ''}`;
    
    // Mots français communs
    const frenchWords = /\b(et|ou|le|la|les|de|des|du|pour|avec|dans|sur|par|une|un|ce|cette|ces|français|francophone)\b/i;
    // Mots anglais communs  
    const englishWords = /\b(and|or|the|for|with|in|on|by|a|an|this|that|these|english|anglophone)\b/i;
    
    const hasFrench = frenchWords.test(text);
    const hasEnglish = englishWords.test(text);
    
    if (hasFrench && hasEnglish) return 'BOTH';
    if (hasFrench) return 'FR';
    if (hasEnglish) return 'EN';
    
    return 'BOTH'; // Par défaut à Montréal
  }

  private extractTags(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();
    const tags: string[] = [];
    
    // Technologies
    const techTags = ['javascript', 'python', 'react', 'vue', 'angular', 'nodejs', 'php', 'java', 'go', 'rust'];
    techTags.forEach(tag => {
      if (text.includes(tag)) tags.push(tag);
    });
    
    // Concepts business
    const businessTags = ['startup', 'entrepreneur', 'marketing', 'sales', 'finance', 'leadership'];
    businessTags.forEach(tag => {
      if (text.includes(tag)) tags.push(tag);
    });
    
    // Formats d'événement
    if (text.includes('workshop')) tags.push('workshop');
    if (text.includes('conference')) tags.push('conference');
    if (text.includes('panel')) tags.push('panel');
    if (text.includes('demo')) tags.push('demo');
    if (text.includes('hackathon')) tags.push('hackathon');
    
    return tags.slice(0, 5); // Limiter à 5 tags
  }

  private isInMontreal(event: UnifiedEvent): boolean {
    if (!event.venue) return false;
    
    const city = event.venue.city?.toLowerCase() || '';
    const address = event.venue.address?.toLowerCase() || '';
    
    return city.includes('montreal') || 
           city.includes('montréal') || 
           address.includes('montreal') ||
           address.includes('montréal') ||
           address.includes('qc') ||
           address.includes('quebec');
  }

  private generateDemoEvents(): UnifiedEvent[] {
    const baseDate = new Date();
    
    return [
      {
        sourceId: 'meetup-demo-1',
        title: 'Montreal Tech Meetup - AI & Machine Learning',
        description: 'Rejoignez-nous pour une soirée dédiée à l\'intelligence artificielle et au machine learning. Présentations par des experts locaux, networking et discussions.',
        startAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 jours
        endAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'Notman House',
          address: '51 Rue Sherbrooke O, Montréal, QC',
          city: 'Montréal',
          lat: 45.5088,
          lng: -73.5673,
        },
        organizer: {
          name: 'Montreal Tech Community',
          website: 'https://meetup.com/montreal-tech',
        },
        category: 'EDUCATION',
        subcategory: 'data-science',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600',
        url: 'https://meetup.com/montreal-tech/events/ai-ml-meetup',
        tags: ['meetup', 'tech', 'ai', 'machine-learning', 'networking'],
        language: 'BOTH',
        accessibility: ['wheelchair'],
        pricing: {
          isFree: true,
          currency: 'CAD',
        },
        attendees: {
          going: 87,
          capacity: 120,
        },
        lastModified: new Date(),
      },

      {
        sourceId: 'meetup-demo-2',
        title: 'Startup Grind Montreal - Pitch Night',
        description: 'Soirée de présentation pour les startups montréalaises. Venez pitcher votre idée devant un panel d\'investisseurs et d\'entrepreneurs expérimentés.',
        startAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 jours
        endAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'WeWork Montreal',
          address: '1250 Boulevard René-Lévesque O, Montréal, QC',
          city: 'Montréal',
          lat: 45.4995,
          lng: -73.5747,
        },
        organizer: {
          name: 'Startup Grind Montreal',
          website: 'https://meetup.com/startup-grind-montreal',
        },
        category: 'EDUCATION',
        subcategory: 'startup',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600',
        url: 'https://meetup.com/startup-grind-montreal/events/pitch-night',
        tags: ['meetup', 'startup', 'pitch', 'entrepreneur', 'investor'],
        language: 'BOTH',
        accessibility: ['wheelchair', 'hearing_assistance'],
        pricing: {
          isFree: false,
          min: 15,
          currency: 'CAD',
        },
        attendees: {
          going: 45,
          capacity: 80,
        },
        lastModified: new Date(),
      },

      {
        sourceId: 'meetup-demo-3',
        title: 'Montreal UX/UI Design Community - Design Critique',
        description: 'Session de critique constructive de designs. Apportez vos projets en cours et recevez des feedback de designers expérimentés.',
        startAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000), // +17 jours
        endAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
        timezone: 'America/Montreal',
        venue: {
          name: 'Café Névé',
          address: '151 Rue Rachel E, Montréal, QC',
          city: 'Montréal',
          lat: 45.5255,
          lng: -73.5716,
        },
        organizer: {
          name: 'Montreal Designers',
          website: 'https://meetup.com/montreal-designers',
        },
        category: 'EDUCATION',
        subcategory: 'design',
        imageUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600',
        url: 'https://meetup.com/montreal-designers/events/design-critique',
        tags: ['meetup', 'design', 'ux', 'ui', 'critique'],
        language: 'BOTH',
        accessibility: [],
        pricing: {
          isFree: true,
          currency: 'CAD',
        },
        attendees: {
          going: 23,
          capacity: 30,
        },
        lastModified: new Date(),
      },
    ];
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
