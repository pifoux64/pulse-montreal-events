'use client';

/**
 * Bouton pour suivre/ne plus suivre un organisateur
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowOrganizerButtonProps {
  organizerId: string;
  className?: string;
  onToggle?: (newState: boolean) => void;
  initialIsFollowing?: boolean;
}

export default function FollowOrganizerButton({
  organizerId,
  className = '',
  onToggle,
  initialIsFollowing = false,
}: FollowOrganizerButtonProps) {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Vérifier si on suit déjà l'organisateur
  useEffect(() => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    async function checkFollowStatus() {
      try {
        const response = await fetch(`/api/organizers/${organizerId}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          onToggle?.(data.isFollowing);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du suivi:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkFollowStatus();
  }, [organizerId, status]);

  const handleToggleFollow = async () => {
    if (status !== 'authenticated') {
      return;
    }

    setIsToggling(true);
    try {
      if (isFollowing) {
        // Ne plus suivre
        const response = await fetch(`/api/organizers/${organizerId}/follow`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsFollowing(false);
          onToggle?.(false);
        }
      } else {
        // Suivre
        const response = await fetch(`/api/organizers/${organizerId}/follow`, {
          method: 'POST',
        });
        if (response.ok) {
          setIsFollowing(true);
          onToggle?.(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors du toggle follow:', error);
    } finally {
      setIsToggling(false);
    }
  };

  if (status !== 'authenticated') {
    return null; // Ne pas afficher si non connecté
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isToggling}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFollowing
          ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${isToggling ? 'opacity-50 cursor-wait' : ''} ${className}`}
    >
      {isToggling ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isFollowing ? 'Désabonnement...' : 'Abonnement...'}</span>
        </>
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Suivi</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Suivre</span>
        </>
      )}
    </button>
  );
}

