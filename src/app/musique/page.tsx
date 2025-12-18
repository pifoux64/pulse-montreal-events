/**
 * Page verticale Musique
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
import { Music, Sparkles, Headphones, Mic, Radio, Disc } from 'lucide-react';

export default function MusiquePage() {
  const { data: events = [], isLoading } = useEvents();
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  // Filtrer les événements musique
  const musiqueEvents = events.filter((event) => {
    // Filtrer par catégorie MUSIC
    if (event.category === 'MUSIC' || event.category === 'Music' || event.category === 'Musique') {
      return true;
    }

    // Filtrer par tags structurés
    if (event.eventTags) {
      const hasMusicTag = event.eventTags.some(
        (tag) =>
          (tag.category === 'type' &&
            (tag.value === 'concert' ||
              tag.value === 'festival' ||
              tag.value === 'show' ||
              tag.value === 'dj set' ||
              tag.value === 'live')) ||
          (tag.category === 'genre' &&
            (tag.value.includes('music') ||
              tag.value.includes('musique') ||
              tag.value.includes('reggae') ||
              tag.value.includes('dancehall') ||
              tag.value.includes('hip hop') ||
              tag.value.includes('rock') ||
              tag.value.includes('jazz') ||
              tag.value.includes('electronic')))
      );
      if (hasMusicTag) return true;
    }

    // Filtrer par tags libres
    const tagsLower = event.tags.map((t) => t.toLowerCase());
    if (
      tagsLower.some((tag) =>
        [
          'musique',
          'music',
          'concert',
          'live',
          'dj',
          'dj set',
          'festival',
          'band',
          'groupe',
          'artiste',
          'artist',
          'reggae',
          'dancehall',
          'hip hop',
          'rap',
          'rock',
          'jazz',
          'electronic',
          'techno',
          'house',
          'sound system',
        ].some((kw) => tag.includes(kw))
      )
    ) {
      return true;
    }

    // Filtrer par description ou titre
    const searchText = `${event.title} ${event.description}`.toLowerCase();
    if (
      [
        'concert',
        'live',
        'dj',
        'festival',
        'musique',
        'music',
        'band',
        'groupe',
        'artiste',
        'sound system',
      ].some((kw) => searchText.includes(kw))
    ) {
      return true;
    }

    return false;
  });

  // Statistiques par type de musique
  const concerts = musiqueEvents.filter((e) =>
    e.tags.some((t) => t.toLowerCase().includes('concert') || t.toLowerCase().includes('live'))
  );
  const festivals = musiqueEvents.filter((e) =>
    e.tags.some((t) => t.toLowerCase().includes('festival'))
  );
  const djSets = musiqueEvents.filter((e) =>
    e.tags.some((t) => t.toLowerCase().includes('dj') || t.toLowerCase().includes('sound system'))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-gray-950 text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-full mb-6 animate-pulse">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Événements Musique
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez les concerts, festivals, DJ sets et événements musicaux à Montréal
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-pink-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-6 h-6 text-pink-400" />
              <div className="text-3xl font-bold text-white">{musiqueEvents.length}</div>
            </div>
            <div className="text-gray-300 text-sm">Événements musique</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="w-6 h-6 text-purple-400" />
              <div className="text-3xl font-bold text-white">{concerts.length}</div>
            </div>
            <div className="text-gray-300 text-sm">Concerts</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Radio className="w-6 h-6 text-indigo-400" />
              <div className="text-3xl font-bold text-white">{festivals.length}</div>
            </div>
            <div className="text-gray-300 text-sm">Festivals</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Disc className="w-6 h-6 text-cyan-400" />
              <div className="text-3xl font-bold text-white">{djSets.length}</div>
            </div>
            <div className="text-gray-300 text-sm">DJ Sets</div>
          </div>
        </div>

        {/* Liste des événements */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : musiqueEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Aucun événement musique trouvé
            </h3>
            <p className="text-gray-400">
              Revenez bientôt pour découvrir de nouveaux événements musicaux !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {musiqueEvents.map((event) => (
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

