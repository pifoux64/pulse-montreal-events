'use client';

/**
 * Composant pour afficher les événements similaires
 * SPRINT 2: Personalization & Recommendations
 */

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import EventCard from './EventCard';
import { Loader2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface SimilarEventsProps {
  eventId: string;
  limit?: number;
}

export default function SimilarEvents({ eventId, limit = 5 }: SimilarEventsProps) {
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, isFavoriteLoading } = useFavorites();

  useEffect(() => {
    async function fetchSimilar() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}/similar?limit=${limit}`);
        if (!res.ok) {
          throw new Error('Erreur lors de la récupération des événements similaires');
        }
        const data = await res.json();
        setSimilarEvents(data.similar || []);
      } catch (err: any) {
        console.error('Erreur fetchSimilar:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchSimilar();
    }
  }, [eventId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || similarEvents.length === 0) {
    return null; // Ne rien afficher si erreur ou pas d'événements similaires
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Événements similaires</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onFavoriteToggle={async () => {
              await toggleFavorite(event.id);
            }}
            isFavorite={isFavorite(event.id)}
            isFavoriteLoading={isFavoriteLoading(event.id)}
            showImage={true}
          />
        ))}
      </div>
    </section>
  );
}

