'use client';

import { Edit, TrendingUp, Bell, Image as ImageIcon, Printer } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('eventDetail');
  const { data: session } = useSession();

  // Afficher uniquement si l'utilisateur est propriétaire ou admin
  if (!isOwner && !isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
      <h2 className="text-xl font-bold text-white mb-4">{t('organizerTools')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Edit event */}
        <Link
          href={`/publier?edit=${eventId}`}
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
        >
          <Edit className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">{t('editEvent')}</span>
        </Link>

        {/* Boost visibility */}
        <button
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-left"
          onClick={() => {
            // TODO: Implémenter le boost de visibilité
            alert(t('boostVisibility'));
          }}
        >
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">{t('boostVisibility')}</span>
        </button>

        {/* Send notifications */}
        <button
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-left"
          onClick={() => {
            // TODO: Implémenter l'envoi de notifications ciblées
            alert(t('targetedNotifications'));
          }}
        >
          <Bell className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium">{t('targetedNotifications')}</span>
        </button>

        {/* Generate flyer */}
        <Link
          href={`/organisateur/dashboard?tab=flyer&event=${eventId}`}
          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
        >
          <ImageIcon className="w-5 h-5 text-pink-400" />
          <span className="text-white font-medium">{t('generateFlyer')}</span>
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
          <span className="text-white font-medium">{t('printFlyers')}</span>
        </button>
      </div>
    </div>
  );
}
