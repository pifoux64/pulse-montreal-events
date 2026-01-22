'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import VenueRequestForm from './VenueRequestForm';

interface VenueRequestButtonProps {
  venueId: string;
  venueName: string;
}

export default function VenueRequestButton({ venueId, venueName }: VenueRequestButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleClick = () => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/salle/${venueName}`);
      return;
    }

    // Vérifier si l'utilisateur est organisateur
    if (session?.user?.role !== 'ORGANIZER' && session?.user?.role !== 'ADMIN') {
      // Rediriger vers la page de création de profil organisateur
      router.push('/organisateur/mon-profil');
      return;
    }

    setShowForm(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <CalendarPlus className="w-5 h-5" />
        Demander cette salle
      </button>

      {showForm && (
        <VenueRequestForm
          venueId={venueId}
          venueName={venueName}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
