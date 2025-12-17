'use client';

import { Suspense, useState, useMemo } from 'react';
import { Event, EventCategory } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import { Calendar, Filter, ChevronLeft, ChevronRight, MapPin, Clock, Users, Heart, Loader2 } from 'lucide-react';
import { usePersistentFilters } from '@/hooks/usePersistentFilters';
import { useRouter } from 'next/navigation';

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
      { id: '1-5', name: 'Pop', nameEn: 'Pop', categoryId: '1' },
      { id: '1-6', name: 'Hip-hop', nameEn: 'Hip-hop', categoryId: '1' },
      { id: '1-7', name: 'Rap', nameEn: 'Rap', categoryId: '1' },
      { id: '1-8', name: 'Classique', nameEn: 'Classical', categoryId: '1' },
      { id: '1-9', name: 'Indie', nameEn: 'Indie', categoryId: '1' },
      { id: '1-10', name: 'Folk', nameEn: 'Folk', categoryId: '1' },
      { id: '1-11', name: 'Blues', nameEn: 'Blues', categoryId: '1' },
      { id: '1-12', name: 'Metal', nameEn: 'Metal', categoryId: '1' },
      { id: '1-13', name: 'R&B / Soul', nameEn: 'R&B / Soul', categoryId: '1' },
      { id: '1-14', name: 'Country', nameEn: 'Country', categoryId: '1' },
      { id: '1-15', name: 'Latino', nameEn: 'Latin', categoryId: '1' },
      { id: '1-16', name: 'Musique du monde', nameEn: 'World Music', categoryId: '1' },
      { id: '1-17', name: 'Ambient / Chill', nameEn: 'Ambient / Chill', categoryId: '1' },
      { id: '1-18', name: 'House & Techno', nameEn: 'House & Techno', categoryId: '1' },
      { id: '1-19', name: 'Chorale / Vocal', nameEn: 'Choir / Vocal', categoryId: '1' },
      { id: '1-20', name: 'Expérimental', nameEn: 'Experimental', categoryId: '1' },
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

function CalendrierPageContent() {
  // Utilisation de l'API réelle comme sur la carte
  const { data: events = [], isLoading, error } = useEvents();
  const router = useRouter();
  
  // Système de favoris
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  const { filters, setFilters } = usePersistentFilters();
  const [showFilters, setShowFilters] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Application des filtres (dérivé, sans setState pour éviter les boucles)
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filtre par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        event.location.name.toLowerCase().includes(query),
      );
    }

    // Filtre par catégories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((event) => filters.categories!.includes(event.category));
    }

    // Filtre par sous-catégories
    if (filters.subCategories && filters.subCategories.length > 0) {
      filtered = filtered.filter(
        (event) => event.subCategory && filters.subCategories!.includes(event.subCategory),
      );
    }

    // Filtre par dates
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange?.start && eventDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end && eventDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Filtre par prix
    if (filters.priceRange?.min || filters.priceRange?.max) {
      filtered = filtered.filter((event) => {
        if (filters.priceRange?.min && event.price.amount < filters.priceRange.min) return false;
        if (filters.priceRange?.max && event.price.amount > filters.priceRange.max) return false;
        return true;
      });
    }

    return filtered;
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

  // Génération des jours du mois (en timezone Montréal)
  const calendarDays = useMemo(() => {
    // Obtenir les composants de date en timezone Montréal pour le mois courant
    const montrealCurrentDate = currentDate.toLocaleString('en-CA', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [yearStr, monthStr, dayStr] = montrealCurrentDate.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    
    // Créer le premier jour du mois en timezone Montréal (midi pour éviter les problèmes de décalage)
    const firstDayMontreal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T12:00:00Z`);
    const firstDayWeekday = firstDayMontreal.toLocaleString('en-US', { 
      timeZone: 'America/Montreal', 
      weekday: 'long' 
    });
    const weekdayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const firstDayOfWeek = weekdayMap[firstDayWeekday] ?? 0;
    
    // Calculer le dernier jour du mois
    const lastDayMontreal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}T12:00:00Z`);
    
    // Commencer le calendrier au dimanche de la semaine qui contient le premier jour
    const startOffset = firstDayOfWeek;
    const days = [];
    
    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      const dayOffset = i - startOffset;
      const dayDate = new Date(firstDayMontreal);
      dayDate.setUTCDate(firstDayMontreal.getUTCDate() + dayOffset);
      days.push(dayDate);
    }
    
    return days;
  }, [currentDate]);

  // Fonction helper pour obtenir la date en timezone Montréal
  const getMontrealDateKey = (date: Date): string => {
    // Utiliser Intl.DateTimeFormat pour obtenir les composants de date en timezone Montréal
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // Format retourne YYYY-MM-DD directement
    return formatter.format(date);
  };

  // Événements par jour
  const eventsByDay = useMemo(() => {
    const eventsMap = new Map<string, Event[]>();
    
    filteredEvents.forEach(event => {
      const dateKey = getMontrealDateKey(event.startDate);
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
    const dateKey = getMontrealDateKey(selectedDate);
    return eventsByDay.get(dateKey) || [];
  }, [selectedDate, eventsByDay]);

  const handleFavoriteToggle = (eventId: string) => {
    toggleFavorite(eventId);
    console.log("Toggle favori pour l'événement:", eventId);
  };

  const handleEventClick = (event: Event) => {
    // Rediriger directement vers la page de l'événement Pulse
    // L'ID de l'événement est déjà l'ID Prisma depuis l'API
    router.push(`/evenement/${event.id}`);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal' // Toujours utiliser le timezone Montréal
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal' // Toujours utiliser le timezone Montréal
    }).format(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    // Comparer les mois en timezone Montréal
    const dateMontreal = date.toLocaleString('en-CA', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: '2-digit',
    });
    const currentMontreal = currentDate.toLocaleString('en-CA', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: '2-digit',
    });
    return dateMontreal === currentMontreal;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'musique': 'bg-red-100 text-red-800',
      'art': 'bg-sky-100 text-sky-800',
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
                  year: 'numeric',
                  timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
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
                  const dateKey = getMontrealDateKey(date);
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
                          <button
                            key={event.id}
                            type="button"
                            className={`text-left w-full text-xs p-1 rounded truncate ${getCategoryColor(
                              event.category,
                            )}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {event.title}
                          </button>
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
                              disabled={isFavoriteLoading(event.id)}
                              className={`p-2 transition-colors duration-200 ${
                                isFavorite(event.id) 
                                  ? 'text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              } ${isFavoriteLoading(event.id) ? 'opacity-50 cursor-wait' : ''}`}
                              aria-label={isFavorite(event.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                              {isFavoriteLoading(event.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Heart className={`w-4 h-4 transition-all duration-200 ${isFavorite(event.id) ? 'fill-current' : ''}`} />
                              )}
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

    </div>
  );
}

export default function CalendrierPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
          Chargement du calendrier...
        </div>
      }
    >
      <CalendrierPageContent />
    </Suspense>
  );
}


