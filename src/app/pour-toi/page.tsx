'use client';

/**
 * Page "Pour toi" - Recommandations personnalisées
 * Affiche les événements recommandés basés sur les goûts musicaux de l'utilisateur
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Event } from '@/types';
import { Sparkles, Music, Heart, Loader2, AlertCircle, RefreshCw, Calendar, Trophy, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Types pour l'API de recommandations
interface RecommendationEvent {
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

interface RecommendationResult {
  event: RecommendationEvent;
  score: number;
  reasons: string[];
}

interface RecommendationsResponse {
  recommendations: RecommendationResult[];
  count: number;
}

// Transformation API → Frontend (même logique que HomePage)
const transformRecommendationEvent = (rec: RecommendationResult): Event => {
  const event = rec.event;
  const structuredTags = event.eventTags ?? [];
  const categoryTags = structuredTags
    .filter((t) => t.category === 'category')
    .map((t) => t.value);
  const genreTags = structuredTags
    .filter((t) => t.category === 'genre')
    .map((t) => t.value);

  let mainCategory = categoryTags[0] || null;
  if (!mainCategory && genreTags.length > 0) {
    mainCategory = 'MUSIC';
  } else if (!mainCategory) {
    const categoryMap: Record<string, string> = {
      MUSIC: 'MUSIC',
      ARTS_THEATRE: 'ART_CULTURE',
      'ARTS & THEATRE': 'ART_CULTURE',
      ARTS_AND_THEATRE: 'ART_CULTURE',
      SPORTS: 'SPORT',
      SPORT: 'SPORT',
      FAMILY: 'FAMILY',
      COMMUNITY: 'ART_CULTURE',
      EDUCATION: 'FAMILY',
      MISCELLANEOUS: 'OTHER',
    };
    const eventCategoryUpper = event.category?.toUpperCase() || '';
    mainCategory = categoryMap[eventCategoryUpper] || 'OTHER';
  }

  const normalizedStructured = [...genreTags].map((v) => v.replace(/_/g, ' '));

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
      postalCode: '',
      coordinates: {
        lat: event.venue?.lat ?? 45.5088,
        lng: event.venue?.lon ?? -73.5542,
      },
    },
    category: mainCategory || 'OTHER',
    subCategory: genreTags[0]?.replace(/_/g, ' ') || event.tags?.[0] || '',
    tags: Array.from(new Set([...(event.tags || []), ...normalizedStructured])),
    price: {
      amount: event.priceMin != null ? event.priceMin / 100 : 0,
      currency: event.currency || 'CAD',
      isFree: event.priceMin === 0 && event.priceMin != null, // Gratuit seulement si explicitement 0
    },
    imageUrl: event.imageUrl || null,
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
    // Ajouter les métadonnées de recommandation
    recommendationScore: rec.score,
    recommendationReasons: rec.reasons,
  } as Event & { recommendationScore?: number; recommendationReasons?: string[] };
};

type Scope = 'today' | 'weekend' | 'all';

export default function PourToiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('all');

  // Rediriger si non authentifié (dans useEffect pour éviter setState pendant render)
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/pour-toi');
    }
  }, [status, router]);

  // Ne rien afficher si non authentifié (la redirection est en cours)
  if (status === 'unauthenticated') {
    return null;
  }

  // Récupérer le genre le plus écouté sur Spotify
  const { data: mostListenedGenre } = useQuery({
    queryKey: ['most-listened-genre', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/most-listened-genre');
      if (!response.ok) return null;
      const data = await response.json();
      return data.genre;
    },
    enabled: status === 'authenticated',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Récupérer le Top 5 du genre le plus écouté
  const { data: top5GenreData } = useQuery({
    queryKey: ['top5-genre', mostListenedGenre],
    queryFn: async () => {
      if (!mostListenedGenre) return null;
      const response = await fetch(`/api/editorial/pulse-picks/genre/${mostListenedGenre}?_t=${Date.now()}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.post;
    },
    enabled: !!mostListenedGenre,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true,
  });

  // Récupérer un Top 5 général (fallback si pas de genre Spotify)
  const { data: top5Data } = useQuery({
    queryKey: ['top5-for-recommendations'],
    queryFn: async () => {
      const response = await fetch(`/api/editorial/pulse-picks/public?limit=10&_t=${Date.now()}`);
      if (!response.ok) return null;
      const data = await response.json();
      // Prendre le premier Top 5 qui a des événements
      return data.posts?.find((p: any) => p.eventsCount > 0) || data.posts?.[0] || null;
    },
    enabled: !mostListenedGenre || !top5GenreData, // Seulement si pas de genre Spotify ou pas de Top 5 pour ce genre
    staleTime: 2 * 60 * 1000, // 2 minutes au lieu de 10
    refetchOnMount: true,
  });

  // Récupérer les recommandations
  const {
    data: recommendationsData,
    isLoading,
    error,
    refetch,
  } = useQuery<RecommendationsResponse>({
    queryKey: ['recommendations', scope, session?.user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('scope', scope);
      const response = await fetch(`/api/recommendations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des recommandations');
      }
      return response.json();
    },
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const recommendations: (Event & { recommendationScore?: number; recommendationReasons?: string[] })[] =
    (recommendationsData?.recommendations || []).map(transformRecommendationEvent);

  // Système de favoris
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(recommendations);

  const handleEventClick = (event: Event) => {
    router.push(`/evenement/${event.id}`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              Pour toi
              <span className="text-sm px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-600 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                IA
              </span>
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Découvrez des événements faits pour vous, basés sur vos goûts musicaux et préférences.
          </p>
        </div>

        {/* Section Top 5 du genre le plus écouté sur Spotify */}
        {top5GenreData && mostListenedGenre && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <Music className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Top 5 {mostListenedGenre.charAt(0).toUpperCase() + mostListenedGenre.slice(1).replace(/_/g, ' ')}
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-700 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Basé sur Spotify
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Votre genre le plus écouté • {top5GenreData.eventsCount} événement{top5GenreData.eventsCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link
                href={`/top-5/${top5GenreData.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-sm"
              >
                Voir le Top 5
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {top5GenreData.description && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{top5GenreData.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(top5GenreData.periodStart).toLocaleDateString('fr-CA', {
                  month: 'long',
                  day: 'numeric',
                })}
                {' - '}
                {new Date(top5GenreData.periodEnd).toLocaleDateString('fr-CA', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {/* Section Top 5 Pulse Picks général (fallback) */}
        {top5Data && !top5GenreData && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Trophy className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {top5Data.title}
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-700 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      IA
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Top 5 sélectionné par notre IA • {top5Data.eventsCount} événement{top5Data.eventsCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link
                href={`/top-5/${top5Data.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors text-sm"
              >
                Voir le Top 5
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {top5Data.description && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{top5Data.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(top5Data.periodStart).toLocaleDateString('fr-CA', {
                  month: 'long',
                  day: 'numeric',
                })}
                {' - '}
                {new Date(top5Data.periodEnd).toLocaleDateString('fr-CA', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {/* Filtres de scope */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setScope('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scope === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Aujourd'hui
          </button>
          <button
            onClick={() => setScope('weekend')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scope === 'weekend'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Ce week-end
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scope === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tous les événements
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">
              Erreur lors du chargement des recommandations. Vérifiez votre connexion.
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement de vos recommandations...</span>
          </div>
        )}

        {/* Recommandations */}
        {!isLoading && !error && (
          <>
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Aucune recommandation pour le moment
                </h2>
                <p className="text-gray-600 mb-6">
                  Connectez Spotify ou ajoutez des préférences dans votre profil pour recevoir des
                  recommandations personnalisées.
                </p>
                <button
                  onClick={() => router.push('/profil')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Aller au profil
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {recommendations.length} événement{recommendations.length > 1 ? 's' : ''}{' '}
                  recommandé{recommendations.length > 1 ? 's' : ''} pour vous
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard
                        event={event}
                        onFavoriteToggle={toggleFavorite}
                        onEventClick={handleEventClick}
                        isFavorite={isFavorite(event.id)}
                        isFavoriteLoading={isFavoriteLoading(event.id)}
                      />
                      {/* Badge de recommandation */}
                      {event.recommendationScore && event.recommendationScore > 0.3 && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            Recommandé
                          </div>
                        </div>
                      )}
                      {/* Raisons de recommandation */}
                      {event.recommendationReasons && event.recommendationReasons.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 italic">
                          {event.recommendationReasons[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

