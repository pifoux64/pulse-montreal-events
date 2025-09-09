'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Event, EventFilter } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import ModernLoader from '@/components/ModernLoader';
import { 
  User, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Star,
  Users,
  Award,
  Clock,
  Heart,
  Filter,
  Grid,
  List,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function OrganisateurPage() {
  const params = useParams();
  const organizerId = params.id as string;
  
  // Charger tous les événements
  const { data: allEvents = [], isLoading: loading, error } = useEvents();
  
  // Système de favoris
  const { isFavorite, toggleFavorite } = useFavorites(allEvents);
  
  // États locaux
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<EventFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filtrer les événements de cet organisateur
  const organizerEvents = useMemo(() => {
    return allEvents.filter(event => event.organizerId === organizerId);
  }, [allEvents, organizerId]);

  // Obtenir les informations de l'organisateur
  const organizer = useMemo(() => {
    const firstEvent = organizerEvents[0];
    return firstEvent?.organizer || null;
  }, [organizerEvents]);

  // Statistiques de l'organisateur
  const organizerStats = useMemo(() => {
    if (organizerEvents.length === 0) return null;

    const totalEvents = organizerEvents.length;
    const upcomingEvents = organizerEvents.filter(event => new Date(event.startDate) > new Date()).length;
    const averageRating = organizerEvents.reduce((sum, event) => sum + (event.rating || 0), 0) / totalEvents;
    const totalReviews = organizerEvents.reduce((sum, event) => sum + (event.reviewCount || 0), 0);
    const categories = [...new Set(organizerEvents.map(event => event.category))];

    return {
      totalEvents,
      upcomingEvents,
      averageRating,
      totalReviews,
      categories
    };
  }, [organizerEvents]);

  // Gestionnaires d'événements
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleFavoriteToggle = (eventId: string) => {
    toggleFavorite(eventId);
  };

  // Affichage du loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50  transition-colors duration-500">
        <Navigation />
        <div className="pt-24">
          <ModernLoader 
            size="lg" 
            text="Chargement du profil organisateur..." 
            variant="default" 
          />
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50  transition-colors duration-500">
        <Navigation />
        <div className="pt-24 text-center py-12">
          <div className="text-red-500 mb-4">
            <User className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl font-semibold">Erreur de chargement</p>
            <p className="text-gray-600 mt-2">
              Impossible de charger le profil de l'organisateur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Organisateur non trouvé
  if (!organizer || organizerEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50  transition-colors duration-500">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Organisateur non trouvé
              </h1>
              <p className="text-gray-600 mb-6">
                Aucun événement trouvé pour cet organisateur.
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 btn-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </Link>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50  transition-colors duration-500">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête organisateur */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-start justify-between mb-8">
              <Link
                href="/"
                className="bg-white/10 backdrop-blur-md hover-lift p-3 rounded-2xl text-white/90 hover:text-white transition-all duration-300 border border-white/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar organisateur */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl">
                  <span className="text-white font-bold text-4xl drop-shadow-lg">
                    {organizer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/30">
                  <Award className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>

              {/* Informations organisateur */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                  {organizer.name}
                </h1>
                <p className="text-xl text-white/95 mb-6 capitalize drop-shadow-md">
                  {organizer.role} • Organisateur d'événements
                </p>

                {/* Statistiques */}
                {organizerStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {organizerStats.totalEvents}
                      </div>
                      <div className="text-white/90 text-sm">Événements</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {organizerStats.upcomingEvents}
                      </div>
                      <div className="text-white/90 text-sm">À venir</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-2xl font-bold text-white">
                          {organizerStats.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-white/90 text-sm">Note moyenne</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {organizerStats.totalReviews}
                      </div>
                      <div className="text-white/90 text-sm">Avis</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Barre d'outils */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900 ">
                Événements organisés
              </h2>
              <span className="glass-effect px-3 py-1 rounded-full text-sm font-medium text-gray-600  border border-white/20">
                {organizerEvents.length} événement{organizerEvents.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-violet-500 text-white'
                    : 'glass-effect text-gray-600 hover:text-violet-600 border border-white/20'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-violet-500 text-white'
                    : 'glass-effect text-gray-600 hover:text-violet-600 border border-white/20'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Catégories */}
          {organizerStats && organizerStats.categories.length > 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900  mb-4">
                Catégories d'événements
              </h3>
              <div className="flex flex-wrap gap-2">
                {organizerStats.categories.map((category, index) => (
                  <span
                    key={index}
                    className="glass-effect px-4 py-2 rounded-full text-sm font-medium text-gray-700  border border-white/20 hover-lift"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grille des événements */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {organizerEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-slide-up hover-lift group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/20 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <EventCard
                    event={event}
                    onFavoriteToggle={handleFavoriteToggle}
                    onEventClick={handleEventClick}
                    isFavorite={isFavorite(event.id)}
                    showImage={viewMode === 'grid'}
                  />
                </div>
              </div>
            ))}
          </div>
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
