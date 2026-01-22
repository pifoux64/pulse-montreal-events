'use client';

import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FollowUserButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle?: (newState: boolean) => void;
  className?: string;
}

export default function FollowUserButton({
  userId,
  isFollowing: initialIsFollowing,
  onToggle,
  className = '',
}: FollowUserButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  if (!session) {
    return null;
  }

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        // Défollow
        const response = await fetch(`/api/users/follow?userId=${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFollowing(false);
          onToggle?.(false);
        }
      } else {
        // Follow
        const response = await fetch('/api/users/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          setIsFollowing(true);
          onToggle?.(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors du toggle follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFollowing
          ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Suivi
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Suivre
        </>
      )}
    </button>
  );
}
