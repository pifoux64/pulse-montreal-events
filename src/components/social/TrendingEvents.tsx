'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Calendar } from 'lucide-react';
import VenueEventCard from '@/components/VenueEventCard';

export default function TrendingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'today' | 'weekend' | 'week'>('today');

  useEffect(() => {
    loadTrending();
  }, [scope]);

  const loadTrending = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trending?scope=${scope}&limit=20`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setEvents(data.events || []);
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

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Événements tendance
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setScope('today')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              scope === 'today'
                ? 'bg-sky-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setScope('weekend')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              scope === 'weekend'
                ? 'bg-sky-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Week-end
          </button>
          <button
            onClick={() => setScope('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              scope === 'week'
                ? 'bg-sky-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
          <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-300">Aucun événement tendance pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <div key={event.id} className="relative">
              <VenueEventCard event={event} />
              {event.trendScore > 0 && (
                <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
