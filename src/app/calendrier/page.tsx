'use client';

import { useState, useEffect, useMemo } from 'react';
import { Event, EventFilter, EventCategory } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import { Calendar, Filter, ChevronLeft, ChevronRight, MapPin, Clock, Users, Heart } from 'lucide-react';

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

// Les événements sont maintenant chargés via l'API useEvents()

export default function CalendrierPage() {
  // Utilisation de l'API réelle comme sur la carte
  const { data: events = [], isLoading, error } = useEvents();
  
  // Système de favoris
  const { isFavorite, toggleFavorite } = useFavorites(events);
  
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilter>({});
  const [showFilters, setShowFilters] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialiser les événements filtrés quand les événements arrivent
  useEffect(() => {
    if (events.length > 0) {
      setFilteredEvents(events);
    }
  }, [events]);

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

    setFilteredEvents(filtered);
  }, [events, filters]);

  // Navigation dans le calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Génération des jours du mois
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    while (currentDateObj <= lastDay || days.length < 42) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Événements par jour
  const eventsByDay = useMemo(() => {
    const eventsMap = new Map<string, Event[]>();
    
    filteredEvents.forEach(event => {
      const dateKey = event.startDate.toISOString().split('T')[0];
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)!.push(event);
    });
    
    return eventsMap;
  }, [filteredEvents]);

  // Événements du jour sélectionné
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return eventsByDay.get(dateKey) || [];
  }, [selectedDate, eventsByDay]);

  const handleFavoriteToggle = (eventId: string) => {
    toggleFavorite(eventId);
    console.log('Toggle favori pour l\'événement:', eventId);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'musique': 'bg-red-100 text-red-800',
      'art': 'bg-purple-100 text-purple-800',
      'sport': 'bg-blue-100 text-blue-800',
      'famille': 'bg-orange-100 text-orange-800',
      'culture': 'bg-teal-100 text-teal-800',
      'gastronomie': 'bg-amber-100 text-amber-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des événements...</span>
          </div>
        </main>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <Calendar className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Erreur de chargement</h2>
              <p className="text-gray-600 mt-2">Impossible de charger les événements. Veuillez réessayer.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Calendrier des événements
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Visualisez tous les événements de Montréal dans un calendrier interactif
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-28">
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
            {/* Barre d'outils du calendrier */}
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
                  {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Navigation du calendrier */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Aujourd'hui
                  </button>
                  
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode d'affichage */}
                <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                      viewMode === 'month' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                      viewMode === 'week' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                      viewMode === 'day' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>

            {/* Titre du mois */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('fr-CA', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
            </div>

            {/* Grille du calendrier */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* En-têtes des jours de la semaine */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Jours du mois */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                  const dateKey = date.toISOString().split('T')[0];
                  const dayEvents = eventsByDay.get(dateKey) || [];
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors duration-200 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      } ${
                        !isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : ''
                      }`}
                    >
                      {/* Numéro du jour */}
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(date) ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                      }`}>
                        {date.getDate()}
                      </div>

                      {/* Événements du jour */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getCategoryColor(event.category)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 2} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Événements du jour sélectionné */}
            {selectedDate && (
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Événements du {formatDate(selectedDate)}
                  </h3>
                  
                  {selectedDayEvents.length > 0 ? (
                    <div className="grid gap-4">
                      {selectedDayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          {event.imageUrl && (
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {event.title}
                            </h4>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location.name}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>{event.category}</span>
                                {event.subCategory && (
                                  <span className="text-gray-500">• {event.subCategory}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteToggle(event.id);
                              }}
                              className={`p-2 transition-colors duration-200 ${
                                isFavorite(event.id) 
                                  ? 'text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isFavorite(event.id) ? 'fill-current' : ''}`} />
                            </button>
                            
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(event.category)}`}>
                              {event.price.isFree ? 'Gratuit' : `${event.price.amount} ${event.price.currency}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun événement prévu pour cette date</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal des événements */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={selectedEvent ? isFavorite(selectedEvent.id) : false}
      />
    </div>
  );
}

