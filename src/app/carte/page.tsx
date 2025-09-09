'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Event, EventFilter, EventCategory, MapViewState } from '@/types';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import { MapPin, List, Map, Filter, X } from 'lucide-react';

// Import dynamique de la nouvelle carte moderne pour éviter les erreurs SSR
const ModernEventMap = dynamic(() => import('@/components/ModernEventMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-600">Chargement de la carte moderne...</p>
      </div>
    </div>
  )
});

// Données de test (mêmes que la page d'accueil)
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#e74c3c',
    subCategories: [
      { id: '1-1', name: 'reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-2', name: 'jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-3', name: 'rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-4', name: 'electronic', nameEn: 'Electronic', categoryId: '1' },
      { id: '1-5', name: 'pop', nameEn: 'Pop', categoryId: '1' },
      { id: '1-6', name: 'hip-hop', nameEn: 'Hip-Hop', categoryId: '1' },
      { id: '1-7', name: 'classical', nameEn: 'Classical', categoryId: '1' },
      { id: '1-8', name: 'folk', nameEn: 'Folk', categoryId: '1' },
      { id: '1-9', name: 'alternative', nameEn: 'Alternative', categoryId: '1' },
      { id: '1-10', name: 'indie', nameEn: 'Indie', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Art & Culture',
    nameEn: 'Art & Culture',
    icon: '🎨',
    color: '#9b59b6',
    subCategories: [
      { id: '2-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: '2' },
      { id: '2-2', name: 'Théâtre', nameEn: 'Theater', categoryId: '2' },
      { id: '2-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Sport',
    nameEn: 'Sports',
    icon: '⚽',
    color: '#3498db',
    subCategories: [
      { id: '3-1', name: 'Football', nameEn: 'Soccer', categoryId: '3' },
      { id: '3-2', name: 'Basketball', nameEn: 'Basketball', categoryId: '3' },
      { id: '3-3', name: 'Course', nameEn: 'Running', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Famille',
    nameEn: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f39c12',
    subCategories: [
      { id: '4-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: '4' },
      { id: '4-2', name: 'Parcs', nameEn: 'Parks', categoryId: '4' },
      { id: '4-3', name: 'Éducation', nameEn: 'Education', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Gastronomie',
    nameEn: 'Food & Drink',
    icon: '🍽️',
    color: '#e67e22',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
    ]
  }
];

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Festival Reggae Montréal 2024',
    description: 'Le plus grand festival de reggae de l\'été à Montréal ! Venez danser au rythme des meilleurs artistes internationaux.',
    shortDescription: 'Festival de reggae avec artistes internationaux',
    startDate: new Date('2024-08-15T18:00:00'),
    endDate: new Date('2024-08-15T23:00:00'),
    location: {
      name: 'Parc Jean-Drapeau',
      address: '1 Circuit Gilles Villeneuve',
      city: 'Montréal',
      postalCode: 'H3C 1A9',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Musique',
    subCategory: 'Reggae',
    tags: ['reggae', 'festival', 'été', 'plein air'],
    price: { amount: 45, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/tickets',
    organizerId: 'org1',
    organizer: { id: 'org1', email: 'org@example.com', name: 'Festival Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      hearingAssistance: false,
      visualAssistance: false,
      quietSpace: false,
      genderNeutralBathrooms: true,
      other: []
    },
    targetAudience: ['Adulte', 'Famille'],
    maxCapacity: 5000,
    currentAttendees: 3200,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Exposition d\'Art Contemporain',
    description: 'Découvrez les œuvres des artistes montréalais les plus prometteurs dans cette exposition unique.',
    shortDescription: 'Exposition d\'art contemporain montréalais',
    startDate: new Date('2024-08-16T10:00:00'),
    endDate: new Date('2024-08-16T18:00:00'),
    location: {
      name: 'Musée d\'Art Contemporain',
      address: '185 Rue Sainte-Catherine Ouest',
      city: 'Montréal',
      postalCode: 'H2X 1K4',
      coordinates: { lat: 45.5017, lng: -73.5673 }
    },
    category: 'Art & Culture',
    subCategory: 'Exposition',
    tags: ['art', 'contemporain', 'musée', 'culture'],
    price: { amount: 15, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/tickets',
    organizerId: 'org2',
    organizer: { id: 'org2', email: 'org2@example.com', name: 'MAC Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      hearingAssistance: true,
      visualAssistance: true,
      quietSpace: true,
      genderNeutralBathrooms: true,
      other: []
    },
    targetAudience: ['Adulte', 'Famille', 'Étudiant'],
    maxCapacity: 200,
    currentAttendees: 45,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Match de Basketball - Impact vs Alouettes',
    description: 'Venez encourager l\'équipe locale dans ce match passionnant de basketball !',
    shortDescription: 'Match de basketball professionnel',
    startDate: new Date('2024-08-17T19:30:00'),
    endDate: new Date('2024-08-17T22:00:00'),
    location: {
      name: 'Centre Bell',
      address: '1909 Avenue des Canadiens-de-Montréal',
      city: 'Montréal',
      postalCode: 'H4B 5G0',
      coordinates: { lat: 45.4961, lng: -73.5694 }
    },
    category: 'Sport',
    subCategory: 'Basketball',
    tags: ['basketball', 'sport', 'match', 'équipe locale'],
    price: { amount: 35, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/tickets',
    organizerId: 'org3',
    organizer: { id: 'org3', email: 'org3@example.com', name: 'Centre Bell', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      hearingAssistance: false,
      visualAssistance: false,
      quietSpace: false,
      genderNeutralBathrooms: true,
      other: []
    },
    targetAudience: ['Adulte', 'Famille'],
    maxCapacity: 21000,
    currentAttendees: 18500,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function CartePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilter>({});
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    center: [45.5017, -73.5673], // Centre de Montréal
    zoom: 12
  });
  const [showFilters, setShowFilters] = useState(true);
  const [showEventList, setShowEventList] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les événements depuis l'API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const response = await fetch('/api/events-simple');
        if (response.ok) {
          const data = await response.json();
          // Convertir les données de l'API au format attendu par le frontend
          const formattedEvents = data.items?.map((event: any) => ({
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
              amount: event.priceMin || 0, 
              currency: event.currency || 'CAD', 
              isFree: !event.priceMin || event.priceMin === 0 
            },
            imageUrl: event.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            ticketUrl: event.url || '#',
            organizerId: event.organizerId || 'default',
            organizer: { 
              id: event.organizerId || 'default', 
              email: 'organizer@example.com', 
              name: 'Organisateur', 
              role: 'organizer' as const, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            customFilters: [],
            accessibility: {
              wheelchairAccessible: event.accessibility?.includes('wheelchair') || false,
              hearingAssistance: event.accessibility?.includes('hearing') || false,
              visualAssistance: event.accessibility?.includes('visual') || false,
              quietSpace: false,
              genderNeutralBathrooms: false,
              other: []
            },
            targetAudience: ['Adulte'],
            maxCapacity: Math.floor(Math.random() * 2000) + 1000,
            currentAttendees: Math.floor(Math.random() * 1000) + 50,
            isActive: true,
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt)
          })) || [];
          
          setEvents(formattedEvents);
          setFilteredEvents(formattedEvents);
          console.log(`✅ ${formattedEvents.length} événements chargés sur la carte`);
        } else {
          // Fallback vers les données statiques si l'API échoue
          setEvents(mockEvents);
          setFilteredEvents(mockEvents);
          setError('API non disponible, utilisation des données de test');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setEvents(mockEvents);
        setFilteredEvents(mockEvents);
        setError('Erreur de connexion, utilisation des données de test');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Détection de la localisation de l'utilisateur
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapViewState(prev => ({
            ...prev,
            center: [latitude, longitude],
            zoom: 14
          }));
          setFilters(prev => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              radius: 5
            }
          }));
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible de détecter votre position. Veuillez la saisir manuellement.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  // Application des filtres
  useEffect(() => {
    let filtered = [...events];

    // Filtre par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query)) ||
        event.location.name.toLowerCase().includes(query)
      );
    }

    // Filtre par catégories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event =>
        filters.categories!.includes(event.category)
      );
    }

    // Filtre par sous-catégories
    if (filters.subCategories && filters.subCategories.length > 0) {
      filtered = filtered.filter(event =>
        event.subCategory && filters.subCategories!.includes(event.subCategory)
      );
    }

    // Filtre par dates
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange?.start && eventDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end && eventDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Filtre par prix
    if (filters.priceRange?.min || filters.priceRange?.max) {
      filtered = filtered.filter(event => {
        if (filters.priceRange?.min && event.price.amount < filters.priceRange.min) return false;
        if (filters.priceRange?.max && event.price.amount > filters.priceRange.max) return false;
        return true;
      });
    }

    // Filtre par localisation (rayon)
    if (filters.location && userLocation) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (filters.location.lat - userLocation[0]) * Math.PI / 180;
      const dLon = (filters.location.lng - userLocation[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(filters.location.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance > filters.location.radius) {
        filtered = filtered.filter(event => {
          const eventLat = event.location.coordinates.lat;
          const eventLng = event.location.coordinates.lng;
          const dLat = (eventLat - userLocation[0]) * Math.PI / 180;
          const dLon = (eventLng - userLocation[1]) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const eventDistance = R * c;
          return eventDistance <= filters.location.radius;
        });
      }
    }

    // Filtre par public cible
    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter(event =>
        event.targetAudience.some(audience =>
          filters.targetAudience!.includes(audience)
        )
      );
    }

    // Filtre par accessibilité
    if (filters.accessibility) {
      Object.entries(filters.accessibility).forEach(([key, value]) => {
        if (value === true) {
          filtered = filtered.filter(event =>
            event.accessibility[key as keyof typeof event.accessibility] === true
          );
        }
      });
    }

    setFilteredEvents(filtered);
  }, [events, filters, userLocation]);

  const handleFavoriteToggle = (eventId: string) => {
    // TODO: Implémenter la logique des favoris
    console.log('Toggle favori pour l\'événement:', eventId);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventList(true);
  };

  const handleMapViewChange = (viewState: MapViewState) => {
    setMapViewState(viewState);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Filtres */}
          <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
            <div className="p-4 h-full overflow-y-auto">
              <EventFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={mockCategories}
                onLocationDetect={detectUserLocation}
              />
            </div>
          </div>

          {/* Carte principale */}
          <div className="flex-1 relative">
            {/* Barre d'outils */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors duration-200"
                title={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              >
                <Filter className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowEventList(!showEventList)}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                title={showEventList ? 'Masquer la liste' : 'Afficher la liste'}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">{filteredEvents.length}</span>
              </button>
              
              {/* Indicateur de chargement */}
              {loading && (
                <div className="p-2 bg-white rounded-lg shadow-md flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Chargement...</span>
                </div>
              )}
              
              {/* Compteur d'événements */}
              {!loading && (
                <div className="px-3 py-2 bg-white rounded-lg shadow-md">
                  <span className="text-sm font-medium text-gray-900">
                    {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Carte */}
            <ModernEventMap
              events={filteredEvents}
              center={mapViewState.center}
              zoom={mapViewState.zoom}
              onEventClick={handleEventClick}
              onMapViewChange={handleMapViewChange}
              userLocation={userLocation}
              searchRadius={filters.location?.radius}
            />
          </div>

          {/* Liste des événements (panneau latéral) */}
          {showEventList && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Événements ({filteredEvents.length})
                  </h3>
                  <button
                    onClick={() => setShowEventList(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="h-full overflow-y-auto">
                {filteredEvents.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onFavoriteToggle={handleFavoriteToggle}
                        onEventClick={handleEventClick}
                        showImage={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun événement trouvé dans cette zone</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
