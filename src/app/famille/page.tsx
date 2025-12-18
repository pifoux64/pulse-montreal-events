/**
 * Page verticale Famille
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
import { Users, Sparkles, Filter } from 'lucide-react';

export default function FamillePage() {
  const { data: events = [], isLoading } = useEvents();
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  // Filtrer les événements famille
  const familleEvents = events.filter((event) => {
    // Filtrer par catégorie FAMILY
    if (event.category === 'FAMILY' || event.category === 'Famille') {
      return true;
    }

    // Filtrer par tags structurés
    if (event.eventTags) {
      const hasFamilyTag = event.eventTags.some(
        (tag) =>
          tag.category === 'public' &&
          (tag.value === 'kids' || tag.value === 'family' || tag.value === 'enfants')
      );
      if (hasFamilyTag) return true;
    }

    // Filtrer par tags libres
    const tagsLower = event.tags.map((t) => t.toLowerCase());
    if (
      tagsLower.some((tag) =>
        ['famille', 'family', 'enfant', 'kid', 'children', 'jeunesse'].some((kw) =>
          tag.includes(kw)
        )
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Événements Famille
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez des activités et événements adaptés aux familles et aux enfants à Montréal
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">{familleEvents.length}</div>
            <div className="text-gray-300">Événements famille</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">
              {familleEvents.filter((e) => e.price?.isFree).length}
            </div>
            <div className="text-gray-300">Événements gratuits</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">
              {familleEvents.filter((e) => new Date(e.startDate) > new Date()).length}
            </div>
            <div className="text-gray-300">À venir</div>
          </div>
        </div>

        {/* Liste des événements */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : familleEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Aucun événement famille trouvé
            </h3>
            <p className="text-gray-400">
              Revenez bientôt pour découvrir de nouveaux événements adaptés aux familles !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familleEvents.map((event) => (
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

