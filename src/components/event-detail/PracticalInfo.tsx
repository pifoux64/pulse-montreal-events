'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Volume2, Accessibility, Navigation } from 'lucide-react';
import EventDetailMap from '../EventDetailMap';

interface PracticalInfoProps {
  venue?: {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    lat?: number | null;
    lon?: number | null;
    neighborhood?: string | null;
  } | null;
  startAt: Date;
  endAt?: Date | null;
  accessibility?: string[] | null;
  estimatedDuration?: number | null; // en minutes
  soundLevel?: 'quiet' | 'moderate' | 'loud' | 'very_loud' | null;
}

const soundLevelLabels = {
  quiet: 'Calme',
  moderate: 'Modéré',
  loud: 'Fort',
  very_loud: 'Très fort',
};

export default function PracticalInfo({
  venue,
  startAt,
  endAt,
  accessibility,
  estimatedDuration,
  soundLevel,
}: PracticalInfoProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Ignore errors silently
        }
      );
    }
  }, []);

  const calculateDuration = () => {
    if (estimatedDuration) {
      return estimatedDuration;
    }
    if (endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      const diffMs = end.getTime() - start.getTime();
      return Math.round(diffMs / (1000 * 60)); // en minutes
    }
    return null;
  };

  const duration = calculateDuration();

  const getTransportHints = () => {
    if (!venue?.neighborhood) return null;

    const hints: string[] = [];

    // Hints basés sur le quartier
    const neighborhood = venue.neighborhood.toLowerCase();
    if (neighborhood.includes('plateau') || neighborhood.includes('mile-end')) {
      hints.push('Métro: Ligne Orange (Mont-Royal, Sherbrooke)');
      hints.push('Stationnement: Limité, privilégier le transport en commun');
    } else if (neighborhood.includes('village') || neighborhood.includes('centre-ville')) {
      hints.push('Métro: Lignes Verte et Orange (Beaudry, Berri-UQAM)');
      hints.push('Stationnement: Parcomètres disponibles');
    } else if (neighborhood.includes('petite-italie') || neighborhood.includes('rosemont')) {
      hints.push('Métro: Ligne Bleue (Jean-Talon, De Castelnau)');
      hints.push('Autobus: Lignes 18, 55');
    } else {
      hints.push('Vérifier les options de transport en commun sur STM.info');
    }

    return hints;
  };

  const transportHints = getTransportHints();

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Informations pratiques</h2>

      {/* Map */}
      {venue?.lat && venue?.lon && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Localisation</h3>
          </div>
          <div className="rounded-lg overflow-hidden border border-white/10">
            <EventDetailMap
              lat={venue.lat}
              lon={venue.lon}
              title={venue.name || 'Lieu'}
            />
          </div>
          {venue.address && (
            <p className="text-slate-300 text-sm mt-2">
              {venue.address}, {venue.city} {venue.postalCode}
            </p>
          )}
        </div>
      )}

      {/* Transportation hints */}
      {transportHints && transportHints.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Transport</h3>
          </div>
          <ul className="space-y-2">
            {transportHints.map((hint, index) => (
              <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estimated duration */}
      {duration && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Durée estimée</h3>
          </div>
          <p className="text-slate-300">
            {duration < 60 
              ? `${duration} minutes`
              : `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}min` : ''}`}
          </p>
        </div>
      )}

      {/* Sound level */}
      {soundLevel && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Niveau sonore</h3>
          </div>
          <p className="text-slate-300">{soundLevelLabels[soundLevel]}</p>
        </div>
      )}

      {/* Accessibility */}
      {accessibility && accessibility.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Accessibility className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Accessibilité</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {accessibility.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
