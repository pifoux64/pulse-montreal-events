'use client';

import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';

interface CeWeekendPageClientProps {
  events: Event[];
}

export default function CeWeekendPageClient({ events }: CeWeekendPageClientProps) {
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites(events);

  return (
    <>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-600">
            Aucun événement prévu ce week-end. Découvrez les événements de la semaine prochaine.
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

