'use client';

import { useState, useEffect, useMemo } from 'react';
import { Event, EventFilter, EventCategory } from '@/types';
import { useEvents, usePrefetchEvents, useFilteredEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import ModernLoader from '@/components/ModernLoader';
import { MapPin, List, Grid, Filter, Search, Calendar, Users, Star, TrendingUp, Clock, Sparkles, ArrowRight, Play, Zap, Globe, Heart, Award, Music, Palette, Trophy, Users2, Utensils } from 'lucide-react';

// Données de test pour les catégories
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#ef4444',
    subCategories: [
      { id: '1-1', name: 'Rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-2', name: 'Pop', nameEn: 'Pop', categoryId: '1' },
      { id: '1-3', name: 'Jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-4', name: 'Blues', nameEn: 'Blues', categoryId: '1' },
      { id: '1-5', name: 'Électronique', nameEn: 'Electronic', categoryId: '1' },
      { id: '1-6', name: 'Hip-Hop', nameEn: 'Hip-Hop', categoryId: '1' },
      { id: '1-7', name: 'Reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-8', name: 'Classique', nameEn: 'Classical', categoryId: '1' },
      { id: '1-9', name: 'Folk', nameEn: 'Folk', categoryId: '1' },
      { id: '1-10', name: 'Indie', nameEn: 'Indie', categoryId: '1' },
      { id: '1-11', name: 'Métal', nameEn: 'Metal', categoryId: '1' },
      { id: '1-12', name: 'Country', nameEn: 'Country', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Art & Culture',
    nameEn: 'Art & Culture',
    icon: '🎨',
    color: '#8b5cf6',
    subCategories: [
      { id: '2-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: '2' },
      { id: '2-2', name: 'Théâtre', nameEn: 'Theater', categoryId: '2' },
      { id: '2-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: '2' },
      { id: '2-4', name: 'Danse', nameEn: 'Dance', categoryId: '2' },
      { id: '2-5', name: 'Opéra', nameEn: 'Opera', categoryId: '2' },
      { id: '2-6', name: 'Littérature', nameEn: 'Literature', categoryId: '2' },
      { id: '2-7', name: 'Photographie', nameEn: 'Photography', categoryId: '2' },
      { id: '2-8', name: 'Sculpture', nameEn: 'Sculpture', categoryId: '2' },
      { id: '2-9', name: 'Peinture', nameEn: 'Painting', categoryId: '2' },
      { id: '2-10', name: 'Performance', nameEn: 'Performance', categoryId: '2' },
      { id: '2-11', name: 'Arts numériques', nameEn: 'Digital Arts', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Sport',
    nameEn: 'Sports',
    icon: '⚽',
    color: '#06b6d4',
    subCategories: [
      { id: '3-1', name: 'Football', nameEn: 'Soccer', categoryId: '3' },
      { id: '3-2', name: 'Basketball', nameEn: 'Basketball', categoryId: '3' },
      { id: '3-3', name: 'Hockey', nameEn: 'Hockey', categoryId: '3' },
      { id: '3-4', name: 'Baseball', nameEn: 'Baseball', categoryId: '3' },
      { id: '3-5', name: 'Tennis', nameEn: 'Tennis', categoryId: '3' },
      { id: '3-6', name: 'Course', nameEn: 'Running', categoryId: '3' },
      { id: '3-7', name: 'Cyclisme', nameEn: 'Cycling', categoryId: '3' },
      { id: '3-8', name: 'Natation', nameEn: 'Swimming', categoryId: '3' },
      { id: '3-9', name: 'Fitness', nameEn: 'Fitness', categoryId: '3' },
      { id: '3-10', name: 'Yoga', nameEn: 'Yoga', categoryId: '3' },
      { id: '3-11', name: 'Arts martiaux', nameEn: 'Martial Arts', categoryId: '3' },
      { id: '3-12', name: 'Sports d\'hiver', nameEn: 'Winter Sports', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Famille',
    nameEn: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f59e0b',
    subCategories: [
      { id: '4-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: '4' },
      { id: '4-2', name: 'Parcs', nameEn: 'Parks', categoryId: '4' },
      { id: '4-3', name: 'Éducation', nameEn: 'Education', categoryId: '4' },
      { id: '4-4', name: 'Ateliers créatifs', nameEn: 'Creative workshops', categoryId: '4' },
      { id: '4-5', name: 'Spectacles enfants', nameEn: 'Kids shows', categoryId: '4' },
      { id: '4-6', name: 'Jeux', nameEn: 'Games', categoryId: '4' },
      { id: '4-7', name: 'Contes', nameEn: 'Storytelling', categoryId: '4' },
      { id: '4-8', name: 'Activités plein air', nameEn: 'Outdoor activities', categoryId: '4' },
      { id: '4-9', name: 'Musées pour enfants', nameEn: 'Children museums', categoryId: '4' },
      { id: '4-10', name: 'Fêtes d\'anniversaire', nameEn: 'Birthday parties', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Gastronomie',
    nameEn: 'Food & Drink',
    icon: '🍽️',
    color: '#ef4444',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
      { id: '5-4', name: 'Cours de cuisine', nameEn: 'Cooking classes', categoryId: '5' },
      { id: '5-5', name: 'Marché', nameEn: 'Market', categoryId: '5' },
      { id: '5-6', name: 'Bar à vin', nameEn: 'Wine bar', categoryId: '5' },
      { id: '5-7', name: 'Brasserie', nameEn: 'Brewery', categoryId: '5' },
      { id: '5-8', name: 'Food truck', nameEn: 'Food truck', categoryId: '5' },
      { id: '5-9', name: 'Brunch', nameEn: 'Brunch', categoryId: '5' },
      { id: '5-10', name: 'Cocktails', nameEn: 'Cocktails', categoryId: '5' },
      { id: '5-11', name: 'Café', nameEn: 'Coffee', categoryId: '5' },
    ]
  },
  {
    id: '6',
    name: 'Technologie',
    nameEn: 'Technology',
    icon: '💻',
    color: '#10b981',
    subCategories: [
      { id: '6-1', name: 'Conférence tech', nameEn: 'Tech conference', categoryId: '6' },
      { id: '6-2', name: 'Hackathon', nameEn: 'Hackathon', categoryId: '6' },
      { id: '6-3', name: 'Startup', nameEn: 'Startup', categoryId: '6' },
      { id: '6-4', name: 'IA', nameEn: 'AI', categoryId: '6' },
      { id: '6-5', name: 'Blockchain', nameEn: 'Blockchain', categoryId: '6' },
      { id: '6-6', name: 'Développement', nameEn: 'Development', categoryId: '6' },
      { id: '6-7', name: 'Design', nameEn: 'Design', categoryId: '6' },
      { id: '6-8', name: 'Gaming', nameEn: 'Gaming', categoryId: '6' },
    ]
  },
  {
    id: '7',
    name: 'Affaires',
    nameEn: 'Business',
    icon: '💼',
    color: '#6366f1',
    subCategories: [
      { id: '7-1', name: 'Networking', nameEn: 'Networking', categoryId: '7' },
      { id: '7-2', name: 'Formation', nameEn: 'Training', categoryId: '7' },
      { id: '7-3', name: 'Conférence', nameEn: 'Conference', categoryId: '7' },
      { id: '7-4', name: 'Entrepreneuriat', nameEn: 'Entrepreneurship', categoryId: '7' },
      { id: '7-5', name: 'Finance', nameEn: 'Finance', categoryId: '7' },
      { id: '7-6', name: 'Marketing', nameEn: 'Marketing', categoryId: '7' },
      { id: '7-7', name: 'Leadership', nameEn: 'Leadership', categoryId: '7' },
    ]
  },
  {
    id: '8',
    name: 'Bien-être',
    nameEn: 'Wellness',
    icon: '🧘',
    color: '#f97316',
    subCategories: [
      { id: '8-1', name: 'Méditation', nameEn: 'Meditation', categoryId: '8' },
      { id: '8-2', name: 'Spa', nameEn: 'Spa', categoryId: '8' },
      { id: '8-3', name: 'Massage', nameEn: 'Massage', categoryId: '8' },
      { id: '8-4', name: 'Thérapie', nameEn: 'Therapy', categoryId: '8' },
      { id: '8-5', name: 'Nutrition', nameEn: 'Nutrition', categoryId: '8' },
      { id: '8-6', name: 'Développement personnel', nameEn: 'Personal development', categoryId: '8' },
    ]
  }
];

export default function OptimizedHomePage() {
  // États pour les filtres et la vue
  const [filters, setFilters] = useState<EventFilter>({
    categories: [],
    subCategories: [],
    priceRange: { min: 0, max: 1000 },
    dateRange: { start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    location: undefined,
    tags: [],
    accessibility: undefined
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Utilisation du hook React Query pour charger tous les événements
  const { data: events = [], isLoading: loading, error } = useEvents();
  
  // Système de favoris
  const { isFavorite, toggleFavorite } = useFavorites(events);

  // Filtrage des événements basé sur la recherche et les filtres
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        event.location?.name?.toLowerCase().includes(query) ||
        (event as any).venue?.name?.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        (event as any).subCategory?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégories sélectionnées
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event => 
        filters.categories!.some(cat => 
          event.category.toLowerCase() === cat.toLowerCase()
        )
      );
    }

    // Filtre par catégorie sélectionnée (pour compatibilité)
    if (selectedCategory) {
      filtered = filtered.filter(event => 
        event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filtre par sous-catégories sélectionnées
    if (filters.subCategories && filters.subCategories.length > 0) {
      filtered = filtered.filter(event => {
        // Vérifier si l'événement a une sous-catégorie qui correspond
        const eventSubCategory = (event as any).subCategory;
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

    // Filtre par événements gratuits si activé
    if (showFreeOnly) {
      filtered = filtered.filter(event => event.price.isFree);
    }

    return filtered;
  }, [events, searchQuery, selectedCategory, showFreeOnly, filters.categories, filters.subCategories]);

  // Récupérer le paramètre de recherche de l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      // Scroll vers les événements après un court délai
      setTimeout(() => {
        const eventsSection = document.getElementById('events-section');
        eventsSection?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  // Préchargement intelligent des données
  const prefetchEvents = usePrefetchEvents();
  
  useEffect(() => {
    // Précharger les données dès le montage du composant
    prefetchEvents();
  }, [prefetchEvents]);

  // Gestion des événements
  const handleFavoriteToggle = (eventId: string) => {
    toggleFavorite(eventId);
    console.log('Toggle favori pour l\'événement:', eventId);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleFiltersChange = (newFilters: EventFilter) => {
    setFilters(newFilters);
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFilters(prev => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              radius: 10
            }
          }));
          console.log('Position détectée:', latitude, longitude);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  };

  // Affichage des événements filtrés (pagination future)
  const displayedEvents = filteredEvents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 transition-colors duration-500">
      <Navigation />
      
      {/* Hero Section ultra-moderne avec glassmorphism et animations */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background avec gradients animés */}
        <div className="absolute inset-0 gradient-aurora opacity-90"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo et titre avec animation */}
            {/* <div className="inline-flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tight">
                  Pulse
                </h1>
                <p className="text-xl text-white/90 font-medium">Montréal</p>
              </div> 
            </div>*/}

            <div className="animate-slide-up">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                Découvrez les événements qui font
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 animate-pulse-glow">
                  vibrer Montréal
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
                La métropole culturelle vous ouvre ses portes
              </p>
            </div>
            
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Plus de <span className="font-bold">{events.length}</span> événements en temps réel. 
              Concerts, festivals, expositions et sports
            </p>

            {/* Barre de recherche moderne */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="glass rounded-2xl p-2 shadow-2xl">
                <div className="flex items-center">
                  <Search className="w-6 h-6 text-gray-400 ml-4" />
                  <input
                    type="text"
                    placeholder="Rechercher des événements, artistes, lieux..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const eventsSection = document.getElementById('events-section');
                        eventsSection?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 px-4 py-4 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-lg"
                  />
                  <button 
                    onClick={() => {
                      const eventsSection = document.getElementById('events-section');
                      eventsSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Explorer
                  </button>
                </div>
              </div>
            </div>

            {/* Boutons d'action avec animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/carte"
                className="glass rounded-2xl px-8 py-4 text-white font-semibold hover:bg-white/20 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-xl"
              >
                <MapPin className="w-5 h-5" />
                <span>Voir la carte</span>
              </a>
              
              <button
                onClick={() => {
                  const eventsSection = document.getElementById('events-section');
                  eventsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4 text-white font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                <span>Parcourir les événements</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section des événements avec cache optimisé */}
      <section id="events-section" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header avec contrôles */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Événements à venir
              </h2>
              <p className="text-xl text-gray-600">
                {loading ? 'Chargement...' : (
                  searchQuery.trim() ? 
                    `${displayedEvents.length} événement${displayedEvents.length !== 1 ? 's' : ''} trouvé${displayedEvents.length !== 1 ? 's' : ''} pour "${searchQuery}"` :
                    `${displayedEvents.length} événements disponibles`
                )}
              </p>
            </div>
            
            {/* Contrôles de vue et filtres */}
            <div className="flex items-center space-x-4 mt-6 lg:mt-0">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <EventFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={mockCategories}
                onLocationDetect={handleLocationDetect}
              />
            </div>
          )}

          {/* Affichage des événements avec loader ultra-moderne */}
          {loading ? (
            <div className="py-16">
              <ModernLoader 
                size="lg" 
                text="Chargement des événements exceptionnels..." 
                variant="default" 
              />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Clock className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-semibold">Erreur de chargement</p>
                <p className="text-gray-600 mt-2">
                  Impossible de charger les événements. Veuillez réessayer.
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {displayedEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-slide-up hover-lift group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="glass rounded-2xl overflow-hidden border border-white/20 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <EventCard
                      event={event}
                      onFavoriteToggle={handleFavoriteToggle}
                      onEventClick={handleEventClick}
                      isFavorite={isFavorite(event.id)}
                      showImage={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun événement */}
          {!loading && !error && displayedEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun événement trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos filtres ou votre recherche.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section des statistiques avec données en temps réel */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Authentic Pulse Montreal Stats
            </h2>
            <p className="text-xl text-white/90">
              Données en temps réel de l'écosystème événementiel montréalais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Statistiques dynamiques */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{events.length}</div>
              <div className="text-white/80">Événements actifs</div>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">7</div>
              <div className="text-white/80">Sources actives</div>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80">Mise à jour</div>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">⚡</div>
              <div className="text-white/80">Performance</div>
            </div>
          </div>

          {/* Sources actives */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-6">Sources de données actives</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Ticketmaster</span>
              </div>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Eventbrite</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Ville de Montréal</span>
            </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Meetup</span>
              </div>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Ville de Montréal</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Resident Advisor</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Facebook Events</span>
            </div>
            </div>
          </div>
        </div>
      </section>

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
