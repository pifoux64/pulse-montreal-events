'use client';

/**
 * SPRINT 1 - Page d'accueil Pulse Event
 * 
 * Vision: "Je ne sais pas quoi faire → j'ouvre Pulse"
 * 
 * Fonctionnalités:
 * - Hero avec textes clairs
 * - Boutons "Que faire aujourd'hui ?" / "Que faire ce week-end ?"
 * - Lien "Voir sur la carte"
 * - État local mode = "today" | "weekend"
 * - Liste dynamique d'événements
 * - Cartes simples avec bouton favoris
 * - Responsive
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Event } from '@/types';
import { MapPin, Calendar, Heart, ExternalLink, Clock } from 'lucide-react';
import { 
  MAIN_CATEGORIES, 
  GENRES, 
  CATEGORY_LABELS, 
  getGenresForCategory, 
  getStylesForGenre 
} from '@/lib/tagging/taxonomy';

// Types pour l'API
interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    lat: number;
    lon: number;
  };
  category: string;
  tags: string[];
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  imageUrl?: string;
  url?: string;
  source: string;
  _count?: {
    favorites: number;
  };
  eventTags?: {
    category: 'type' | 'genre' | 'ambiance' | 'public' | string;
    value: string;
  }[];
}

interface ApiResponse {
  items: ApiEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Transformation API → Frontend
const transformApiEvent = (event: ApiEvent): Event => {
  try {
    const structuredTags = event.eventTags ?? [];
    const genreTags = structuredTags
      .filter((t) => t.category === 'genre')
      .map((t) => t.value);
    const ambianceTags = structuredTags
      .filter((t) => t.category === 'ambiance')
      .map((t) => t.value);
    const publicTags = structuredTags
      .filter((t) => t.category === 'public')
      .map((t) => t.value);

    const normalizedStructured = [...genreTags, ...ambianceTags, ...publicTags].map((v) =>
      v.replace(/_/g, ' '),
    );

    return {
      id: event.id,
      title: event.title || 'Sans titre',
      description: event.description || '',
      shortDescription: event.description?.substring(0, 100) + '...' || '',
      startDate: new Date(event.startAt),
      endDate: event.endAt ? new Date(event.endAt) : null,
      location: {
        name: event.venue?.name || 'Lieu à confirmer',
        address: event.venue?.address || '',
        city: event.venue?.city || 'Montréal',
        postalCode: event.venue?.postalCode || '',
        coordinates: {
          lat: event.venue?.lat ?? 45.5088,
          lng: event.venue?.lon ?? -73.5542,
        },
      },
      category: event.category || 'Autre',
      subCategory: genreTags[0]?.replace(/_/g, ' ') || event.tags?.[0] || '',
      // Tags = tags DB existants + tags structurés normalisés
      tags: Array.from(
        new Set([...(event.tags || []), ...normalizedStructured]),
      ),
      price: {
        amount: (event.priceMin ?? 0) / 100, // Convertir de cents en dollars
        currency: event.currency || 'CAD',
        isFree: (event.priceMin ?? 0) === 0,
      },
      imageUrl: event.imageUrl || null, // Pas de fallback Unsplash (bloqué par CSP)
      ticketUrl: event.url || '#',
      organizerId: 'default',
      organizer: {
        id: 'default',
        email: 'api@pulse.com',
        name: event.source,
        role: 'organizer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      customFilters: [],
      accessibility: [],
      status: 'published' as const,
      source: event.source,
      externalId: event.id,
      language: 'fr' as const,
      minAttendees: 0,
      maxAttendees: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur lors de la transformation de l\'événement:', error, event);
    throw error;
  }
};

type Mode = 'today' | 'weekend';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

  // Réinitialiser genre et style quand on change de catégorie
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setSelectedGenre(null);
      setSelectedStyle(null);
    } else {
      setSelectedCategory(category);
      setSelectedGenre(null);
      setSelectedStyle(null);
    }
  };

  // Réinitialiser style quand on change de genre
  const handleGenreSelect = (genre: string) => {
    if (selectedGenre === genre) {
      setSelectedGenre(null);
      setSelectedStyle(null);
    } else {
      setSelectedGenre(genre);
      setSelectedStyle(null);
    }
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(selectedStyle === style ? null : style);
  };

  const displayedFilterLabel = selectedStyle 
    ? selectedStyle.replace(/_/g, ' ')
    : selectedGenre 
    ? selectedGenre.replace(/_/g, ' ')
    : selectedCategory 
    ? CATEGORY_LABELS[selectedCategory]?.fr || selectedCategory
    : null;

  // Récupérer les événements selon le mode et les filtres sélectionnés
  const { data: apiData, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['events', mode, selectedCategory, selectedGenre, selectedStyle],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.set('scope', mode);
        params.set('pageSize', '50');
        // Priorité : style > genre > category
        if (selectedStyle) {
          // Pour l'instant, on filtre par style via le genre parent
          if (selectedGenre) {
            params.set('genre', selectedGenre);
          }
        } else if (selectedGenre) {
          params.set('genre', selectedGenre);
        } else if (selectedCategory === 'MUSIC') {
          // Si on sélectionne juste MUSIC, on ne filtre pas par genre spécifique
          // mais on pourrait filtrer côté front
        }
        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erreur API:', response.status, errorText);
          throw new Error(`Erreur API: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Erreur lors de la récupération des événements:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const events: Event[] = (apiData?.items || [])
    .map((item: ApiEvent) => {
      try {
        return transformApiEvent(item);
      } catch (error) {
        console.error('Erreur transformation événement:', error, item);
        return null;
      }
    })
    .filter((e): e is Event => e !== null)
    // Masquer l'ancien événement de test interne
    .filter((event) => event.title !== 'Concert de Test - Week-end')
    // Filtre par catégorie (si sélectionnée)
    .filter((event) => {
      if (!selectedCategory) return true;
      // Vérifier si l'événement correspond à la catégorie
      const eventCategory = event.category?.toUpperCase();
      if (eventCategory === selectedCategory) return true;
      // Vérifier aussi dans les tags
      return event.tags.some(tag => {
        const tagUpper = tag.toUpperCase();
        return tagUpper.includes(selectedCategory) || 
               (selectedCategory === 'MUSIC' && (tagUpper.includes('CONCERT') || tagUpper.includes('MUSIQUE'))) ||
               (selectedCategory === 'ART_CULTURE' && (tagUpper.includes('EXPO') || tagUpper.includes('ART'))) ||
               (selectedCategory === 'SPORT' && tagUpper.includes('SPORT')) ||
               (selectedCategory === 'FAMILY' && (tagUpper.includes('FAMILLE') || tagUpper.includes('ENFANT')));
      });
    })
    // Filtre par style (si sélectionné)
    .filter((event) => {
      if (!selectedStyle) return true;
      return event.tags.some(tag => 
        tag.toLowerCase().replace(/\s/g, '_') === selectedStyle.toLowerCase() ||
        tag.toLowerCase().includes(selectedStyle.toLowerCase().replace(/_/g, ' '))
      );
    })
    // Filtre de recherche globale (?search=)
    .filter((event) => {
      if (!searchQuery) return true;
      const inTitle = event.title.toLowerCase().includes(searchQuery);
      const inDescription = event.description.toLowerCase().includes(searchQuery);
      const inTags = event.tags.some((tag) => tag.toLowerCase().includes(searchQuery));
      const inLocation = event.location.name.toLowerCase().includes(searchQuery);
      return inTitle || inDescription || inTags || inLocation;
    });
  const { isFavorite, toggleFavorite } = useFavorites(events);

  const handleFavoriteToggle = async (eventId: string) => {
    try {
      await toggleFavorite(eventId);
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      // Ne pas bloquer l'UI en cas d'erreur
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Montreal',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navigation />

      {/* Hero Section - Design moderne */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Background animé avec gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Titre principal avec gradient animé */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 via-cyan-200 to-purple-200 animate-gradient">
              Trouver quoi faire
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
              à Montréal
            </h2>
          </div>

          {/* Sous-titre élégant */}
          <p className="text-lg md:text-xl text-slate-400 mb-12 font-light max-w-2xl mx-auto">
            Découvrez les meilleurs événements de la métropole
          </p>

          {/* Boutons CTA modernes */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setMode('today')}
              className={`group relative px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 overflow-hidden ${
                mode === 'today'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/50 scale-105'
                  : 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20'
              }`}
            >
              {mode === 'today' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Que faire aujourd'hui ?
              </span>
            </button>
            <button
              onClick={() => setMode('weekend')}
              className={`group relative px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 overflow-hidden ${
                mode === 'weekend'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/50 scale-105'
                  : 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20'
              }`}
            >
              {mode === 'weekend' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Que faire ce week-end ?
              </span>
            </button>
          </div>

          {/* Filtres hiérarchiques : Catégorie → Genre → Style - Design moderne */}
          <div className="mt-8 space-y-6">
            {/* Niveau 1 : Catégories principales */}
            <div className="flex flex-wrap gap-3 justify-center">
              {/* Bouton "Tout" */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedGenre(null);
                  setSelectedStyle(null);
                }}
                className={`group relative px-6 py-3 text-sm md:text-base rounded-2xl font-semibold transition-all duration-500 flex items-center gap-3 overflow-hidden ${
                  !selectedCategory
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-2xl shadow-slate-500/50 scale-110 z-10'
                    : 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:scale-105'
                }`}
              >
                {!selectedCategory && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                )}
                <span className="relative z-10">🌐</span>
                <span className="relative z-10">Tout</span>
                {!selectedCategory && (
                  <span className="relative z-10 ml-2 text-xs opacity-80">✓</span>
                )}
              </button>
              
              {MAIN_CATEGORIES.map((category, index) => {
                const isActive = selectedCategory === category;
                const label = CATEGORY_LABELS[category];
                return (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`group relative px-6 py-3 text-sm md:text-base rounded-2xl font-semibold transition-all duration-500 flex items-center gap-3 overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl shadow-emerald-500/50 scale-110 z-10'
                        : 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:scale-105'
                    }`}
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    <span className="relative z-10 text-2xl">{label.icon}</span>
                    <span className="relative z-10">{label.fr}</span>
                    {isActive && (
                      <span className="relative z-10 ml-2 text-xs opacity-80">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Niveau 2 : Genres (si catégorie sélectionnée) avec animation */}
            {selectedCategory && (
              <div className="animate-fade-in">
                <div className="mb-3 text-center">
                  <span className="text-sm text-slate-400 font-medium">
                    {CATEGORY_LABELS[selectedCategory].fr} • Choisissez un genre
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                  {/* Bouton "Tout" pour les genres */}
                  <button
                    onClick={() => {
                      setSelectedGenre(null);
                      setSelectedStyle(null);
                    }}
                    className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                      !selectedGenre
                        ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent shadow-lg shadow-slate-500/50'
                        : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-slate-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    Tout
                  </button>
                  
                  {getGenresForCategory(selectedCategory).slice(0, 15).map((genre, index) => {
                    const isActive = selectedGenre === genre;
                    const label = genre.replace(/_/g, ' ');
                    return (
                      <button
                        key={genre}
                        onClick={() => handleGenreSelect(genre)}
                        className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/50'
                            : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-blue-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                        }`}
                        style={{ animationDelay: `${(index + 1) * 50}ms` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Niveau 3 : Styles (si genre sélectionné, comme Discogs) */}
            {selectedCategory === 'MUSIC' && selectedGenre && getStylesForGenre(selectedGenre).length > 0 && (
              <div className="animate-fade-in">
                <div className="mb-3 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Styles de {selectedGenre.replace(/_/g, ' ')} • Affinez votre recherche
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
                  {/* Bouton "Tout" pour les styles */}
                  <button
                    onClick={() => setSelectedStyle(null)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-300 transform hover:scale-105 ${
                      !selectedStyle
                        ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent shadow-md shadow-slate-500/50'
                        : 'bg-white/5 text-slate-300 border-slate-400/20 hover:border-slate-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    Tout
                  </button>
                  
                  {getStylesForGenre(selectedGenre).map((style, index) => {
                    const isActive = selectedStyle === style;
                    const label = style.replace(/_/g, ' ');
                    return (
                      <button
                        key={style}
                        onClick={() => handleStyleSelect(style)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-300 transform hover:scale-105 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-md shadow-purple-500/50'
                            : 'bg-white/5 text-slate-300 border-slate-400/20 hover:border-purple-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                        }`}
                        style={{ animationDelay: `${(index + 1) * 30}ms` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lien vers la carte - Design moderne */}
          <div className="mt-12">
            <a
              href="/carte"
              className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/30 text-slate-200 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Voir sur la carte</span>
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          </div>
        </div>
      </section>

      {/* Liste d'événements - Design moderne */}
      <section className="px-4 pb-20 relative">
        {/* Gradient de transition */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950/0 via-slate-950/50 to-slate-950 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* En-tête avec compteur moderne */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-slate-400 font-medium">
                {events.length} événement{events.length > 1 ? 's' : ''} disponible{events.length > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              {mode === 'today' ? "Aujourd'hui" : 'Ce week-end'}
              {displayedFilterLabel && (
                <span className="ml-3 text-2xl md:text-3xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  · {displayedFilterLabel}
                </span>
              )}
            </h2>
            {displayedFilterLabel && (
              <p className="text-slate-400 text-sm">
                Filtres actifs : {selectedCategory && CATEGORY_LABELS[selectedCategory]?.fr}
                {selectedGenre && ` → ${selectedGenre.replace(/_/g, ' ')}`}
                {selectedStyle && ` → ${selectedStyle.replace(/_/g, ' ')}`}
              </p>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-slate-300 mt-4">Chargement des événements...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Erreur de chargement</p>
              <p className="text-slate-400 mb-4">
                {error instanceof Error ? error.message : 'Impossible de charger les événements. Veuillez réessayer.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Recharger la page
              </button>
            </div>
          )}

          {/* Liste d'événements */}
          {!isLoading && !error && (
            <>
              {events.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">
                    Aucun événement trouvé pour {mode === 'today' ? "aujourd'hui" : 'ce week-end'}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, index) => (
                    <div
                      key={event.id}
                      className="group bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Image avec overlay moderne */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-500">
                        {event.imageUrl && !event.imageUrl.includes('unsplash.com') ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(event.imageUrl)}`}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Si l'image échoue, on cache l'img et on garde le gradient
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          // Placeholder avec emoji selon la catégorie
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            {event.category === 'MUSIC' ? '🎵' : 
                             event.category === 'SPORTS' ? '⚽' :
                             event.category === 'FOOD' ? '🍽️' :
                             event.category === 'ARTS' ? '🎨' : '🎭'}
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteToggle(event.id);
                              }}
                              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                isFavorite(event.id)
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  isFavorite(event.id) ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                          </div>
                          {event.price.isFree && (
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                                Gratuit
                              </span>
                            </div>
                          )}
                        </div>

                      {/* Contenu */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                          {event.title}
                        </h3>

                        {/* Date et heure */}
                        <div className="flex items-center gap-2 text-slate-300 mb-3">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {formatDate(event.startDate)} à {formatTime(event.startDate)}
                          </span>
                        </div>

                        {/* Lieu */}
                        {event.location?.name && (
                          <div className="flex items-center gap-2 text-slate-300 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{event.location.name}</span>
                          </div>
                        )}

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {event.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-white/10 text-slate-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Prix */}
                        {!event.price.isFree && event.price.amount > 0 && (
                          <p className="text-white font-semibold mb-4">
                            {event.price.amount.toFixed(2)} {event.price.currency}
                          </p>
                        )}

                        {/* Bouton voir */}
                        <button
                          onClick={() => router.push(`/evenement/${event.id}`)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          Voir l'événement
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

