'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { User, Globe, Facebook, Instagram, Twitter, Linkedin, Save, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface OrganizerProfile {
  id: string;
  displayName: string;
  website?: string | null;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  verified: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  _count?: {
    events: number;
  };
}

export default function MonProfilOrganisateurPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [website, setWebsite] = useState('');
  const [socials, setSocials] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
  });

const normalizeUrl = (value: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/organisateur/mon-profil');
      return;
    }

    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizers/me');
      
      if (response.status === 404) {
        // Pas de profil organisateur, on reste sur la page pour en créer un
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du profil');
      }

      const data = await response.json();
      setProfile(data);
      setDisplayName(data.displayName);
      setWebsite(data.website || '');
      setSocials({
        facebook: (data.socials as any)?.facebook || '',
        instagram: (data.socials as any)?.instagram || '',
        twitter: (data.socials as any)?.twitter || '',
        linkedin: (data.socials as any)?.linkedin || '',
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const socialsData: Record<string, string> = {};
      if (socials.facebook) socialsData.facebook = normalizeUrl(socials.facebook);
      if (socials.instagram) socialsData.instagram = normalizeUrl(socials.instagram);
      if (socials.twitter) socialsData.twitter = normalizeUrl(socials.twitter);
      if (socials.linkedin) socialsData.linkedin = normalizeUrl(socials.linkedin);

      const normalizedWebsite = website ? normalizeUrl(website) : null;

      const payload = {
        displayName,
        website: normalizedWebsite,
        socials: Object.keys(socialsData).length > 0 ? socialsData : null,
      };

      let response;
      if (profile) {
        // Mise à jour
        response = await fetch(`/api/organizers/${profile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Création
        response = await fetch('/api/organizers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess(profile ? 'Profil mis à jour avec succès !' : 'Profil créé avec succès !');
      
      // Recharger le profil après un court délai
      setTimeout(() => {
        loadProfile();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile ? 'Mon profil organisateur' : 'Créer mon profil organisateur'}
          </h1>
          <p className="text-slate-300">
            {profile 
              ? 'Gérez les informations de votre profil organisateur'
              : 'Créez votre profil pour commencer à publier des événements'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {profile?.verified && (
          <div className="mb-6 p-4 bg-sky-500/20 border border-sky-500/50 rounded-xl text-sky-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Votre profil est vérifié ✓</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl space-y-6">
          {/* Nom d'affichage */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-200 mb-2">
              Nom d'affichage <span className="text-red-400">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              placeholder="Nom de votre organisation"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Site web */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-200 mb-2">
              Site web
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://votre-site.com"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Réseaux sociaux
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  value={socials.facebook}
                  onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                  placeholder="https://facebook.com/votre-page"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400" />
                <input
                  type="text"
                  value={socials.instagram}
                  onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                  placeholder="https://instagram.com/votre-compte"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Twitter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-sky-400" />
                <input
                  type="text"
                  value={socials.twitter}
                  onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                  placeholder="https://twitter.com/votre-compte"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Linkedin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  value={socials.linkedin}
                  onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/votre-entreprise"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Statistiques si profil existe */}
          {profile && profile._count && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400 mb-2">Statistiques</p>
              <p className="text-slate-200">
                <strong>{profile._count.events}</strong> événement{profile._count.events > 1 ? 's' : ''} publié{profile._count.events > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {profile ? 'Mettre à jour' : 'Créer le profil'}
                </>
              )}
            </button>
            {profile && (
              <a
                href={`/organisateur/${profile.id}`}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Voir mon profil public
              </a>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

