'use client';

import { useState, useEffect } from 'react';
import { Event, EventFilter, EventCategory } from '@/types';
import { useEvents, usePrefetchEvents, useFilteredEvents } from '@/hooks/useEvents';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
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
    color: '#8b5cf6',
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
    color: '#06b6d4',
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
    color: '#f59e0b',
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
    color: '#ef4444',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
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
    location: null,
    tags: [],
    accessibility: [],
    isFree: false,
    hasTicketsAvailable: false,
    language: 'fr',
    sort: 'date',
    page: 1,
    pageSize: 20
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Utilisation du hook React Query optimisé avec filtrage local
  const { events, isLoading: loading, error, total } = useFilteredEvents(
    searchQuery, 
    selectedCategory,
    filters.sort as 'date' | 'name' | 'price'
  );

  // Préchargement intelligent des données
  const prefetchEvents = usePrefetchEvents();
  
  useEffect(() => {
    // Précharger les données dès le montage du composant
    prefetchEvents();
  }, [prefetchEvents]);

  // Gestion des événements
  const handleFavoriteToggle = (eventId: string) => {
    console.log('Toggle favori pour l\'événement:', eventId);
  };

  const handleEventClick = (event: Event) => {
    console.log('Clic sur l\'événement:', event);
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

  // Affichage des événements paginés
  const displayedEvents = events.slice(0, 20);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Navigation />
      
      {/* Hero Section moderne avec glassmorphism */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background avec animations */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-pink-600/90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo et titre avec animation */}
            <div className="inline-flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tight">
                  Pulse
                </h1>
                <p className="text-xl text-white/90 font-medium">Montréal</p>
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Découvrez les événements qui font vibrer
              <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                la métropole culturelle
              </span>
            </h2>
            
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Plus de <span className="font-bold">{total}</span> événements en temps réel. 
              Concerts, festivals, expositions, sports - tout ce qui compte à Montréal.
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
                    className="flex-1 px-4 py-4 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-lg"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105">
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
                {loading ? 'Chargement...' : `${displayedEvents.length} événements disponibles`}
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

          {/* Affichage des événements avec état de chargement optimisé */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
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
              <div className="text-3xl font-bold text-white mb-2">{total}</div>
              <div className="text-white/80">Événements actifs</div>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">4</div>
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
                <span className="text-sm">Eventbrite (actif)</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Meetup</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Ville de Montréal</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
