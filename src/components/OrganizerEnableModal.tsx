'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface OrganizerEnableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  actionRedirectUrl?: string;
  actionName?: string; // Ex: "créer un événement", "importer un événement"
}

export default function OrganizerEnableModal({
  isOpen,
  onClose,
  onSuccess,
  actionRedirectUrl,
  actionName,
}: OrganizerEnableModalProps) {
  const t = useTranslations('navigation');
  const router = useRouter();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      const response = await fetch('/api/roles/enable-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'activation');
      }

      // Succès
      onSuccess?.();
      
      // Rediriger si une URL est fournie
      if (actionRedirectUrl) {
        router.push(actionRedirectUrl);
      } else {
        // Recharger la page pour mettre à jour la session
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {t('organizer.enableTitle')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 mb-6">
            {actionName 
              ? t('organizer.enableMessageWithAction', { action: actionName })
              : t('organizer.enableMessage')
            }
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isEnabling}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleEnable}
              disabled={isEnabling}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEnabling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('organizer.enabling')}</span>
                </>
              ) : (
                <span>{t('organizer.enable')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
