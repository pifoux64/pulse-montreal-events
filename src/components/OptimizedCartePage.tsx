'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Event, EventFilter, EventCategory, MapViewState } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import { MapPin, List, Map, Filter, X } from 'lucide-react';
import { usePersistentFilters } from '@/hooks/usePersistentFilters';

// Fonction de calcul de distance (hors composant pour éviter les re-créations)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Import dynamique de la carte stable pour éviter les erreurs SSR
const StableEventMap = dynamic(() => import('@/components/StableEventMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  )
});

// Catégories avec plus de genres musicaux pour les filtres
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

export default function OptimizedCartePage() {
  // Utilisation du hook React Query optimisé
  const { data: events = [], isLoading: loading, error } = useEvents();
  
  // Système de favoris
  const { isFavorite, toggleFavorite } = useFavorites(events);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const { filters, setFilters } = usePersistentFilters();
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    center: [45.5017, -73.5673], // Centre de Montréal
    zoom: 12
  });
  const [showFilters, setShowFilters] = useState(true);
  const [showEventList, setShowEventList] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [locationEvents, setLocationEvents] = useState<Event[] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Stabiliser les dépendances avec useMemo
  const stableFilters = useMemo(() => JSON.stringify(filters), [filters]);
  const stableUserLocation = useMemo(() => 
    userLocation ? `${userLocation[0]},${userLocation[1]}` : null, 
    [userLocation]
  );

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...events];

    // ===== FILTRE DE RECHERCHE TEXTUELLE =====
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query)) ||
        event.location?.name?.toLowerCase().includes(query) ||
        (event as any).venue?.name?.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.subCategory?.toLowerCase().includes(query)
      );
    }

    // ===== FILTRE PAR CATÉGORIE =====
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event => 
        filters.categories!.includes(event.category)
      );
    }

    // ===== FILTRE PAR SOUS-CATÉGORIE =====
    if (filters.subCategories && filters.subCategories.length > 0) {
      filtered = filtered.filter(event => {
        // Vérifier si l'événement a une sous-catégorie qui correspond
        const eventSubCategory = event.subCategory || (event as any).subcategory;
        if (eventSubCategory) {
          return filters.subCategories!.some(subCat => 
            eventSubCategory.toLowerCase() === subCat.toLowerCase()
          );
        }
        
        // Si pas de sous-catégorie exacte, chercher dans les tags et la description
        return filters.subCategories!.some(subCat => 
          event.tags?.some(tag => tag.toLowerCase().includes(subCat.toLowerCase())) ||
          event.description.toLowerCase().includes(subCat.toLowerCase()) ||
          event.title.toLowerCase().includes(subCat.toLowerCase())
        );
      });
    }

    // ===== FILTRE PAR PRIX (ÉVÉNEMENTS GRATUITS) =====
    if (showFreeOnly) {
      filtered = filtered.filter(event => 
        event.price?.isFree === true || 
        event.price?.amount === 0 ||
        (event as any).priceMin === 0
      );
    }

    // ===== FILTRE PAR FOURCHETTE DE PRIX =====
    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
      filtered = filtered.filter(event => {
        const eventPrice = event.price?.amount || (event as any).priceMin || 0;
        const minPrice = filters.priceRange?.min || 0;
        const maxPrice = filters.priceRange?.max || Infinity;
        return eventPrice >= minPrice && eventPrice <= maxPrice;
      });
    }

    // ===== FILTRE PAR DATES =====
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange?.start && eventDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end && eventDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // ===== FILTRE PAR PUBLIC CIBLE =====
    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter(event => {
        // Vérifier dans les tags de l'événement
        const eventTags = event.tags.map(tag => tag.toLowerCase());
        const hasAudienceMatch = filters.targetAudience!.some(audience => {
          const audienceLower = audience.toLowerCase();
          return eventTags.some(tag => 
            tag.includes(audienceLower) || 
            (tag.includes('famille') && audienceLower === 'famille') ||
            (tag.includes('enfant') && audienceLower === 'enfant') ||
            (tag.includes('adult') && audienceLower === 'adulte') ||
            (tag.includes('étudiant') && audienceLower === 'étudiant') ||
            (tag.includes('senior') && audienceLower === 'senior')
          );
        });
        
        // Vérifier aussi dans la description pour des mots-clés
        const description = event.description.toLowerCase();
        const hasDescriptionMatch = filters.targetAudience!.some(audience => {
          const audienceLower = audience.toLowerCase();
          return description.includes(audienceLower) ||
            (audienceLower === 'famille' && (description.includes('famille') || description.includes('enfant'))) ||
            (audienceLower === 'enfant' && (description.includes('enfant') || description.includes('kid'))) ||
            (audienceLower === 'adulte' && description.includes('adult')) ||
            (audienceLower === 'étudiant' && (description.includes('étudiant') || description.includes('student'))) ||
            (audienceLower === 'senior' && description.includes('senior'));
        });

        return hasAudienceMatch || hasDescriptionMatch;
      });
    }

    // ===== FILTRE PAR ACCESSIBILITÉ =====
    if (filters.accessibility && Object.values(filters.accessibility).some(Boolean)) {
      filtered = filtered.filter(event => {
        // Vérifier dans les tags et description pour les termes d'accessibilité
        const eventText = `${event.description} ${event.tags.join(' ')}`.toLowerCase();
        
        let hasAccessibilityMatch = false;
        
        if (filters.accessibility?.wheelchairAccessible) {
          hasAccessibilityMatch = hasAccessibilityMatch || 
            eventText.includes('accessible') || 
            eventText.includes('fauteuil roulant') ||
            eventText.includes('wheelchair') ||
            eventText.includes('handicap');
        }
        
        if (filters.accessibility?.hearingAssistance) {
          hasAccessibilityMatch = hasAccessibilityMatch || 
            eventText.includes('malentendant') || 
            eventText.includes('sourd') ||
            eventText.includes('hearing') ||
            eventText.includes('audio');
        }
        
        if (filters.accessibility?.visualAssistance) {
          hasAccessibilityMatch = hasAccessibilityMatch || 
            eventText.includes('malvoyant') || 
            eventText.includes('aveugle') ||
            eventText.includes('braille') ||
            eventText.includes('visual');
        }
        
        if (filters.accessibility?.quietSpace) {
          hasAccessibilityMatch = hasAccessibilityMatch || 
            eventText.includes('calme') || 
            eventText.includes('quiet') ||
            eventText.includes('silence');
        }

        // Si aucun filtre d'accessibilité spécifique n'est sélectionné, inclure tous les événements
        return Object.values(filters.accessibility || {}).every(v => !v) || hasAccessibilityMatch;
      });
    }

    // ===== FILTRE PAR LOCALISATION =====
    if (filters.location && userLocation) {
      const radius = filters.location.radius || 10;
      filtered = filtered.filter(event => {
        // Support pour les deux structures de coordonnées
        const lat = event.location?.coordinates?.lat || (event as any).lat;
        const lng = event.location?.coordinates?.lng || (event as any).lon;
        
        if (!lat || !lng) return true; // Garder l'événement si pas de coordonnées
        
        const distance = calculateDistance(
          userLocation[0],
          userLocation[1],
          lat,
          lng
        );
        return distance <= radius;
      });
    }

    console.log(`🔍 Filtrage: ${events.length} → ${filtered.length} événements (Public: ${filters.targetAudience?.length || 0}, Accessibilité: ${filters.accessibility ? Object.values(filters.accessibility).filter(Boolean).length : 0})`);
    setFilteredEvents(filtered);
  }, [events, stableFilters, stableUserLocation, filters, userLocation, showFreeOnly]);

  // Gestionnaires d'événements stables
  const handleFiltersChange = useCallback((newFilters: EventFilter) => {
    setFilters(newFilters);
  }, []);

  const handleLocationDetect = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          // Ne pas changer mapViewState pour éviter les re-renders
          // La carte se centrera automatiquement via StableEventMap
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }, []);

  const handleFavoriteToggle = useCallback((eventId: string) => {
    toggleFavorite(eventId);
    console.log('Toggle favori pour l\'événement:', eventId);
  }, [toggleFavorite]);

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setLocationEvents(null); // Fermer le panneau de lieu si ouvert
    setShowEventList(false); // Fermer la sidebar
  }, []);

  const handleLocationClick = useCallback((events: Event[], locationName: string) => {
    setLocationEvents(events);
    setLocationName(locationName);
    setSelectedEvent(null); // Fermer le popup d'événement si ouvert
    setShowEventList(true); // Afficher le panneau latéral
    console.log(`Lieu sélectionné: ${locationName} avec ${events.length} événements`);
  }, []);

  const handleMapViewChange = useCallback((viewState: MapViewState) => {
    // Ne pas mettre à jour mapViewState pour éviter les boucles infinies
    // La carte gère sa propre vue interne
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="min-h-screen pt-24">
        <div className="flex h-[calc(100vh-6rem)]">
          {/* Panneau des filtres */}
          <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <EventFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={mockCategories}
                onLocationDetect={handleLocationDetect}
              />
            </div>
          </div>

          {/* Zone principale avec la carte */}
          <div className="flex-1 relative">
            {/* Barre d'outils */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtres</span>
                </button>
              )}
              
              {showFilters && <div></div>}
              
              {loading && (
                <div className="p-2 bg-white rounded-lg shadow-md flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Chargement...</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {/* Filtre événements gratuits */}
                <label className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                  <input
                    type="checkbox"
                    checked={showFreeOnly}
                    onChange={(e) => setShowFreeOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Gratuit seulement</span>
                </label>
                
                {/* Compteur d'événements */}
                {!loading && (
                  <div className="px-3 py-2 bg-white rounded-lg shadow-md">
                    <span className="text-sm font-medium text-gray-900">
                      {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte stable sans bugs */}
            <StableEventMap
              events={filteredEvents}
              center={[45.5017, -73.5673]} // Centre fixe de Montréal
              zoom={12} // Zoom initial fixe
              onEventClick={handleEventClick}
              onLocationClick={handleLocationClick}
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {locationEvents ? `${locationName}` : 'Événements'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locationEvents ? 
                        `${locationEvents.length} événement${locationEvents.length !== 1 ? 's' : ''} à ce lieu` :
                        `${filteredEvents.length} événement${filteredEvents.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {locationEvents && (
                      <button
                        onClick={() => {
                          setLocationEvents(null);
                          setLocationName('');
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-500"
                        title="Voir tous les événements"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowEventList(false);
                        setLocationEvents(null);
                        setLocationName('');
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="h-full overflow-y-auto">
                {(locationEvents || filteredEvents).length > 0 ? (
                  <div className="p-4 space-y-4">
                    {(locationEvents || filteredEvents).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onFavoriteToggle={handleFavoriteToggle}
                        onEventClick={handleEventClick}
                        isFavorite={isFavorite(event.id)}
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

      {/* Modal événement */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={selectedEvent ? isFavorite(selectedEvent.id) : false}
      />
    </div>
  );
}
