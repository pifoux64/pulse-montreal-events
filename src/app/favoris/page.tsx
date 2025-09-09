'use client';

import { useState, useEffect } from 'react';
import { Event, EventFilter, EventCategory } from '@/types';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import { Heart, Filter, Trash2, Share2, Calendar, MapPin } from 'lucide-react';

// Données de test pour le développement
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#e74c3c',
    subCategories: [
      { id: '1-1', name: 'Reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-2', name: 'Jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-3', name: 'Rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-4', name: 'Électronique', nameEn: 'Electronic', categoryId: '1' },
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

// Événements favoris de test
const mockFavoriteEvents: Event[] = [
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
  }
];

export default function FavorisPage() {
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>(mockFavoriteEvents);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(mockFavoriteEvents);
  const [filters, setFilters] = useState<EventFilter>({});
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Application des filtres
  useEffect(() => {
    let filtered = [...favoriteEvents];

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

    setFilteredEvents(filtered);
  }, [favoriteEvents, filters]);

  const handleFavoriteToggle = (eventId: string) => {
    setFavoriteEvents(prev => prev.filter(event => event.id !== eventId));
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const handleEventClick = (event: Event) => {
    // TODO: Navigation vers la page de détails
    console.log('Clic sur l\'événement:', event.title);
  };

  const handleSelectEvent = (eventId: string) => {
    if (isSelectMode) {
      setSelectedEvents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
    }
  };

  const handleRemoveSelected = () => {
    if (selectedEvents.size > 0) {
      if (confirm(`Êtes-vous sûr de vouloir retirer ${selectedEvents.size} événement(s) de vos favoris ?`)) {
        setFavoriteEvents(prev => prev.filter(event => !selectedEvents.has(event.id)));
        setSelectedEvents(new Set());
        setIsSelectMode(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(event => event.id)));
    }
  };

  const handleShareSelected = () => {
    if (selectedEvents.size > 0) {
      const eventTitles = Array.from(selectedEvents)
        .map(id => favoriteEvents.find(event => event.id === id)?.title)
        .filter(Boolean)
        .join(', ');
      
      const shareText = `Voici mes événements favoris : ${eventTitles}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Mes événements favoris',
          text: shareText,
        });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API de partage
        navigator.clipboard.writeText(shareText);
        alert('Liste copiée dans le presse-papiers !');
      }
    }
  };

  const handleExportCalendar = () => {
    if (selectedEvents.size > 0) {
      const selectedEventList = Array.from(selectedEvents)
        .map(id => favoriteEvents.find(event => event.id === id))
        .filter(Boolean) as Event[];
      
      // Génération d'un fichier ICS simple
      let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Montreal Events//FR\n';
      
      selectedEventList.forEach(event => {
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        icsContent += `DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        icsContent += `SUMMARY:${event.title}\n`;
        icsContent += `DESCRIPTION:${event.description}\n`;
        icsContent += `LOCATION:${event.location.name}, ${event.location.address}\n`;
        icsContent += `END:VEVENT\n`;
      });
      
      icsContent += 'END:VCALENDAR';
      
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evenements-favoris.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mes Favoris
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Retrouvez tous vos événements favoris et organisez vos sorties
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{favoriteEvents.length}</p>
                <p className="text-sm text-gray-600">Total favoris</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {favoriteEvents.filter(event => new Date(event.startDate) > new Date()).length}
                </p>
                <p className="text-sm text-gray-600">À venir</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(favoriteEvents.map(event => event.location.city)).size}
                </p>
                <p className="text-sm text-gray-600">Villes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {favoriteEvents.filter(event => event.price.isFree).length}
                </p>
                <p className="text-sm text-gray-600">Gratuits</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <EventFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={mockCategories}
                onLocationDetect={() => {}}
              />
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Masquer' : 'Afficher'} les filtres</span>
                </button>
                
                <span className="text-gray-600">
                  {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} favori{filteredEvents.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Mode sélection */}
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedEvents(new Set());
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isSelectMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {isSelectMode ? 'Annuler' : 'Sélectionner'}
                </button>

                {/* Actions en mode sélection */}
                {isSelectMode && selectedEvents.size > 0 && (
                  <>
                    <button
                      onClick={handleRemoveSelected}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Retirer ({selectedEvents.size})</span>
                    </button>
                    
                    <button
                      onClick={handleShareSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Partager</span>
                    </button>
                    
                    <button
                      onClick={handleExportCalendar}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Exporter</span>
                    </button>
                  </>
                )}

                {/* Mode d'affichage */}
                <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-4 h-4 flex flex-col space-y-1">
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 bg-current rounded"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sélection multiple */}
            {isSelectMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.size === filteredEvents.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedEvents.size === filteredEvents.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                      </span>
                    </label>
                    <span className="text-sm text-blue-700">
                      {selectedEvents.size} événement(s) sélectionné(s)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grille des événements */}
            {filteredEvents.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredEvents.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Checkbox de sélection */}
                    {isSelectMode && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(event.id)}
                          onChange={() => handleSelectEvent(event.id)}
                          className="w-5 h-5 rounded border-2 border-white bg-white shadow-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <EventCard
                      event={event}
                      onFavoriteToggle={handleFavoriteToggle}
                      onEventClick={handleEventClick}
                      showImage={viewMode === 'grid'}
                      isFavorite={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun événement favori trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  {favoriteEvents.length === 0 
                    ? 'Vous n\'avez pas encore d\'événements favoris. Parcourez les événements et ajoutez-les à vos favoris !'
                    : 'Aucun événement ne correspond à vos filtres actuels.'
                  }
                </p>
                {favoriteEvents.length === 0 && (
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Découvrir des événements
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

