import { BaseConnector, UnifiedEvent } from './base';
import { EventLanguage, EventSource } from '@prisma/client';

interface MeetupEvent {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  endTime?: string;
  eventUrl: string;
  isOnline: boolean;
  featuredPhoto?: {
    baseUrl?: string;
  };
  group: {
    name: string;
    urlname: string;
    description?: string;
  };
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  feeSettings?: {
    amount?: number;
    currency?: string;
  };
  going?: number;
  maxTickets?: number;
}

interface MeetupGraphEdge {
  node: {
    id: string;
    title: string;
    description?: string;
    dateTime: string;
    endTime?: string;
    eventUrl: string;
    isOnline: boolean;
    featuredPhoto?: {
      baseUrl?: string;
    };
    group: {
      name: string;
      urlname: string;
      description?: string;
    };
    venue?: {
      name?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      lat?: number;
      lng?: number;
    };
    feeSettings?: {
      amount?: number;
      currency?: string;
    };
    going?: number;
    maxTickets?: number;
  };
}

interface MeetupGraphQLResponse {
  data?: {
    rankedEvents?: {
      edges?: MeetupGraphEdge[];
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string;
      };
    };
  };
}

const MEETUP_GRAPHQL_ENDPOINT = 'https://api.meetup.com/gql';
const MEETUP_SEARCH_TERMS = ['Montreal', 'Montréal', 'tech', 'startup', 'music', 'festival'];
const MEETUP_MAX_PAGES = 3;

export class MeetupConnector extends BaseConnector {
  private readonly accessToken?: string;

  constructor(token?: string) {
    super(EventSource.MEETUP, token, MEETUP_GRAPHQL_ENDPOINT, 2);
    this.accessToken = token || process.env.MEETUP_TOKEN || undefined;
  }

  async listUpdatedSince(since: Date, limit: number = 200): Promise<MeetupEvent[]> {
    if (!this.accessToken) {
      console.warn('MEETUP_TOKEN not configured. Meetup ingestion skipped.');
      return [];
    }

    const events: MeetupEvent[] = [];

    for (const term of MEETUP_SEARCH_TERMS) {
      if (events.length >= limit) break;

      try {
        const termEvents = await this.fetchEventsByTerm(term, since, limit - events.length);
        events.push(...termEvents);
      } catch (error) {
        console.warn(`Meetup fetch error for term "${term}":`, error);
      }
    }

    const deduped = this.deduplicate(events);
    return deduped.slice(0, limit);
  }

  async mapToUnifiedEvent(rawEvent: MeetupEvent): Promise<UnifiedEvent> {
    const startAt = new Date(rawEvent.dateTime);
    const endAt = rawEvent.endTime ? new Date(rawEvent.endTime) : undefined;

    const venueLat = rawEvent.venue?.lat;
    const venueLon = rawEvent.venue?.lng;

    const venue = rawEvent.venue
      ? {
          name: rawEvent.venue.name || (rawEvent.isOnline ? 'En ligne' : 'Lieu Meetup'),
          address: rawEvent.venue.address || (rawEvent.isOnline ? 'Événement virtuel' : 'Montréal, QC'),
          city: rawEvent.venue.city || 'Montréal',
          postalCode: rawEvent.venue.postalCode || '',
          lat: typeof venueLat === 'number' ? venueLat : 45.5088,
          lon: typeof venueLon === 'number' ? venueLon : -73.5542,
        }
      : rawEvent.isOnline
      ? {
          name: 'Événement en ligne',
          address: 'Événement virtuel',
          city: 'Montréal',
          postalCode: '',
          lat: 45.5088,
          lon: -73.5542,
        }
      : undefined;

    const description = rawEvent.description || rawEvent.group.description || `Événement organisé par ${rawEvent.group.name}`;
    const tags = ['meetup', rawEvent.group.urlname, ...(this.extractTags(rawEvent.title, rawEvent.description) || [])].filter(Boolean);
    const category = this.categorizeEvent(rawEvent.title, description, tags);
    const language: EventLanguage = this.detectLanguage(rawEvent.title, description);

    return {
      source: EventSource.MEETUP,
      sourceId: rawEvent.id,
      title: rawEvent.title,
      description,
      startAt,
      endAt,
      timezone: 'America/Montreal',
      venue,
      url: rawEvent.eventUrl,
      priceMin: rawEvent.feeSettings?.amount ? Math.round(rawEvent.feeSettings.amount * 100) : undefined,
      priceMax: rawEvent.feeSettings?.amount ? Math.round(rawEvent.feeSettings.amount * 100) : undefined,
      currency: rawEvent.feeSettings?.currency || 'CAD',
      language,
      imageUrl: rawEvent.featuredPhoto?.baseUrl,
      tags,
      category,
      subcategory: this.inferSubcategory(rawEvent.title, rawEvent.description, rawEvent.group.name),
      accessibility: rawEvent.isOnline ? ['online'] : [],
      ageRestriction: undefined,
      lastModified: new Date(),
    };
  }

  private async fetchEventsByTerm(term: string, since: Date, limit: number): Promise<MeetupEvent[]> {
    const query = `
      query($searchTerm: String!, $startDate: DateTime!, $endDate: DateTime!, $first: Int!, $after: String) {
        rankedEvents(
          filter: {
            query: $searchTerm
            startDateRange: { startDate: $startDate, endDate: $endDate }
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
              isOnline
              featuredPhoto { baseUrl }
              group { name urlname description }
              venue { name address city postalCode lat lng }
              feeSettings { amount currency }
              going
              maxTickets
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    const results: MeetupEvent[] = [];
    const endDate = new Date(since);
    endDate.setDate(endDate.getDate() + 60);

    let cursor: string | null = null;
    let pageCount = 0;

    while (pageCount < MEETUP_MAX_PAGES && results.length < limit) {
      const variables = {
        searchTerm: term,
        startDate: since.toISOString(),
        endDate: endDate.toISOString(),
        first: Math.min(50, limit - results.length),
        after: cursor,
      };

      const response = await fetch(MEETUP_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
          'User-Agent': 'Pulse-Montreal/1.0',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Meetup GraphQL error ${response.status}: ${body}`);
      }

      const data: MeetupGraphQLResponse = await response.json();
      const edges = data?.data?.rankedEvents?.edges ?? [];

      edges.forEach((edge) => {
        const node = edge.node;
        if (!node?.id || !node?.dateTime) {
          return;
        }

        results.push({
          id: node.id,
          title: node.title,
          description: node.description,
          dateTime: node.dateTime,
          endTime: node.endTime,
          eventUrl: node.eventUrl,
          isOnline: node.isOnline,
          featuredPhoto: node.featuredPhoto,
          group: node.group,
          venue: node.venue,
          feeSettings: node.feeSettings,
          going: node.going,
          maxTickets: node.maxTickets,
        });
      });

      const pageInfo = data?.data?.rankedEvents?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
        break;
      }

      cursor = pageInfo.endCursor;
      pageCount += 1;
      await this.rateLimit();
    }

    return results.filter((event) => this.isMontrealEvent(event));
  }

  private deduplicate(events: MeetupEvent[]): MeetupEvent[] {
    const seen = new Set<string>();
    return events.filter((event) => {
      const key = `${event.id}-${event.dateTime}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private isMontrealEvent(event: MeetupEvent): boolean {
    const city = event.venue?.city?.toLowerCase() || '';
    const address = event.venue?.address?.toLowerCase() || '';
    return (
      city.includes('montreal') ||
      city.includes('montréal') ||
      address.includes('montreal') ||
      address.includes('montréal') ||
      address.includes('qc')
    );
  }

  private inferSubcategory(title: string, description?: string, groupName?: string): string | undefined {
    const text = `${title} ${description || ''} ${groupName || ''}`.toLowerCase();
    if (text.includes('javascript') || text.includes('react') || text.includes('typescript')) return 'javascript';
    if (text.includes('python') || text.includes('data')) return 'data-science';
    if (text.includes('startup') || text.includes('entrepreneur')) return 'startup';
    if (text.includes('marketing') || text.includes('growth')) return 'marketing';
    if (text.includes('design') || text.includes('ux') || text.includes('ui')) return 'design';
    if (text.includes('yoga') || text.includes('fitness')) return 'wellness';
    return undefined;
  }
}
