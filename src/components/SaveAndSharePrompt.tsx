'use client';

/**
 * Prompt subtil après ajout d'un favori
 * Sprint V1: Save & Share microflow
 */

import { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EventShareModal from './EventShareModal';

interface SaveAndSharePromptProps {
  eventId: string;
  eventTitle: string;
  eventVenue?: { name: string } | null;
  eventStartAt?: Date;
  eventNeighborhood?: string | null;
  onDismiss: () => void;
}

export default function SaveAndSharePrompt({
  eventId,
  eventTitle,
  eventVenue,
  eventStartAt,
  eventNeighborhood,
  onDismiss,
}: SaveAndSharePromptProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleViewEvent = () => {
    router.push(`/evenement/${eventId}`);
    onDismiss();
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Événement sauvegardé
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Partager avec un ami?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
            <button
              onClick={onDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EventShareModal
        eventId={eventId}
        eventTitle={eventTitle}
        eventVenue={eventVenue}
        eventStartAt={eventStartAt}
        eventNeighborhood={eventNeighborhood}
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          onDismiss();
        }}
      />
    </>
  );
}

