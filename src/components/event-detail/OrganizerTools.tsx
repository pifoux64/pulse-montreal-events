'use client';

import { Edit, TrendingUp, Bell, Image as ImageIcon, Printer } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface OrganizerToolsProps {
  eventId: string;
  organizerId?: string | null;
  isOwner: boolean;
  isAdmin: boolean;
}

export default function OrganizerTools({
  eventId,
  organizerId,
  isOwner,
  isAdmin,
}: OrganizerToolsProps) {
  const { data: session } = useSession();

  // Afficher uniquement si l'utilisateur est propriétaire ou admin
  if (!isOwner && !isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Outils organisateur</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Edit event */}
        <Link
          href={`/publier?edit=${eventId}`}
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
        >
          <Edit className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Modifier l'événement</span>
        </Link>

        {/* Boost visibility */}
        <button
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-left"
          onClick={() => {
            // TODO: Implémenter le boost de visibilité
            alert('Fonctionnalité à venir: Boost de visibilité');
          }}
        >
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">Booster la visibilité</span>
        </button>

        {/* Send notifications */}
        <button
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-left"
          onClick={() => {
            // TODO: Implémenter l'envoi de notifications ciblées
            alert('Fonctionnalité à venir: Notifications ciblées');
          }}
        >
          <Bell className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium">Notifications ciblées</span>
        </button>

        {/* Generate flyer */}
        <Link
          href={`/organisateur/dashboard?tab=flyer&event=${eventId}`}
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
        >
          <ImageIcon className="w-5 h-5 text-pink-400" />
          <span className="text-white font-medium">Générer un flyer</span>
        </Link>

        {/* Print flyers (external partner) */}
        <button
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-left"
          onClick={() => {
            // TODO: Intégration avec partenaire d'impression
            window.open('https://example.com/print-flyers', '_blank');
          }}
        >
          <Printer className="w-5 h-5 text-green-400" />
          <span className="text-white font-medium">Imprimer des flyers</span>
        </button>
      </div>
    </div>
  );
}
