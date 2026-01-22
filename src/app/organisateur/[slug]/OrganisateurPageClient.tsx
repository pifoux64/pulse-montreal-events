'use client';

import { useState, useMemo } from 'react';
import { Event } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { 
  User, 
  Calendar, 
  MapPin, 
  Globe, 
  Star,
  Users,
  CheckCircle,
  Grid,
  List,
  ArrowLeft,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-react';
import Link from 'next/link';
import FollowOrganizerButton from '@/components/FollowOrganizerButton';

interface OrganizerData {
  id: string;
  displayName: string;
  slug: string | null;
  website?: string | null;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  verified: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  eventsCount: number;
  followersCount: number;
  events?: Array<{
    id: string;
    title: string;
    startAt: Date;
    endAt: Date | null;
    imageUrl?: string | null;
    category: string;
    tags: string[];
    priceMin: number | null;
    priceMax: number | null;
    currency: string;
    venue: {
      id: string;
      name: string;
      slug: string | null;
      address: string;
      city: string;
    } | null;
  }>;
}

interface OrganisateurPageClientProps {
  organizer: OrganizerData;
}

export default function OrganisateurPageClient({ organizer }: OrganisateurPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Transformer les événements de l'API vers le format Event
  const organizerEvents: Event[] = useMemo(() => {
    if (!organizer.events) return [];
    
    return organizer.events.map((event) => ({
      id: event.id,
      title: event.title,
      description: '',
      shortDescription: '',
      startDate: new Date(event.startAt),
      endDate: event.endAt ? new Date(event.endAt) : new Date(event.startAt),
      location: event.venue
        ? {
            name: event.venue.name,
            address: event.venue.address,
            city: event.venue.city,
            postalCode: '',
            coordinates: undefined,
          }
        : {
            name: 'Lieu à confirmer',
            address: '',
            city: 'Montréal',
            postalCode: '',
          },
      category: event.category || 'Autre',
      subCategory: '',
      tags: event.tags || [],
      price: {
        amount: event.priceMin != null ? event.priceMin / 100 : 0,
        currency: event.currency || 'CAD',
        isFree: event.priceMin === 0 && event.priceMin != null,
      },
      imageUrl: event.imageUrl || undefined,
      ticketUrl: null,
      organizerId: organizer.id,
      organizer: {
        id: organizer.id,
        email: organizer.user?.email || '',
        name: organizer.displayName,
        role: 'organizer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      venueSlug: event.venue?.slug || null,
      customFilters: [],
      accessibility: {
        wheelchairAccessible: false,
        hearingAssistance: false,
        visualAssistance: false,
        quietSpace: false,
        signLanguage: false,
        audioDescription: false,
        braille: false,
      },
      targetAudience: [],
      maxCapacity: undefined,
      currentCapacity: 0,
      isFeatured: false,
      isVerified: organizer.verified,
      rating: 0,
      reviewCount: 0,
      source: 'pulse',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }, [organizer]);

  // Système de favoris
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(organizerEvents);

  // Statistiques de l'organisateur
  const organizerStats = useMemo(() => {
    const totalEvents = organizer.eventsCount || organizerEvents.length;
    const upcomingEvents = organizerEvents.filter(event => new Date(event.startDate) > new Date()).length;
    const categories = [...new Set(organizerEvents.map(event => event.category))];

    return {
      totalEvents,
      upcomingEvents,
      categories,
      followers: organizer.followersCount || 0,
    };
  }, [organizer, organizerEvents]);

  // Gestionnaires d'événements
  const handleFavoriteToggle = (eventId: string) => {
    toggleFavorite(eventId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête organisateur */}
        <div className="bg-gradient-to-br from-sky-700 via-cyan-600 to-emerald-600 relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-300/30 rounded-full blur-3xl animate-float" style={{ animationDuration: '14s' }}></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '16s' }}></div>
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
                {organizer.user?.image ? (
                  <img
                    src={organizer.user.image}
                    alt={organizer.displayName}
                    className="w-32 h-32 rounded-full border-4 border-white/30 shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl">
                    <span className="text-white font-bold text-4xl drop-shadow-lg">
                      {organizer.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {organizer.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/30">
                    <CheckCircle className="w-6 h-6 text-emerald-400 drop-shadow-lg fill-current" />
                  </div>
                )}
              </div>

              {/* Informations organisateur */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {organizer.displayName}
                  </h1>
                  {organizer.verified && (
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/50 rounded-full text-xs font-semibold text-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                </div>
                <p className="text-xl text-white/95 mb-4 capitalize drop-shadow-md">
                  Organisateur d'événements
                </p>
                
                {/* Liens sociaux et site web */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <FollowOrganizerButton organizerId={organizer.id} />
                  {organizer.website && (
                    <a
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all duration-300 text-white hover:scale-110"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {organizer.socials?.facebook && (
                    <a
                      href={organizer.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all duration-300 text-white hover:scale-110"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {organizer.socials?.instagram && (
                    <a
                      href={organizer.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all duration-300 text-white hover:scale-110"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {organizer.socials?.twitter && (
                    <a
                      href={organizer.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all duration-300 text-white hover:scale-110"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {organizer.socials?.linkedin && (
                    <a
                      href={organizer.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all duration-300 text-white hover:scale-110"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>

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
                      <div className="text-2xl font-bold text-white mb-1">
                        {organizerStats.followers}
                      </div>
                      <div className="text-white/90 text-sm">Abonnés</div>
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
              <h2 className="text-2xl font-bold text-white">
                Prochains événements
              </h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium text-slate-300 bg-white/10 border border-white/20">
                {organizerEvents.length} événement{organizerEvents.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white'
                    : 'glass-effect text-gray-600 hover:text-sky-600 border border-white/20'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-sky-600 text-white'
                    : 'glass-effect text-gray-600 hover:text-sky-600 border border-white/20'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Catégories */}
          {organizerStats && organizerStats.categories.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Catégories d'événements
              </h3>
              <div className="flex flex-wrap gap-2">
                {organizerStats.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium text-slate-200 bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Message si aucun événement */}
          {organizerEvents.length === 0 && (
            <div className="text-center py-12 bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/10">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun événement à venir
              </h3>
              <p className="text-slate-300">
                Cet organisateur n'a pas encore d'événements programmés.
              </p>
            </div>
          )}

          {/* Grille des événements */}
          {organizerEvents.length > 0 && (
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
                  <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <EventCard
                      event={event}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={isFavorite(event.id)}
                      isFavoriteLoading={isFavoriteLoading(event.id)}
                      showImage={viewMode === 'grid'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
