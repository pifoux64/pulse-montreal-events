'use client';

import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';

interface CeSoirPageClientProps {
  events: Event[];
}

export default function CeSoirPageClient({ events }: CeSoirPageClientProps) {
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  return (
    <>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-600">
            Aucun événement prévu ce soir. Découvrez les événements de demain ou ce week-end.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onFavoriteToggle={toggleFavorite}
              isFavorite={isFavorite(event.id)}
              isFavoriteLoading={isFavoriteLoading(event.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

