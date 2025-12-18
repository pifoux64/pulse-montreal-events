/**
 * Page verticale Sport
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
import { Trophy, Sparkles, Activity, Users } from 'lucide-react';

export default function SportPage() {
  const { data: events = [], isLoading } = useEvents();
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  // Filtrer les événements sport
  const sportEvents = events.filter((event) => {
    // Filtrer par catégorie SPORT
    if (event.category === 'SPORT' || event.category === 'Sport') {
      return true;
    }

    // Filtrer par tags structurés
    if (event.eventTags) {
      const hasSportTag = event.eventTags.some(
        (tag) =>
          tag.category === 'type' &&
          (tag.value === 'sport' ||
            tag.value === 'athletics' ||
            tag.value === 'competition' ||
            tag.value === 'race')
      );
      if (hasSportTag) return true;
    }

    // Filtrer par tags libres
    const tagsLower = event.tags.map((t) => t.toLowerCase());
    if (
      tagsLower.some((tag) =>
        [
          'sport',
          'athlétisme',
          'course',
          'running',
          'marathon',
          'football',
          'soccer',
          'basketball',
          'hockey',
          'tennis',
          'cyclisme',
          'vélo',
          'bike',
          'yoga',
          'fitness',
          'compétition',
          'competition',
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Sport & Loisirs
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez les événements sportifs, compétitions et activités de plein air à Montréal
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-blue-400" />
              <div className="text-3xl font-bold text-white">{sportEvents.length}</div>
            </div>
            <div className="text-gray-300 text-sm">Événements sport</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div className="text-3xl font-bold text-white">
                {sportEvents.filter((e) =>
                  e.tags.some((t) =>
                    t.toLowerCase().includes('compétition') || t.toLowerCase().includes('competition')
                  )
                ).length}
              </div>
            </div>
            <div className="text-gray-300 text-sm">Compétitions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-green-400" />
              <div className="text-3xl font-bold text-white">
                {sportEvents.filter((e) => e.price?.isFree).length}
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
        ) : sportEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Aucun événement sport trouvé
            </h3>
            <p className="text-gray-400">
              Revenez bientôt pour découvrir de nouveaux événements sportifs !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportEvents.map((event) => (
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

