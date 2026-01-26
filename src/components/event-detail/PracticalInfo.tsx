'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Volume2, Accessibility, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

export default function PracticalInfo({
  venue,
  startAt,
  endAt,
  accessibility,
  estimatedDuration,
  soundLevel,
}: PracticalInfoProps) {
  const t = useTranslations('eventDetail');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }
    
    // Vérifier si la géolocalisation est disponible et autorisée
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // Ignore errors silently (permissions denied, timeout, etc.)
        // Ne pas logger pour éviter les warnings dans la console
      },
      {
        timeout: 5000,
        maximumAge: 300000, // Cache 5 minutes
      }
    );
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
    const hints: string[] = [];

    // Si on a un quartier, utiliser la logique basée sur le nom
    if (venue?.neighborhood) {
      const neighborhood = venue.neighborhood.toLowerCase();
      
      // Plateau Mont-Royal / Mile-End
      if (neighborhood.includes('plateau') || neighborhood.includes('mile-end') || neighborhood.includes('mile end')) {
        hints.push('Métro: Ligne Orange (Mont-Royal, Sherbrooke)');
        hints.push('Stationnement: Limité, privilégier le transport en commun');
        return hints;
      }
      
      // Village / Centre-ville
      if (neighborhood.includes('village') || neighborhood.includes('centre-ville') || neighborhood.includes('centre ville') || neighborhood.includes('downtown')) {
        hints.push('Métro: Lignes Verte et Orange (Beaudry, Berri-UQAM)');
        hints.push('Stationnement: Parcomètres disponibles');
        return hints;
      }
      
      // Petite-Italie / Rosemont
      if (neighborhood.includes('petite-italie') || neighborhood.includes('petite italie') || neighborhood.includes('rosemont')) {
        hints.push('Métro: Ligne Bleue (Jean-Talon, De Castelnau)');
        hints.push('Autobus: Lignes 18, 55');
        return hints;
      }
      
      // Villeray
      if (neighborhood.includes('villeray')) {
        hints.push('Métro: Ligne Orange (Jarry, Crémazie)');
        hints.push('Autobus: Lignes 30, 31, 45');
        return hints;
      }
      
      // Hochelaga-Maisonneuve
      if (neighborhood.includes('hochelaga') || neighborhood.includes('maisonneuve')) {
        hints.push('Métro: Ligne Verte (Préfontaine, Viau, Pie-IX)');
        hints.push('Autobus: Lignes 25, 29, 85');
        return hints;
      }
      
      // Griffintown / Sud-Ouest
      if (neighborhood.includes('griffintown') || neighborhood.includes('sud-ouest') || neighborhood.includes('sud ouest')) {
        hints.push('Métro: Ligne Orange (Lucien-L\'Allier, Bonaventure)');
        hints.push('Autobus: Lignes 61, 211');
        return hints;
      }
      
      // Outremont
      if (neighborhood.includes('outremont')) {
        hints.push('Métro: Ligne Bleue (Outremont, Édouard-Montpetit)');
        hints.push('Autobus: Lignes 51, 129');
        return hints;
      }
      
      // Verdun
      if (neighborhood.includes('verdun')) {
        hints.push('Métro: Ligne Verte (Verdun, De l\'Église)');
        hints.push('Autobus: Lignes 37, 58, 107');
        return hints;
      }
      
      // Ahuntsic
      if (neighborhood.includes('ahuntsic')) {
        hints.push('Métro: Ligne Orange (Sauvé, Henri-Bourassa)');
        hints.push('Autobus: Lignes 30, 31, 121');
        return hints;
      }
      
      // Côte-des-Neiges
      if (neighborhood.includes('côte-des-neiges') || neighborhood.includes('cote-des-neiges') || neighborhood.includes('côte des neiges')) {
        hints.push('Métro: Ligne Bleue (Côte-des-Neiges, Université-de-Montréal)');
        hints.push('Autobus: Lignes 51, 165');
        return hints;
      }
      
      // Parc-Extension
      if (neighborhood.includes('parc-extension') || neighborhood.includes('parc extension')) {
        hints.push('Métro: Ligne Bleue (Parc, Acadie)');
        hints.push('Autobus: Lignes 16, 92');
        return hints;
      }
    }

    // Si on a des coordonnées mais pas de quartier, essayer de déterminer par la position
    if (venue?.lat && venue?.lon) {
      const lat = venue.lat;
      const lon = venue.lon;
      
      // Plateau Mont-Royal (approximatif)
      if (lat >= 45.515 && lat <= 45.535 && lon >= -73.59 && lon <= -73.57) {
        hints.push('Métro: Ligne Orange (Mont-Royal, Sherbrooke)');
        hints.push('Stationnement: Limité, privilégier le transport en commun');
        return hints;
      }
      
      // Centre-ville (approximatif)
      if (lat >= 45.495 && lat <= 45.515 && lon >= -73.57 && lon <= -73.55) {
        hints.push('Métro: Lignes Verte et Orange (Beaudry, Berri-UQAM)');
        hints.push('Stationnement: Parcomètres disponibles');
        return hints;
      }
      
      // Petite-Italie / Rosemont (approximatif)
      if (lat >= 45.535 && lat <= 45.555 && lon >= -73.61 && lon <= -73.59) {
        hints.push('Métro: Ligne Bleue (Jean-Talon, De Castelnau)');
        hints.push('Autobus: Lignes 18, 55');
        return hints;
      }
    }

    // Si aucune correspondance, message générique
    if (hints.length === 0) {
      hints.push('Vérifier les options de transport en commun sur STM.info');
    }

    return hints;
  };

  const transportHints = getTransportHints();

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t('practicalInfo')}</h2>

      {/* Map */}
      {venue?.lat && venue?.lon && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{t('location')}</h3>
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
            <h3 className="text-lg font-semibold text-white">{t('transport')}</h3>
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
            <h3 className="text-lg font-semibold text-white">{t('estimatedDuration')}</h3>
          </div>
          <p className="text-slate-300">
            {duration < 60 
              ? `${duration} ${t('minutes')}`
              : `${Math.floor(duration / 60)}${t('h')}${duration % 60 > 0 ? ` ${duration % 60}${t('min')}` : ''}`}
          </p>
        </div>
      )}

      {/* Sound level */}
      {soundLevel && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">{t('soundLevel')}</h3>
          </div>
          <p className="text-slate-300">{t(`soundLevels.${soundLevel}`)}</p>
        </div>
      )}

      {/* Accessibility */}
      {accessibility && accessibility.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Accessibility className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">{t('accessibility')}</h3>
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
