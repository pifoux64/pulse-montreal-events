/**
 * Page verticale Culture
 * SPRINT B: Pages spécialisées pour découverte d'événements
 */

'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { Event } from '@/types';
import { Palette, Sparkles, BookOpen, Film, Music } from 'lucide-react';

export default function CulturePage() {
  const { data: events = [], isLoading } = useEvents();
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  // Filtrer les événements culture
  const cultureEvents = events.filter((event) => {
    // Filtrer par catégories culturelles
    const cultureCategories = ['EXHIBITION', 'THEATRE', 'EDUCATION', 'COMMUNITY'];
    if (cultureCategories.includes(event.category)) {
      return true;
    }

    // Filtrer par tags structurés
    if (event.eventTags) {
      const hasCultureTag = event.eventTags.some(
        (tag) =>
          tag.category === 'type' &&
          (tag.value === 'exhibition' ||
            tag.value === 'theatre' ||
            tag.value === 'workshop' ||
            tag.value === 'conference')
      );
      if (hasCultureTag) return true;
    }

    // Filtrer par tags libres
    const tagsLower = event.tags.map((t) => t.toLowerCase());
    if (
      tagsLower.some((tag) =>
        [
          'culture',
          'exposition',
          'exhibition',
          'théâtre',
          'theatre',
          'musée',
          'museum',
          'art',
          'galerie',
          'gallery',
          'atelier',
          'workshop',
          'conférence',
          'conference',
        ].some((kw) => tag.includes(kw))
      )
    ) {
      return true;
    }

    return false;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-950 text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
            <Palette className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Culture & Arts
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explorez les expositions, spectacles, ateliers et événements culturels de Montréal
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Palette className="w-6 h-6 text-purple-400" />
              <div className="text-3xl font-bold text-white">{cultureEvents.length}</div>
            </div>
            <div className="text-gray-300 text-sm">Événements culture</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <div className="text-3xl font-bold text-white">
                {cultureEvents.filter((e) =>
                  e.tags.some((t) => t.toLowerCase().includes('exposition') || t.toLowerCase().includes('exhibition'))
                ).length}
              </div>
            </div>
            <div className="text-gray-300 text-sm">Expositions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Film className="w-6 h-6 text-red-400" />
              <div className="text-3xl font-bold text-white">
                {cultureEvents.filter((e) =>
                  e.tags.some((t) => t.toLowerCase().includes('théâtre') || t.toLowerCase().includes('theatre'))
                ).length}
              </div>
            </div>
            <div className="text-gray-300 text-sm">Spectacles</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-6 h-6 text-green-400" />
              <div className="text-3xl font-bold text-white">
                {cultureEvents.filter((e) => e.price?.isFree).length}
              </div>
            </div>
            <div className="text-gray-300 text-sm">Gratuits</div>
          </div>
        </div>

        {/* Liste des événements */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : cultureEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Aucun événement culture trouvé
            </h3>
            <p className="text-gray-400">
              Revenez bientôt pour découvrir de nouveaux événements culturels !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultureEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event as unknown as Event}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite(event.id)}
                isFavoriteLoading={isFavoriteLoading(event.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

