'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import VenueEventCard from '@/components/VenueEventCard';

export default function FriendsEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users/friends/events?limit=20');
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setEvents(data.events || []);
      if (data.message) {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
        <Users className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
        <p className="text-slate-300">{error}</p>
        <p className="text-slate-400 text-sm mt-2">
          Suivez des utilisateurs pour voir leurs événements favoris
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
        <Users className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
        <p className="text-slate-300">Aucun événement de vos amis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6" />
          Où vont mes amis
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((eventData: any) => (
          <div key={eventData.id} className="relative">
            <VenueEventCard event={eventData} />
            {eventData.friendsWhoFavorited && eventData.friendsWhoFavorited.length > 0 && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white flex items-center gap-1">
                <Users className="w-3 h-3" />
                {eventData.friendsWhoFavorited.length} ami{eventData.friendsWhoFavorited.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
