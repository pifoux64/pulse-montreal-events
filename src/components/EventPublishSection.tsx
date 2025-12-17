'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PublishEverywhereButton from './PublishEverywhereButton';
import { Share2, ExternalLink, AlertCircle } from 'lucide-react';

interface EventPublishSectionProps {
  eventId: string;
  organizerId?: string | null;
}

export default function EventPublishSection({ eventId, organizerId }: EventPublishSectionProps) {
  const { data: session } = useSession();
  const [hasConnections, setHasConnections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est l'organisateur et a des connexions
    if (session?.user?.id && organizerId) {
      checkConnections();
    } else {
      setIsLoading(false);
    }
  }, [session, organizerId]);

  const checkConnections = async () => {
    try {
      const response = await fetch('/api/organizers/integrations');
      if (response.ok) {
        const data = await response.json();
        setHasConnections(data.connections && data.connections.length > 0);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des connexions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher seulement si l'utilisateur est l'organisateur
  if (!session?.user?.id || !organizerId || isLoading) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Publication multi-plateformes
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Publiez votre événement sur toutes vos plateformes connectées en un clic
          </p>
        </div>
      </div>

      {!hasConnections ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Aucune plateforme connectée
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Connectez vos comptes Facebook, Eventbrite ou autres pour publier automatiquement.
              </p>
              <a
                href="/organisateur/integrations"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Configurer les intégrations
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PublishEverywhereButton eventId={eventId} />
          <a
            href="/organisateur/integrations"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Gérer les intégrations
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}

