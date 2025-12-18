'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MapPin, Calendar, DollarSign, Users, Star, Share2, ExternalLink, Clock, Music, User, LogIn, Loader2 } from 'lucide-react';
import { Event } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateMusicTags, getGenreEmoji, getGenreColor } from '@/lib/musicTags';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import EventTagsDisplay, { EventTag } from './EventTagsDisplay';

interface EventCardProps {
  event: Event;
  onFavoriteToggle: (eventId: string) => void;
  onEventClick?: (event: Event) => void;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  showImage?: boolean;
}

const EventCard = ({ 
  event, 
  onFavoriteToggle, 
  onEventClick,
  isFavorite = false,
  isFavoriteLoading = false,
  showImage = true 
}: EventCardProps) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const [justToggled, setJustToggled] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Animation de confirmation après toggle avec effet de particules
  useEffect(() => {
    if (justToggled) {
      const timer = setTimeout(() => setJustToggled(false), 800);
      return () => clearTimeout(timer);
    }
  }, [justToggled]);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustToggled(true);
    setAnimationKey(prev => prev + 1);
    onFavoriteToggle(event.id);
  };
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
      minute: '2-digit',
      timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal', // Toujours utiliser le timezone Montréal
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
      'art': 'bg-sky-500',
      'arts & theatre': 'bg-sky-500',
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

  const handleEventClick = () => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      router.push(`/evenement/${event.id}`);
    }
  };

  return (
    <div 
      className="glass-effect rounded-3xl overflow-hidden hover-lift cursor-pointer group border border-white/20 backdrop-blur-xl"
      onClick={handleEventClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image avec design simplifié et lazy loading */}
      {showImage && event.imageUrl && !imageError && (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
            loading="lazy"
            unoptimized={event.imageUrl.startsWith('http') && !event.imageUrl.includes(process.env.NEXT_PUBLIC_APP_URL || '')}
          />
          
          {/* Overlay subtil */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
          
          {/* Prix avec glassmorphism */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-md transition-all duration-300 ${
              event.price.isFree 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                : 'glass-effect text-gray-900 border border-white/30'
            } ${isHovered ? 'scale-105' : ''}`}>
              {formatPrice(event.price)}
            </span>
            {/* Badge promotion */}
            {event.promotions && event.promotions.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-lg backdrop-blur-md border border-white/30 animate-pulse">
                ⭐ Promu
              </span>
            )}
          </div>
          
          {/* Favori avec effet moderne */}
          <div className="absolute top-4 right-4">
            {!isAuthenticated && !isFavorite && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLoginPrompt(true);
                    setTimeout(() => setShowLoginPrompt(false), 3000);
                  }}
                  className="p-3 rounded-2xl transition-all duration-300 glass-effect border border-white/30 text-gray-600 hover:text-red-500 hover:scale-110"
                >
                  <Heart className="w-5 h-5 transition-all duration-300" />
                </button>
                {showLoginPrompt && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl p-3 z-50">
                    <p className="text-xs text-slate-200 mb-2">Connectez-vous pour sauvegarder vos favoris</p>
                    <Link
                      href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`}
                      className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LogIn className="w-3 h-3" />
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                className={`p-3 rounded-2xl transition-all duration-500 glass-effect border border-white/30 group/heart relative overflow-visible ${
                  isFavorite 
                    ? 'text-red-500 hover:scale-110 bg-red-500/10' 
                    : 'text-gray-600 hover:text-red-500 hover:scale-110'
                } ${isHovered ? 'scale-105' : ''} ${isFavoriteLoading ? 'opacity-50 cursor-wait' : ''} ${
                  justToggled && isFavorite ? 'animate-pulse ring-2 ring-red-400 ring-offset-2' : ''
                }`}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Heart 
                      key={animationKey}
                      className={`w-5 h-5 transition-all duration-500 ${
                        isFavorite ? 'fill-current scale-110 drop-shadow-lg' : 'group-hover/heart:scale-110'
                      } ${justToggled ? 'animate-bounce' : ''}`} 
                    />
                    {justToggled && isFavorite && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        <span className="absolute -top-2 -right-2 w-2 h-2 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                        <span className="absolute -top-3 -right-3 w-1.5 h-1.5 bg-red-300 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                      </>
                    )}
                  </>
                )}
              </button>
            )}
            {!isAuthenticated && isFavorite && (
              <button
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                className={`p-3 rounded-2xl transition-all duration-300 glass-effect border border-white/30 text-red-500 hover:scale-110 relative ${
                  isFavoriteLoading ? 'opacity-50 cursor-wait' : ''
                } ${justToggled ? 'animate-pulse' : ''}`}
                aria-label="Retirer des favoris"
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Heart 
                      key={animationKey}
                      className={`w-5 h-5 transition-all duration-300 fill-current ${justToggled ? 'animate-bounce' : ''}`} 
                    />
                    {justToggled && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contenu simplifié et lisible */}
      <div className="p-5">
        {/* En-tête clean */}
        <div className="mb-4">
          {/* Genre musical principal - Utilise EventTag si disponible, sinon fallback enrichedTags */}
          {event.eventTags && event.eventTags.length > 0 ? (
            // Afficher le premier genre depuis EventTag
            (() => {
              const firstGenre = event.eventTags.find(tag => tag.category === 'genre');
              if (firstGenre) {
                return (
                  <div className="mb-2">
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getGenreColor(firstGenre.value) }}
                    >
                      <span className="mr-1">{getGenreEmoji(firstGenre.value)}</span>
                      {firstGenre.value.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              }
              return null;
            })()
          ) : (
            // Fallback : utiliser enrichedTags si EventTag n'est pas disponible
            enrichedTags && enrichedTags.length > 0 && (
              <div className="mb-2">
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getGenreColor(enrichedTags[0]) }}
                >
                  <span className="mr-1">{getGenreEmoji(enrichedTags[0])}</span>
                  {enrichedTags[0]}
                </span>
              </div>
            )
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
              className="flex items-center text-sm text-gray-600 hover:text-sky-600 transition-colors duration-200 group"
            >
              <User className="w-4 h-4 mr-2 text-sky-500" />
              <span className="font-medium truncate group-hover:underline">
                {event.organizer.name}
              </span>
            </Link>
          )}
        </div>

        {/* Tags structurés (EventTag) - SPRINT 2 */}
        {event.eventTags && event.eventTags.length > 0 ? (
          <div className="mb-4">
            <EventTagsDisplay 
              eventTags={event.eventTags as EventTag[]} 
              maxTagsPerCategory={2}
            />
          </div>
        ) : (
          /* Fallback : Tags spéciaux et secondaires (ancien système) */
          (event.tags.length > 0 || enrichedTags.length > 1) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
            {/* Tags spéciaux prioritaires */}
            {event.tags.map((tag) => {
              const tagLower = tag.toLowerCase();
              // Tags spéciaux avec styles distincts
              if (tagLower === 'gratuit' || tagLower === 'free') {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm"
                  >
                    🎁 {tag}
                  </span>
                );
              }
              if (tagLower.includes('18+') || tagLower.includes('21+')) {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-red-500/20 border border-red-400/50 text-red-600 text-xs font-semibold rounded-full"
                  >
                    {tag}
                  </span>
                );
              }
              if (tagLower === 'plein-air' || tagLower === 'outdoor') {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-blue-500/20 border border-blue-400/50 text-blue-600 text-xs font-semibold rounded-full"
                  >
                    🌳 {tag}
                  </span>
                );
              }
              if (tagLower === 'accessible' || tagLower.includes('wheelchair')) {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-purple-500/20 border border-purple-400/50 text-purple-600 text-xs font-semibold rounded-full"
                  >
                    ♿ {tag}
                  </span>
                );
              }
              // Tags musicaux (genres)
              if (enrichedTags.includes(tag)) {
                return (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                );
              }
              // Tags génériques
              return (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              );
            })}
            
            {/* Tags musicaux supplémentaires */}
            {enrichedTags.length > 1 && enrichedTags.slice(1, 4).map((tag, index) => {
              if (!event.tags.includes(tag)) {
                return (
                  <span
                    key={`enriched-${index}`}
                    className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                );
              }
              return null;
            })}
          </div>
          )
        )}

        {/* Actions simplifiées */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
              className={`flex items-center space-x-1 text-sm transition-colors duration-200 ${
                isFavorite
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-red-600'
              } ${isFavoriteLoading ? 'opacity-50 cursor-wait' : ''} ${justToggled ? 'animate-pulse' : ''}`}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {isFavoriteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart 
                  key={animationKey}
                  className={`w-4 h-4 transition-all duration-200 ${isFavorite ? 'fill-current' : ''} ${justToggled ? 'animate-bounce' : ''}`} 
                />
              )}
              <span className="hidden sm:inline">{isFavorite ? 'Aimé' : 'Aimer'}</span>
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
