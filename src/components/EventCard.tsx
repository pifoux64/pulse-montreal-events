'use client';

import { useState } from 'react';
import { Heart, MapPin, Calendar, DollarSign, Users, Star, Share2, ExternalLink, Clock, Music, User } from 'lucide-react';
import { Event } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateMusicTags, getGenreEmoji, getGenreColor } from '@/lib/musicTags';
import Link from 'next/link';

interface EventCardProps {
  event: Event;
  onFavoriteToggle: (eventId: string) => void;
  onEventClick: (event: Event) => void;
  isFavorite?: boolean;
  showImage?: boolean;
}

const EventCard = ({ 
  event, 
  onFavoriteToggle, 
  onEventClick, 
  isFavorite = false,
  showImage = true 
}: EventCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Générer des tags enrichis avec détection musicale
  const enrichedTags = generateMusicTags({
    title: event.title,
    description: event.description,
    category: event.category,
    tags: event.tags
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (price: Event['price']) => {
    if (price.isFree) return 'Gratuit';
    return `${price.amount} ${price.currency}`;
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'musique': 'bg-red-500',
      'music': 'bg-red-500',
      'art': 'bg-purple-500',
      'arts & theatre': 'bg-purple-500',
      'sport': 'bg-blue-500',
      'sports': 'bg-blue-500',
      'famille': 'bg-orange-500',
      'family': 'bg-orange-500',
      'culture': 'bg-teal-500',
      'community': 'bg-green-500',
      'gastronomie': 'bg-yellow-500',
      'education': 'bg-indigo-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const isMusic = category.toLowerCase().includes('music') || category.toLowerCase().includes('musique');
    if (isMusic && enrichedTags.length > 0) {
      return getGenreEmoji(enrichedTags[0]);
    }
    return '🎵';
  };

  return (
    <div 
      className="glass-effect rounded-3xl overflow-hidden hover-lift cursor-pointer group border border-white/20 backdrop-blur-xl"
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image avec design simplifié */}
      {showImage && event.imageUrl && !imageError && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay subtil */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
          
          {/* Prix avec glassmorphism */}
          <div className="absolute top-4 left-4">
            <span className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-md transition-all duration-300 ${
              event.price.isFree 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                : 'glass-effect text-gray-900 border border-white/30'
            } ${isHovered ? 'scale-105' : ''}`}>
              {formatPrice(event.price)}
            </span>
          </div>
          
          {/* Favori avec effet moderne */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(event.id);
            }}
            className={`absolute top-4 right-4 p-3 rounded-2xl transition-all duration-300 glass-effect border border-white/30 group/heart ${
              isFavorite 
                ? 'text-red-500 hover:scale-110' 
                : 'text-gray-600 hover:text-red-500 hover:scale-110'
            } ${isHovered ? 'scale-105' : ''}`}
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'fill-current scale-110' : 'group-hover/heart:scale-110'}`} />
          </button>
        </div>
      )}

      {/* Contenu simplifié et lisible */}
      <div className="p-5">
        {/* En-tête clean */}
        <div className="mb-4">
          {/* Genre musical principal */}
          {enrichedTags && enrichedTags.length > 0 && (
            <div className="mb-2">
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getGenreColor(enrichedTags[0]) }}
              >
                <span className="mr-1">{getGenreEmoji(enrichedTags[0])}</span>
                {enrichedTags[0]}
              </span>
            </div>
          )}
          
          {/* Titre lisible */}
          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Infos essentielles */}
        <div className="space-y-2 mb-4">
          {/* Date et heure */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-medium">{formatDateShort(event.startDate)}</span>
            <span className="mx-2">•</span>
            <span>{formatTime(event.startDate)}</span>
          </div>
          
          {/* Lieu */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-green-500" />
            <span className="font-medium truncate">{event.location.name}</span>
          </div>

          {/* Organisateur */}
          {event.organizer && (
            <Link
              href={`/organisateur/${event.organizerId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center text-sm text-gray-600 hover:text-violet-600 transition-colors duration-200 group"
            >
              <User className="w-4 h-4 mr-2 text-violet-500" />
              <span className="font-medium truncate group-hover:underline">
                {event.organizer.name}
              </span>
            </Link>
          )}
        </div>

        {/* Tags secondaires (max 3) */}
        {enrichedTags && enrichedTags.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {enrichedTags.slice(1, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {enrichedTags.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{enrichedTags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions simplifiées */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(event.id);
              }}
              className={`flex items-center space-x-1 text-sm transition-colors duration-200 ${
                isFavorite
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Aimer</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implémenter le partage
              }}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>
          
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Billets
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
