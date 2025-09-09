'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { 
  X, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Heart, 
  Share2, 
  ExternalLink,
  Star,
  Music,
  Tag,
  Navigation,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateMusicTags, getGenreEmoji, getGenreColor } from '@/lib/musicTags';

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle: (eventId: string) => void;
  isFavorite?: boolean;
}

const EventModal = ({ 
  event, 
  isOpen, 
  onClose, 
  onFavoriteToggle,
  isFavorite = false 
}: EventModalProps) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  // Générer des tags enrichis avec détection musicale
  const enrichedTags = generateMusicTags({
    title: event.title,
    description: event.description,
    category: event.category,
    tags: event.tags
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const getTimeUntil = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href);
      // TODO: Afficher un toast de confirmation
    }
  };

  const openGoogleMaps = () => {
    const lat = event.location?.coordinates?.lat || (event as any).lat;
    const lng = event.location?.coordinates?.lng || (event as any).lon;
    if (lat && lng) {
      window.open(`https://maps.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header avec image */}
        <div className="relative">
          {event.imageUrl && !imageError ? (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={event.imageUrl}
                alt={event.title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
              )}
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Prix dans l'image */}
              <div className="absolute top-6 left-6">
                <span className={`px-4 py-2 rounded-full text-lg font-bold shadow-lg ${
                  event.price.isFree 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-900'
                }`}>
                  {formatPrice(event.price)}
                </span>
              </div>

              {/* Actions dans l'image */}
              <div className="absolute top-6 right-6 flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(event.id);
                  }}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/90 text-gray-700 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-all duration-200"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative h-32 bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Prix sans image */}
              <div className="absolute top-6 left-6">
                <span className={`px-4 py-2 rounded-full text-lg font-bold shadow-lg ${
                  event.price.isFree 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-900'
                }`}>
                  {formatPrice(event.price)}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Bouton fermer - DÉPLACÉ à l'extérieur pour être toujours visible */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-white text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 shadow-lg z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            
            {/* Titre et tags principaux */}
            <div className="mb-6">
              {/* Genre musical principal */}
              {enrichedTags && enrichedTags.length > 0 && (
                <div className="mb-4">
                  <span 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: getGenreColor(enrichedTags[0]) }}
                  >
                    <span className="mr-2 text-lg">{getGenreEmoji(enrichedTags[0])}</span>
                    {enrichedTags[0]}
                  </span>
                </div>
              )}
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {event.title}
              </h1>
              
              {/* Tags secondaires */}
              {enrichedTags && enrichedTags.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {enrichedTags.slice(1, 6).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {enrichedTags.length > 6 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                      +{enrichedTags.length - 6} autres
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Informations essentielles */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* Colonne gauche - Détails événement */}
              <div className="space-y-4">
                
                {/* Date et heure */}
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Date et heure</h3>
                    <p className="text-gray-700">{formatDate(event.startDate)}</p>
                    {event.endDate && event.endDate !== event.startDate && (
                      <p className="text-gray-600 text-sm">
                        Jusqu'au {formatDate(event.endDate)}
                      </p>
                    )}
                    <p className="text-blue-600 font-medium text-sm mt-1">
                      {getTimeUntil(event.startDate)}
                    </p>
                  </div>
                </div>

                {/* Lieu */}
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-2xl">
                  <div className="p-2 bg-green-500 rounded-xl">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Lieu</h3>
                    <p className="text-gray-700 font-medium">
                      {event.location?.name || (event as any).venue?.name || 'Lieu à confirmer'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {event.location?.address || 'Adresse à confirmer'}<br />
                      {event.location?.city || 'Montréal'}, {event.location?.postalCode || ''}
                    </p>
                    <button
                      onClick={openGoogleMaps}
                      className="inline-flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm mt-2 transition-colors duration-200"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Itinéraire</span>
                    </button>
                  </div>
                </div>

                {/* Prix et billets */}
                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-2xl">
                  <div className="p-2 bg-purple-500 rounded-xl">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Prix</h3>
                    <p className="text-gray-700 font-medium text-lg">
                      {formatPrice(event.price)}
                    </p>
                    {event.ticketUrl && (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Acheter des billets</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne droite - Informations additionnelles */}
              <div className="space-y-4">
                
                {/* Capacité */}
                {(event.maxCapacity || event.currentCapacity) && (
                  <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-2xl">
                    <div className="p-2 bg-orange-500 rounded-xl">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Participants</h3>
                      <p className="text-gray-700">
                        {event.currentCapacity || 0}
                        {event.maxCapacity && ` / ${event.maxCapacity}`} participants
                      </p>
                      {event.maxCapacity && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${((event.currentCapacity || 0) / event.maxCapacity) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Catégorie */}
                <div className="flex items-start space-x-4 p-4 bg-teal-50 rounded-2xl">
                  <div className="p-2 bg-teal-500 rounded-xl">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Catégorie</h3>
                    <p className="text-gray-700 capitalize">{event.category}</p>
                    {event.subCategory && (
                      <p className="text-gray-600 text-sm">{event.subCategory}</p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {(event.rating && event.rating > 0) && (
                  <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-2xl">
                    <div className="p-2 bg-yellow-500 rounded-xl">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Évaluation</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(event.rating) 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-700 font-medium">
                          {event.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({event.reviewCount || 0} avis)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Organisateur */}
            {event.organizer && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Organisateur</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {event.organizer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.organizer.name}</h3>
                    <p className="text-gray-600 text-sm capitalize">{event.organizer.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
