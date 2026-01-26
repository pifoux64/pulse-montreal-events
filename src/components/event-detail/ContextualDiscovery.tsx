'use client';

import { useState, useEffect } from 'react';
import { Loader2, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Event } from '@/types';
import EventCard from '../EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import { transformPrismaEventToEvent } from '@/lib/transformPrismaEvent';

interface ContextualDiscoveryProps {
  eventId: string;
  venueId?: string | null;
  organizerId?: string | null;
  limit?: number;
}

export default function ContextualDiscovery({
  eventId,
  venueId,
  organizerId,
  limit = 5,
}: ContextualDiscoveryProps) {
  const t = useTranslations('eventDetail');
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [venueEvents, setVenueEvents] = useState<Event[]>([]);
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite, isFavoriteLoading } = useFavorites();

  useEffect(() => {
    const fetchContextualEvents = async () => {
      try {
        setLoading(true);

        // Fetch similar events
        const similarRes = await fetch(`/api/events/${eventId}/similar?limit=${limit}`);
        if (similarRes.ok) {
          const similarData = await similarRes.json();
          // Transformer les événements Prisma en format Event
          const transformed = (similarData.similar || []).map((e: any) => {
            try {
              return transformPrismaEventToEvent(e);
            } catch (err) {
              console.error('Erreur transformation similar event:', err);
              return null;
            }
          }).filter((e: Event | null): e is Event => e !== null);
          setSimilarEvents(transformed);
        }

        // Fetch venue events
        if (venueId) {
          const venueRes = await fetch(`/api/venues/${venueId}/events?limit=${limit}&exclude=${eventId}`);
          if (venueRes.ok) {
            const venueData = await venueRes.json();
            const transformed = (venueData.events || []).map((e: any) => {
              try {
                return transformPrismaEventToEvent(e);
              } catch (err) {
                console.error('Erreur transformation venue event:', err);
                return null;
              }
            }).filter((e: Event | null): e is Event => e !== null);
            setVenueEvents(transformed);
          }
        }

        // Fetch organizer events
        if (organizerId) {
          const organizerRes = await fetch(`/api/organizers/${organizerId}/events?limit=${limit}&exclude=${eventId}`);
          if (organizerRes.ok) {
            const organizerData = await organizerRes.json();
            const transformed = (organizerData.events || []).map((e: any) => {
              try {
                return transformPrismaEventToEvent(e);
              } catch (err) {
                console.error('Erreur transformation organizer event:', err);
                return null;
              }
            }).filter((e: Event | null): e is Event => e !== null);
            setOrganizerEvents(transformed);
          }
        }
      } catch (error) {
        console.error('Erreur fetch contextual events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContextualEvents();
  }, [eventId, venueId, organizerId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  const hasContent = similarEvents.length > 0 || venueEvents.length > 0 || organizerEvents.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Similar events this week */}
      {similarEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">{t('similarEventsThisWeek')}</h2>
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
      )}

      {/* Other events at same venue */}
      {venueEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">{t('otherEventsAtVenue')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venueEvents.map((event) => (
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
      )}

      {/* More events by same organizer */}
      {organizerEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">{t('moreEventsByOrganizer')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerEvents.map((event) => (
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
      )}
    </div>
  );
}
