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
    lat: number;
    lon: number;
  };
  address?: string;
  city?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  priceMin?: number;
  currency?: string;
  imageUrl?: string;
  url?: string;
  organizerId?: string;
  source: string;
  lat?: number;
  lon?: number;
}

interface ApiResponse {
  items: ApiEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fonction de transformation des données API vers le format frontend
const transformApiEvent = (event: ApiEvent): Event => ({
  id: event.id,
  title: event.title,
  description: event.description || '',
  shortDescription: event.description?.substring(0, 100) + '...' || '',
  startDate: new Date(event.startAt),
  endDate: event.endAt ? new Date(event.endAt) : null,
  location: {
    name: event.venue?.name || event.address || '',
    address: event.address || '',
    city: event.city || 'Montréal',
    postalCode: '',
    coordinates: { 
      lat: event.venue?.lat || event.lat || 45.5088, 
      lng: event.venue?.lon || event.lon || -73.5542 
    }
  },
  category: event.category === 'music' ? 'Musique' : 
           event.category === 'arts & theatre' ? 'Art & Culture' :
           event.category === 'sports' ? 'Sport' :
           event.category === 'family' ? 'Famille' :
           event.category === 'community' ? 'Art & Culture' :
           event.category === 'education' ? 'Famille' :
           event.category === 'miscellaneous' ? 'Autre' : 'Musique',
  subCategory: event.tags && event.tags.length > 0 ? event.tags[0] : '',
  tags: event.tags || [],
  price: { 
    amount: event.priceMin !== null && event.priceMin !== undefined ? event.priceMin : 0, 
    currency: event.currency || 'CAD', 
    // Un événement est gratuit seulement si priceMin est explicitement 0
    // Si priceMin est null/undefined, on ne sait pas, donc on considère comme payant par défaut
    isFree: event.priceMin === 0 && (event.priceMax === null || event.priceMax === 0 || event.priceMax === undefined)
  },
  imageUrl: event.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  ticketUrl: event.url || '#',
  organizerId: event.organizerId || 'default',
  organizer: { 
    id: event.organizerId || 'default',
    email: 'api@pulse.com',
    name: event.source,
    role: 'organizer' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  customFilters: [],
  accessibility: [],
  status: 'published' as const,
  source: event.source,
  externalId: event.id,
  language: 'fr' as const,
  minAttendees: Math.floor(Math.random() * 100),
  maxAttendees: Math.floor(Math.random() * 2000) + 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Hook principal pour récupérer tous les événements
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const response = await fetch('/api/events-simple');
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      return data.items?.map(transformApiEvent) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
  });
};

// Hook pour précharger les données
export const usePrefetchEvents = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['events'],
      queryFn: async (): Promise<Event[]> => {
        const response = await fetch('/api/events-simple');
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
