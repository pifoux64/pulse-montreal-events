'use client';

import { useState } from 'react';
import { Building2, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface VenueClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onSuccess?: () => void;
}

export default function VenueClaimModal({
  isOpen,
  onClose,
  venueId,
  venueName,
  onSuccess,
}: VenueClaimModalProps) {
  const t = useTranslations('navigation');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    roleAtVenue: '' as 'owner' | 'manager' | 'booker' | '',
    professionalEmail: '',
    website: '',
    socialLink: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/venues/${venueId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleAtVenue: formData.roleAtVenue || undefined,
          professionalEmail: formData.professionalEmail || undefined,
          website: formData.website || undefined,
          socialLink: formData.socialLink || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du claim');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Recharger pour mettre à jour la session
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {t('venue.claimSubmitted')}
            </h3>
            <p className="text-slate-300">
              {t('venue.claimPendingMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {t('venue.claimVenue')}
                </h3>
                <p className="text-sm text-slate-300">{venueName}</p>
              </div>
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
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-slate-300 mb-6">
            {t('venue.claimMessage')}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Role at venue */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.roleAtVenue')} *
              </label>
              <select
                value={formData.roleAtVenue}
                onChange={(e) => setFormData({ ...formData, roleAtVenue: e.target.value as any })}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('venue.selectRole')}</option>
                <option value="owner">{t('venue.roleOwner')}</option>
                <option value="manager">{t('venue.roleManager')}</option>
                <option value="booker">{t('venue.roleBooker')}</option>
              </select>
            </div>

            {/* Professional email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.professionalEmail')}
              </label>
              <input
                type="email"
                value={formData.professionalEmail}
                onChange={(e) => setFormData({ ...formData, professionalEmail: e.target.value })}
                placeholder="contact@venue.com"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.website')}
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://venue.com"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Social link */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('venue.socialLink')}
              </label>
              <input
                type="url"
                value={formData.socialLink}
                onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                placeholder="https://facebook.com/venue"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('venue.submitting')}</span>
                </>
              ) : (
                <span>{t('venue.submitClaim')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
