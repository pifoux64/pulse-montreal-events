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
      subCategory: event.tags?.[0] || '',
      tags: event.tags || [],
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
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

  // Récupérer les événements selon le mode
  const { data: apiData, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['events', mode],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/events?scope=${mode}&pageSize=50`);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navigation />

      {/* Hero Section - SPRINT 1 */}
      <section className="relative px-4 py-16 md:py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          {/* Titre principal */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Trouver quoi faire à Montréal
            <span className="block text-2xl md:text-3xl font-normal text-slate-300 mt-2">
              aujourd'hui
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Concert, soirée, expo ou sortie famille
          </p>

          {/* Boutons CTA - SPRINT 1 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => setMode('today')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                mode === 'today'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Que faire aujourd'hui ?
            </button>
            <button
              onClick={() => setMode('weekend')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                mode === 'weekend'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Que faire ce week-end ?
            </button>
          </div>

          {/* Lien vers la carte - SPRINT 1 */}
          <a
            href="/carte"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Voir sur la carte
          </a>
        </div>
      </section>

      {/* Liste d'événements - SPRINT 1 */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* En-tête avec compteur */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {mode === 'today' ? "Aujourd'hui" : 'Ce week-end'}
            </h2>
            {!isLoading && (
              <p className="text-slate-400">
                {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
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
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-xl"
                    >
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
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

