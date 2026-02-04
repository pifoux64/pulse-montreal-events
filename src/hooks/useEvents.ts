import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/types';

// Types pour l'API
interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    lat: number;
    lon: number;
  };
  address?: string;
  city?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  imageUrl?: string;
  url?: string;
  organizerId?: string;
  source: string;
  lat?: number;
  lon?: number;
  eventTags?: {
    category: 'type' | 'genre' | 'ambiance' | 'public' | 'category' | string;
    value: string;
  }[];
  promotions?: Array<{
    id: string;
    kind: string;
    status: string;
    startsAt: string;
    endsAt: string;
  }>;
}

interface ApiResponse {
  items: ApiEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fonction de transformation des données API vers le format frontend
export const transformApiEvent = (event: ApiEvent): Event => {
  // Extraire les tags structurés
  const structuredTags = event.eventTags ?? [];
  const categoryTags = structuredTags
    .filter((t) => t.category === 'category')
    .map((t) => t.value);
  const genreTags = structuredTags
    .filter((t) => t.category === 'genre')
    .map((t) => t.value);
  const ambianceTags = structuredTags
    .filter((t) => t.category === 'ambiance')
    .map((t) => t.value);
  const publicTags = structuredTags
    .filter((t) => t.category === 'public')
    .map((t) => t.value);

  // Déterminer la catégorie principale : utiliser les tags structurés category, sinon déduire des genres, sinon utiliser event.category
  let mainCategory = categoryTags[0] || null;
  if (!mainCategory && genreTags.length > 0) {
    // Si on a des genres musicaux, c'est MUSIC
    mainCategory = 'MUSIC';
  } else if (!mainCategory) {
    // Mapper event.category legacy vers les nouvelles catégories
    const categoryMap: Record<string, string> = {
      'MUSIC': 'MUSIC',
      'ARTS_THEATRE': 'ART_CULTURE',
      'ARTS & THEATRE': 'ART_CULTURE',
      'ARTS_AND_THEATRE': 'ART_CULTURE',
      'SPORTS': 'SPORT',
      'SPORT': 'SPORT',
      'FAMILY': 'FAMILY',
      'COMMUNITY': 'ART_CULTURE',
      'EDUCATION': 'FAMILY',
      'MISCELLANEOUS': 'OTHER',
      // Mappings depuis l'ancien format
      'music': 'MUSIC',
      'arts & theatre': 'ART_CULTURE',
      'sports': 'SPORT',
      'family': 'FAMILY',
      'community': 'ART_CULTURE',
      'education': 'FAMILY',
      'miscellaneous': 'OTHER',
    };
    const eventCategoryUpper = event.category?.toUpperCase() || '';
    mainCategory = categoryMap[eventCategoryUpper] || categoryMap[event.category || ''] || null;
    
    // Si toujours pas de catégorie, essayer de déduire du titre/description
    if (!mainCategory) {
      const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
      if (text.includes('concert') || text.includes('music') || text.includes('musique') || text.includes('dj') || text.includes('festival')) {
        mainCategory = 'MUSIC';
      } else if (text.includes('expo') || text.includes('art') || text.includes('culture') || text.includes('théâtre') || text.includes('theatre')) {
        mainCategory = 'ART_CULTURE';
      } else if (text.includes('sport') || text.includes('fitness') || text.includes('course')) {
        mainCategory = 'SPORT';
      } else if (text.includes('famille') || text.includes('family') || text.includes('enfant') || text.includes('kids')) {
        mainCategory = 'FAMILY';
      }
    }
  }
  
  // Si toujours pas de catégorie, utiliser 'OTHER' mais permettre l'affichage quand aucun filtre n'est sélectionné
  if (!mainCategory) {
    mainCategory = 'OTHER';
  }

  // Normaliser les tags structurés pour l'affichage
  const normalizedStructured = [...genreTags, ...ambianceTags, ...publicTags].map((v) =>
    v.replace(/_/g, ' '),
  );

  // Mapper la catégorie principale vers le format d'affichage
  const categoryDisplayMap: Record<string, string> = {
    'MUSIC': 'Musique',
    'ART_CULTURE': 'Art & Culture',
    'SPORT': 'Sport',
    'FAMILY': 'Famille',
    'OTHER': 'Autre',
  };

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    shortDescription: event.description?.substring(0, 100) + '...' || '',
    startDate: new Date(event.startAt),
    endDate: event.endAt ? new Date(event.endAt) : null,
    location: {
      name: event.venue?.name || event.address || '',
      address: event.venue?.address || event.address || '',
      city: event.venue?.city || event.city || 'Montréal',
      postalCode: '',
      coordinates: { 
        lat: event.venue?.lat || event.lat || 45.5088, 
        lng: event.venue?.lon || event.lon || -73.5542 
      }
    },
    venueSlug: event.venue?.slug || null,
    category: categoryDisplayMap[mainCategory] || mainCategory,
    subCategory: genreTags[0]?.replace(/_/g, ' ') || event.tags?.[0] || '',
    tags: Array.from(
      new Set([...(event.tags || []), ...normalizedStructured]),
    ),
    price: event.priceMin != null || event.priceMax != null ? {
      amount: event.priceMin != null ? event.priceMin / 100 : (event.priceMax != null ? event.priceMax / 100 : 0), // Convertir de cents en dollars si nécessaire
      currency: event.currency || 'CAD', 
      isFree: event.priceMin === 0 && event.priceMin != null // Gratuit seulement si explicitement 0
    } : undefined, // Ne pas créer d'objet price si aucun prix n'est disponible
    imageUrl: event.imageUrl || null,
    ticketUrl: event.url || '#',
    organizerId: event.organizerId || 'default',
    organizer: { 
      id: event.organizerId || 'default',
      email: event.organizer?.user?.email || 'api@pulse.com',
      name: event.organizer?.user?.name || event.organizer?.displayName || event.source || 'Organisateur',
      role: 'organizer' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    organizerSlug: event.organizer?.slug || null,
    customFilters: [],
    accessibility: [],
    status: 'published' as const,
    source: event.source,
    externalId: event.id,
    language: 'fr' as const,
    minAttendees: Math.floor(Math.random() * 100),
    maxAttendees: Math.floor(Math.random() * 2000) + 1000,
    promotions: event.promotions?.map(p => ({
      id: p.id,
      kind: p.kind,
      status: p.status,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export interface UseEventsOptions {
  /** Inclure les événements passés (false par défaut = uniquement les futurs) */
  includePast?: boolean;
}

// Hook principal pour récupérer les événements (par défaut: uniquement futurs)
export const useEvents = (options: UseEventsOptions = {}) => {
  const includePast = options.includePast ?? false;

  return useQuery({
    queryKey: ['events', includePast],
    queryFn: async (): Promise<Event[]> => {
      const futureOnly = !includePast;
      const allEvents: ApiEvent[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) {
        const params = new URLSearchParams({
          pageSize: '100',
          page: String(page),
          futureOnly: String(futureOnly),
        });
        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        allEvents.push(...(data.items || []));
        hasMore = page < data.totalPages;
        page++;
      }

      return allEvents.map(transformApiEvent);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Hook pour précharger les données
export const usePrefetchEvents = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['events', false],
      queryFn: async (): Promise<Event[]> => {
        const response = await fetch('/api/events?pageSize=200&futureOnly=true');
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        return data.items?.map(transformApiEvent) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook pour invalider le cache (pour forcer un refresh)
export const useRefreshEvents = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };
};

// Hook pour les événements avec filtrage local (plus rapide)
export const useFilteredEvents = (
  searchQuery?: string,
  category?: string,
  sortBy?: 'date' | 'name' | 'price'
) => {
  const { data: events = [], isLoading, error } = useEvents();
  
  const filteredEvents = events.filter(event => {
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!event.title.toLowerCase().includes(query) && 
          !event.description.toLowerCase().includes(query) &&
          !event.tags.some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Filtre par catégorie
    if (category && category !== 'Toutes') {
      if (event.category !== category) {
        return false;
      }
    }
    
    return true;
  });
  
  // Tri local
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'price':
        return a.price.amount - b.price.amount;
      case 'date':
      default:
        return a.startDate.getTime() - b.startDate.getTime();
    }
  });
  
  return {
    events: sortedEvents,
    isLoading,
    error,
    total: sortedEvents.length
  };
};
