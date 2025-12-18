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

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Event } from '@/types';
import { MapPin, Calendar, Heart, ExternalLink, Clock, Loader2, Filter, Sparkles, Trophy, ArrowRight, Brain, TrendingUp, Flame } from 'lucide-react';
import { toMontrealDateString } from '@/lib/utils';
import Link from 'next/link';
import { 
  MAIN_CATEGORIES, 
  GENRES, 
  CATEGORY_LABELS, 
  getGenresForCategory, 
  getStylesForGenre,
  EVENT_TYPES,
  AMBIANCES,
  PUBLICS,
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
    const categoryTags = structuredTags
      .filter((t) => t.category === 'category')
      .map((t) => t.value);
    const genreTags = structuredTags
      .filter((t) => t.category === 'genre')
      .map((t) => t.value);
    const ambianceTags = structuredTags
      .filter((t) => t.category === 'ambiance')
      .map((t) => t.value);
    const publicTags = structuredTags
      .filter((t) => t.category === 'public')
      .map((t) => t.value);

    // Déterminer la catégorie principale : utiliser les tags structurés category, sinon déduire des genres, sinon utiliser event.category
    let mainCategory = categoryTags[0] || null;
    if (!mainCategory && genreTags.length > 0) {
      // Si on a des genres musicaux, c'est MUSIC
      mainCategory = 'MUSIC';
    } else if (!mainCategory) {
      // Mapper event.category legacy vers les nouvelles catégories
      const categoryMap: Record<string, string> = {
        'MUSIC': 'MUSIC',
        'ARTS_THEATRE': 'ART_CULTURE',
        'ARTS & THEATRE': 'ART_CULTURE',
        'ARTS_AND_THEATRE': 'ART_CULTURE',
        'SPORTS': 'SPORT',
        'SPORT': 'SPORT',
        'FAMILY': 'FAMILY',
        'COMMUNITY': 'ART_CULTURE',
        'EDUCATION': 'FAMILY',
        'MISCELLANEOUS': 'OTHER',
      };
      const eventCategoryUpper = event.category?.toUpperCase() || '';
      mainCategory = categoryMap[eventCategoryUpper] || null;
      
      // Si toujours pas de catégorie, essayer de déduire du titre/description
      if (!mainCategory) {
        const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
        if (text.includes('concert') || text.includes('music') || text.includes('musique') || text.includes('dj') || text.includes('festival')) {
          mainCategory = 'MUSIC';
        } else if (text.includes('expo') || text.includes('art') || text.includes('culture') || text.includes('théâtre') || text.includes('theatre')) {
          mainCategory = 'ART_CULTURE';
        } else if (text.includes('sport') || text.includes('fitness') || text.includes('course')) {
          mainCategory = 'SPORT';
        } else if (text.includes('famille') || text.includes('family') || text.includes('enfant') || text.includes('kids')) {
          mainCategory = 'FAMILY';
        }
      }
    }
    
    // Si toujours pas de catégorie, utiliser 'OTHER' mais permettre l'affichage quand aucun filtre n'est sélectionné
    if (!mainCategory) {
      mainCategory = 'OTHER';
    }

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
      category: mainCategory,
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

type Mode = 'today' | 'weekend' | 'custom';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
  
  // Récupérer les paramètres de date depuis l'URL pour déterminer le mode initial
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const customDateMode = dateFrom || dateTo;
  
  const [mode, setMode] = useState<Mode>(customDateMode ? 'custom' : 'weekend');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAmbiance, setSelectedAmbiance] = useState<string | null>(null);
  const [selectedPublic, setSelectedPublic] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    queryKey: ['events', mode, selectedCategory, selectedGenre, selectedStyle, selectedType, selectedAmbiance, selectedPublic, dateFrom, dateTo],
    queryFn: async () => {
      try {
        // Récupérer plusieurs pages pour avoir tous les événements (max 100 par page)
        const allEvents: ApiEvent[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore && page <= 10) { // Limiter à 10 pages max (1000 événements)
          const params = new URLSearchParams();
          
          // Gérer le mode de date
          if (customDateMode) {
            // Mode date personnalisée
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
          } else {
            // Mode preset (today/weekend)
            params.set('scope', mode);
          }
          
          params.set('pageSize', '100'); // Maximum autorisé par l'API
          params.set('page', page.toString());
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
          
          // Filtres avancés SPRINT 2
          if (selectedType) {
            params.set('type', selectedType);
          }
          if (selectedAmbiance) {
            params.set('ambiance', selectedAmbiance);
          }
          if (selectedPublic) {
            params.set('public', selectedPublic);
          }
          
          const response = await fetch(`/api/events?${params.toString()}`);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API:', response.status, errorText);
            throw new Error(`Erreur API: ${response.status}`);
          }
          const data: ApiResponse = await response.json();
          allEvents.push(...(data.items || []));
          
          // Vérifier s'il y a plus de pages
          hasMore = page < data.totalPages;
          page++;
        }
        
        // Retourner un objet ApiResponse avec tous les événements
        return {
          items: allEvents,
          total: allEvents.length,
          page: 1,
          pageSize: allEvents.length,
          totalPages: 1,
        };
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
      // La catégorie principale est déjà calculée dans transformApiEvent
      const eventCategory = event.category?.toUpperCase();
      // Si l'événement est classé comme OTHER et qu'une catégorie est sélectionnée, l'exclure
      // Sinon, vérifier la correspondance exacte
      if (eventCategory === 'OTHER' && selectedCategory !== 'OTHER') {
        return false;
      }
      return eventCategory === selectedCategory;
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
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

          {/* Sélecteur de date personnalisé */}
          <div className="mb-12 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-slate-300" />
                <label className="text-base font-semibold text-slate-200">
                  Ou choisir une date précise ou une plage de dates
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={dateFrom ? toMontrealDateString(dateFrom) : ''}
                    onChange={(e) => {
                      const params = new URLSearchParams(window.location.search);
                      
                      if (e.target.value) {
                        const startDate = new Date(e.target.value);
                        startDate.setHours(0, 0, 0, 0);
                        setMode('custom');
                        params.set('dateFrom', startDate.toISOString());
                        
                        // Si pas de date de fin, définir la fin de la journée
                        if (!params.get('dateTo')) {
                          const endDate = new Date(startDate);
                          endDate.setHours(23, 59, 59, 999);
                          params.set('dateTo', endDate.toISOString());
                        }
                      } else {
                        params.delete('dateFrom');
                        // Si on supprime la date de début et qu'il n'y a pas de date de fin, supprimer aussi dateTo
                        if (!params.get('dateTo')) {
                          params.delete('dateTo');
                          setMode('weekend'); // Revenir au mode par défaut
                        }
                      }
                      
                      router.push(params.toString() ? `/?${params.toString()}` : '/');
                    }}
                    min={toMontrealDateString(new Date())} // Empêcher de sélectionner des dates passées
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de fin <span className="text-xs text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="date"
                    value={dateTo ? toMontrealDateString(dateTo) : ''}
                    onChange={(e) => {
                      const params = new URLSearchParams(window.location.search);
                      
                      if (e.target.value) {
                        const endDate = new Date(e.target.value);
                        endDate.setHours(23, 59, 59, 999);
                        setMode('custom');
                        params.set('dateTo', endDate.toISOString());
                        
                        // S'assurer qu'il y a une date de début
                        if (!params.get('dateFrom')) {
                          const startDate = new Date(e.target.value);
                          startDate.setHours(0, 0, 0, 0);
                          params.set('dateFrom', startDate.toISOString());
                        }
                      } else {
                        params.delete('dateTo');
                        // Si on supprime la date de fin et qu'il n'y a pas de date de début, supprimer aussi dateFrom
                        if (!params.get('dateFrom')) {
                          params.delete('dateFrom');
                          setMode('weekend'); // Revenir au mode par défaut
                        }
                      }
                      
                      router.push(params.toString() ? `/?${params.toString()}` : '/');
                    }}
                    min={dateFrom ? toMontrealDateString(dateFrom) : toMontrealDateString(new Date())}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete('dateFrom');
                      params.delete('dateTo');
                      setMode('weekend');
                      router.push(params.toString() ? `/?${params.toString()}` : '/');
                    }}
                    className="text-sm text-slate-300 hover:text-white underline transition-colors"
                  >
                    Réinitialiser les dates
                  </button>
                </div>
              )}
            </div>
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

            {/* Filtres avancés SPRINT 2 : Type, Ambiance, Public */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="mb-4 text-center">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showAdvanced ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
                </button>
              </div>
              
              {/* Filtres avancés (affichage conditionnel) */}
              {showAdvanced && (
              <>
              {/* Type d'événement */}
              <div className="mb-6">
                <div className="mb-2 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Type d'événement
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                      !selectedType
                        ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent shadow-lg shadow-slate-500/50'
                        : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-slate-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    Tout
                  </button>
                  {EVENT_TYPES.slice(0, 10).map((type, index) => {
                    const isActive = selectedType === type;
                    const label = type.replace(/_/g, ' ');
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(isActive ? null : type)}
                        className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-transparent shadow-lg shadow-indigo-500/50'
                            : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-indigo-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                        }`}
                        style={{ animationDelay: `${(index + 1) * 30}ms` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ambiance */}
              <div className="mb-6">
                <div className="mb-2 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Ambiance
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                  <button
                    onClick={() => setSelectedAmbiance(null)}
                    className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                      !selectedAmbiance
                        ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent shadow-lg shadow-slate-500/50'
                        : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-slate-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    Tout
                  </button>
                  {AMBIANCES.map((ambiance, index) => {
                    const isActive = selectedAmbiance === ambiance;
                    const label = ambiance.replace(/_/g, ' ');
                    return (
                      <button
                        key={ambiance}
                        onClick={() => setSelectedAmbiance(isActive ? null : ambiance)}
                        className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg shadow-rose-500/50'
                            : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-rose-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                        }`}
                        style={{ animationDelay: `${(index + 1) * 30}ms` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Public */}
              <div className="mb-4">
                <div className="mb-2 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Public cible
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  <button
                    onClick={() => setSelectedPublic(null)}
                    className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                      !selectedPublic
                        ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent shadow-lg shadow-slate-500/50'
                        : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-slate-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    Tout
                  </button>
                  {PUBLICS.map((publicType, index) => {
                    const isActive = selectedPublic === publicType;
                    const label = publicType === 'tout_public' ? 'Tout public' : 
                                 publicType === '18_plus' ? '18+' : 
                                 publicType.replace(/_/g, ' ');
                    return (
                      <button
                        key={publicType}
                        onClick={() => setSelectedPublic(isActive ? null : publicType)}
                        className={`px-4 py-2 text-xs md:text-sm rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/50'
                            : 'bg-white/5 text-slate-200 border-slate-500/30 hover:border-amber-400/50 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                        }`}
                        style={{ animationDelay: `${(index + 1) * 30}ms` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              </>
              )}
            </div>
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

      {/* Sections IA : Top 5 et Recommandations */}
      <HomePageTrendingSections />
      <HomePageAISections />

      {/* Liste d'événements - Design moderne */}
      <section className="px-4 pb-20 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto relative">
          {/* En-tête avec compteur moderne */}
          <div className="mb-12 text-center pt-8">
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
            {(displayedFilterLabel || selectedType || selectedAmbiance || selectedPublic) && (
              <p className="text-slate-400 text-sm">
                Filtres actifs : {selectedCategory && CATEGORY_LABELS[selectedCategory]?.fr}
                {selectedGenre && ` → ${selectedGenre.replace(/_/g, ' ')}`}
                {selectedStyle && ` → ${selectedStyle.replace(/_/g, ' ')}`}
                {selectedType && ` • Type: ${selectedType.replace(/_/g, ' ')}`}
                {selectedAmbiance && ` • Ambiance: ${selectedAmbiance.replace(/_/g, ' ')}`}
                {selectedPublic && ` • Public: ${selectedPublic === 'tout_public' ? 'Tout public' : selectedPublic === '18_plus' ? '18+' : selectedPublic.replace(/_/g, ' ')}`}
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
                              disabled={isFavoriteLoading(event.id)}
                              className={`p-2 rounded-full backdrop-blur-sm transition-all relative ${
                                isFavorite(event.id)
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              } ${isFavoriteLoading(event.id) ? 'opacity-50 cursor-wait' : ''}`}
                              aria-label={isFavorite(event.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                              {isFavoriteLoading(event.id) ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Heart
                                  className={`w-5 h-5 transition-all duration-200 ${
                                    isFavorite(event.id) ? 'fill-current' : ''
                                  }`}
                                />
                              )}
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

/**
 * Sections Trending : Trending tonight et Popular this weekend
 * Sprint V2: Social proof + trending
 */
function HomePageTrendingSections() {
  // Récupérer les événements trending pour aujourd'hui
  const { data: trendingTodayData, isLoading: trendingTodayLoading } = useQuery({
    queryKey: ['trending-today'],
    queryFn: async () => {
      const res = await fetch('/api/trending?scope=today&limit=6');
      if (!res.ok) return { events: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  // Récupérer les événements trending pour le week-end
  const { data: trendingWeekendData, isLoading: trendingWeekendLoading } = useQuery({
    queryKey: ['trending-weekend'],
    queryFn: async () => {
      const res = await fetch('/api/trending?scope=weekend&limit=6');
      if (!res.ok) return { events: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  const trendingToday = trendingTodayData?.events || [];
  const trendingWeekend = trendingWeekendData?.events || [];

  // Ne rien afficher si pas de contenu
  if (trendingToday.length === 0 && trendingWeekend.length === 0) {
    return null;
  }

  const { favorites, isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites();

  // Transformer les événements trending en format Event
  const transformTrendingEvent = (trendingEvent: any): Event => {
    return {
      id: trendingEvent.id,
      title: trendingEvent.title,
      description: trendingEvent.description || '',
      shortDescription: trendingEvent.description?.substring(0, 100) + '...' || '',
      startDate: new Date(trendingEvent.startAt),
      endDate: trendingEvent.endAt ? new Date(trendingEvent.endAt) : undefined,
      location: trendingEvent.venue
        ? {
            name: trendingEvent.venue.name,
            address: trendingEvent.venue.address || '',
            city: trendingEvent.venue.city || 'Montréal',
            postalCode: '',
            coordinates: {
              lat: trendingEvent.venue.lat,
              lng: trendingEvent.venue.lon,
            },
          }
        : {
            name: 'Lieu à confirmer',
            address: '',
            city: 'Montréal',
            postalCode: '',
            coordinates: { lat: 45.5088, lng: -73.5542 },
          },
      category: trendingEvent.category,
      subCategory: '',
      tags: trendingEvent.tags || [],
      price: {
        amount: (trendingEvent.priceMin || 0) / 100,
        currency: trendingEvent.currency || 'CAD',
        isFree: (trendingEvent.priceMin || 0) === 0,
      },
      imageUrl: trendingEvent.imageUrl,
      ticketUrl: trendingEvent.url || '#',
      organizerId: 'default',
      organizer: {
        id: 'default',
        email: 'api@pulse.com',
        name: 'Organisateur',
        role: 'organizer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      customFilters: [],
      accessibility: [],
      status: 'published' as const,
      source: trendingEvent.source,
      externalId: trendingEvent.id,
      language: 'fr' as const,
      minAttendees: 0,
      maxAttendees: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  return (
    <section className="px-4 py-12 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Trending tonight */}
        {trendingToday.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    Trending tonight
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Les événements les plus populaires ce soir</p>
                </div>
              </div>
              <Link
                href="/ce-soir"
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {trendingTodayLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingToday.slice(0, 6).map((trendingEvent: any) => {
                  const event = transformTrendingEvent(trendingEvent);
                  return (
                    <div key={event.id} className="relative">
                      <EventCard
                        event={event}
                        onFavoriteToggle={toggleFavorite}
                        isFavorite={isFavorite(event.id)}
                        isFavoriteLoading={isFavoriteLoading(event.id)}
                      />
                      {/* Badge Trending */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-1 rounded-lg bg-red-500/90 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </span>
                      </div>
                      {/* Social proof */}
                      {trendingEvent.favoritesToday > 0 && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="px-2 py-1 rounded-lg bg-black/60 text-white text-xs backdrop-blur-sm">
                            {trendingEvent.favoritesToday} sauvegardé{trendingEvent.favoritesToday > 1 ? 's' : ''} aujourd'hui
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section Popular this weekend */}
        {trendingWeekend.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    Popular this weekend
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Les événements les plus populaires ce week-end</p>
                </div>
              </div>
              <Link
                href="/ce-weekend"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {trendingWeekendLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingWeekend.slice(0, 6).map((trendingEvent: any) => {
                  const event = transformTrendingEvent(trendingEvent);
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      onFavoriteToggle={toggleFavorite}
                      isFavorite={isFavorite(event.id)}
                      isFavoriteLoading={isFavoriteLoading(event.id)}
                      favoritesToday={trendingEvent.favoritesToday || 0}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Sections IA : Top 5 Pulse Picks et Recommandations personnalisées
 */
function HomePageAISections() {
  const { data: session } = useSession();
  
  // Récupérer les Top 5 publiés
  const { data: top5Data, isLoading: top5Loading } = useQuery({
    queryKey: ['pulse-picks-public'],
    queryFn: async () => {
      const res = await fetch(`/api/editorial/pulse-picks/public?limit=3&_t=${Date.now()}`);
      if (!res.ok) return { posts: [] };
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes au lieu de 10
    refetchOnMount: true,
  });

  // Récupérer les recommandations si connecté
  const { data: recommendationsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations-home', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return { recommendations: [] };
      const res = await fetch('/api/recommendations?limit=6&scope=all');
      if (!res.ok) return { recommendations: [] };
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const top5Posts = top5Data?.posts || [];
  const recommendations = recommendationsData?.recommendations || [];

  // Ne rien afficher si pas de contenu
  if (top5Posts.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-12 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Top 5 Pulse Picks */}
        {top5Posts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    Pulse Picks
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      IA
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Top 5 sélectionnés par notre IA</p>
                </div>
              </div>
              <Link
                href="/top-5"
                className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Voir tous
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {top5Loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top5Posts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/top-5/${post.slug}`}
                    className="group p-5 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {post.eventsCount} événement{post.eventsCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
                        Top 5
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(post.periodStart).toLocaleDateString('fr-CA', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' - '}
                        {new Date(post.periodEnd).toLocaleDateString('fr-CA', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Recommandations personnalisées */}
        {session?.user && recommendations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    Pour toi
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      IA
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Recommandations basées sur vos goûts</p>
                </div>
              </div>
              <Link
                href="/pour-toi"
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 6).map((rec: any) => {
                  const event = rec.event;
                  return (
                    <div
                      key={event.id}
                      className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
                    >
                      {event.imageUrl && (
                        <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-purple-600 to-pink-600">
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(event.imageUrl)}`}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {event.title}
                      </h3>
                      {event.venue?.name && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue.name}
                        </p>
                      )}
                      {rec.score && (
                        <div className="mt-2 text-xs text-purple-400">
                          Score: {(rec.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

