'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import VenueClaimModal from './VenueClaimModal';

interface VenueClaimButtonProps {
  venueId: string;
  venueName: string;
}

export default function VenueClaimButton({ venueId, venueName }: VenueClaimButtonProps) {
  const t = useTranslations('navigation');
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier le statut du claim si l'utilisateur est connecté
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const checkClaimStatus = async () => {
      try {
        const response = await fetch(`/api/venues/${venueId}/claim`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasClaim && data.claim) {
            setClaimStatus(data.claim.status.toLowerCase());
          } else {
            setClaimStatus('none');
          }
        }
      } catch (error) {
        console.error('Erreur vérification claim:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkClaimStatus();
  }, [session, venueId]);

  // Ne pas afficher si l'utilisateur n'est pas connecté
  if (!session?.user || isLoading) {
    return null;
  }

  // Ne pas afficher si le claim est déjà vérifié
  if (claimStatus === 'verified') {
    return null;
  }

  // Afficher un message différent selon le statut
  if (claimStatus === 'pending') {
    return (
      <div className="px-4 py-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm">
        {t('venue.claimPending')}
      </div>
    );
  }

  if (claimStatus === 'rejected') {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors text-sm flex items-center gap-2"
      >
        <Building2 className="w-4 h-4" />
        {t('venue.claimRejected')}
      </button>
    );
  }

  // Afficher le bouton pour créer un claim
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all flex items-center gap-2 shadow-lg"
      >
        <Building2 className="w-5 h-5" />
        {t('venue.claimVenue')}
      </button>

      <VenueClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        venueId={venueId}
        venueName={venueName}
        onSuccess={() => {
          setClaimStatus('pending');
        }}
      />
    </>
  );
}
