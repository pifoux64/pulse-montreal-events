'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, DollarSign, Heart, Share2, ExternalLink, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFavorites } from '@/hooks/useFavorites';
import EventShareModal from '../EventShareModal';

interface EventHeaderProps {
  event: {
    id: string;
    title: string;
    startAt: Date;
    endAt?: Date | null;
    venue?: {
      id: string;
      name: string;
      slug?: string | null;
      address?: string | null;
      city?: string | null;
      lat?: number | null;
      lon?: number | null;
    } | null;
    priceMin?: number | null;
    priceMax?: number | null;
    currency?: string | null;
    url?: string | null;
  };
  userLocation?: { lat: number; lon: number } | null;
}

/**
 * Calcule la distance entre deux points en kilomètres
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function EventHeader({ event, userLocation }: EventHeaderProps) {
  const { data: session } = useSession();
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites();
  const [showShareModal, setShowShareModal] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Calculer la distance si la localisation utilisateur est disponible
  useEffect(() => {
    if (userLocation && event.venue?.lat && event.venue?.lon) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        event.venue.lat,
        event.venue.lon
      );
      setDistance(dist);
    }
  }, [userLocation, event.venue]);

  const handleFavoriteClick = async () => {
    if (!session) {
      // Optionnel: afficher un prompt de connexion
      return;
    }
    await toggleFavorite(event.id);
  };

  const formatPrice = () => {
    if (event.priceMin === null || event.priceMin === undefined) {
      return null;
    }
    if (event.priceMin === 0) {
      return 'Gratuit';
    }
    const currency = event.currency || 'CAD';
    const min = (event.priceMin / 100).toFixed(2);
    if (event.priceMax && event.priceMax !== event.priceMin) {
      const max = (event.priceMax / 100).toFixed(2);
      return `${min} $ - ${max} $`;
    }
    return `${min} $`;
  };

  const formatDate = () => {
    const date = new Date(event.startAt);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal',
    });
  };

  const formatTime = () => {
    const start = new Date(event.startAt);
    const startTime = start.toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal',
    });
    
    if (event.endAt) {
      const end = new Date(event.endAt);
      const endTime = end.toLocaleTimeString('fr-CA', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Montreal',
      });
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{event.title}</h1>

        {/* Informations principales */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-white/90">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-medium">{formatDate()}</div>
              <div className="text-sm text-white/70">{formatTime()}</div>
            </div>
          </div>

          {/* Venue */}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <div>
                <Link
                  href={event.venue.slug ? `/salle/${event.venue.slug}` : `/salle/${event.venue.id}`}
                  className="font-medium hover:text-blue-400 transition-colors"
                >
                  {event.venue.name}
                </Link>
                {event.venue.address && (
                  <div className="text-sm text-white/70">
                    {event.venue.address}, {event.venue.city}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distance */}
          {distance !== null && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <span className="text-sm">
                {distance < 1 
                  ? `${Math.round(distance * 1000)} m`
                  : `${distance.toFixed(1)} km`}
              </span>
            </div>
          )}

          {/* Prix */}
          {formatPrice() && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <span className="font-medium">{formatPrice()}</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Interested / Favorite */}
          <button
            onClick={handleFavoriteClick}
            disabled={isFavoriteLoading(event.id) || !session}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isFavorite(event.id)
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isFavoriteLoading(event.id) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${isFavorite(event.id) ? 'fill-current' : ''}`} />
            )}
            <span>{isFavorite(event.id) ? 'Intéressé' : "S'intéresser"}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager</span>
          </button>

          {/* Buy Tickets (external) */}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Billets</span>
            </a>
          )}

          {/* Login prompt if not authenticated */}
          {!session && (
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
              className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter pour sauvegarder</span>
            </Link>
          )}
        </div>
      </div>

      <EventShareModal
        eventId={event.id}
        eventTitle={event.title}
        eventVenue={event.venue}
        eventStartAt={event.startAt}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
