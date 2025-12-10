'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Heart, Share2, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';

interface EventDetailActionsProps {
  eventId: string;
  eventTitle: string;
}

export default function EventDetailActions({ eventId, eventTitle }: EventDetailActionsProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === 'authenticated';
  
  const { isFavorite, toggleFavorite, isFavoriteLoading } = useFavorites();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [justToggled, setJustToggled] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    try {
      await toggleFavorite(eventId);
      setJustToggled(true);
      setAnimationKey(prev => prev + 1);
      setTimeout(() => setJustToggled(false), 1000);
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: eventTitle,
      text: `Découvrez cet événement : ${eventTitle}`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback : copier dans le presse-papiers
        await navigator.clipboard.writeText(url);
        alert('Lien copié dans le presse-papiers !');
      }
    } catch (error: any) {
      // L'utilisateur a annulé le partage ou erreur
      if (error.name !== 'AbortError') {
        // Si l'API de partage n'est pas disponible, copier dans le presse-papiers
        try {
          await navigator.clipboard.writeText(url);
          alert('Lien copié dans le presse-papiers !');
        } catch (clipboardError) {
          console.error('Erreur lors de la copie:', clipboardError);
        }
      }
    }
  };

  const favoriteButton = (
    <div className="relative">
      <button
        onClick={handleFavoriteClick}
        disabled={isFavoriteLoading(eventId)}
        className={`p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 ${
          isFavorite(eventId) ? 'text-red-400' : ''
        } ${isFavoriteLoading(eventId) ? 'opacity-50 cursor-wait' : ''} ${
          justToggled ? 'animate-pulse' : ''
        }`}
        aria-label={isFavorite(eventId) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {isFavoriteLoading(eventId) ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart
            key={animationKey}
            className={`h-5 w-5 transition-all duration-300 ${
              isFavorite(eventId) ? 'fill-current scale-110' : ''
            } ${justToggled ? 'animate-bounce' : ''}`}
          />
        )}
      </button>
      {isFavorite(eventId) && !isFavoriteLoading(eventId) && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
      )}
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
  );

  return (
    <div className="flex gap-2">
      {favoriteButton}
      <button
        onClick={handleShare}
        className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        aria-label="Partager cet événement"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}

