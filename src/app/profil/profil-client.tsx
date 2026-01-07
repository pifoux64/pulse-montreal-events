'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CheckCircle, ExternalLink, Loader2, AlertCircle, Plus, X, Users, Calendar, Settings, RefreshCw } from 'lucide-react';
import { GENRES, EVENT_TYPES, AMBIANCES, PUBLICS, getStylesForGenre } from '@/lib/tagging/taxonomy';

type MusicConnection = {
  id: string;
  service: string;
  externalUserId: string;
  expiresAt: string;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InterestTag = {
  id: string;
  category: string;
  value: string;
  score: number;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilClient() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [interestTags, setInterestTags] = useState<InterestTag[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'genre' | 'style' | 'type' | 'ambiance'>('genre');
  const [selectedGenreForStyles, setSelectedGenreForStyles] = useState<string>('reggae');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [personalizationEnabled, setPersonalizationEnabled] = useState<boolean>(true);
  const [loadingPersonalization, setLoadingPersonalization] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profil');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const urlErr = searchParams.get('error');
    const urlSuccess = searchParams.get('success');
    if (urlErr) setError(urlErr);
    if (urlSuccess === 'preferences_updated') setSuccess(t('preferencesUpdated'));
  }, [status, searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    refreshInterests();
    refreshPersonalizationPrefs();
    refreshUserPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const refreshPersonalizationPrefs = async () => {
    try {
      const res = await fetch('/api/user/preferences/personalization');
      if (res.ok) {
        const data = await res.json();
        setPersonalizationEnabled(data.enabled ?? true);
      }
    } catch (e) {
      console.error('Erreur refreshPersonalizationPrefs:', e);
    }
  };

  const togglePersonalization = async (enabled: boolean) => {
    try {
      setLoadingPersonalization(true);
      setError(null);
      const res = await fetch('/api/user/preferences/personalization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('updateError'));
      setPersonalizationEnabled(enabled);
      setSuccess(enabled ? t('enabled') : t('disabled'));
    } catch (e: any) {
      setError(e.message || t('unknownError'));
    } finally {
      setLoadingPersonalization(false);
    }
  };

  const refreshUserPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setUserPreferences(data.preferences || null);
      }
    } catch (e) {
      console.error('Erreur refreshUserPreferences:', e);
    }
  };

  const refreshInterests = async () => {
    try {
      setLoadingInterests(true);
      setError(null); // Réinitialiser l'erreur avant le fetch
      const res = await fetch('/api/user/interest-tags');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setInterestTags(data.tags || []);
    } catch (e: any) {
      // Gérer les erreurs réseau différemment des erreurs serveur
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError(t('networkError'));
      } else {
        setError(e.message || t('errorLoading'));
      }
      console.error('Erreur refreshInterests:', e);
    } finally {
      setLoadingInterests(false);
    }
  };


  const addManualInterest = async () => {
    if (!selectedValue) return;
    try {
      setAdding(true);
      setError(null);
      const res = await fetch('/api/user/interest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          value: selectedValue,
          source: 'manual',
          score: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('updateError'));
      setSuccess(t('preferenceAdded'));
      await refreshInterests();
    } catch (e: any) {
      setError(e.message || t('unknownError'));
    } finally {
      setAdding(false);
    }
  };

  const removeInterest = async (tag: InterestTag) => {
    try {
      setError(null);
      const res = await fetch('/api/user/interest-tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: tag.category, value: tag.value, source: tag.source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('updateError'));
      await refreshInterests();
    } catch (e: any) {
      setError(e.message || t('unknownError'));
    }
  };

  if (status === 'loading' || loadingInterests) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-700 hover:text-green-900">
              ×
            </button>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-600" />
                {t('tastesPreferences')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('tastesDescription')}{' '}
                <Link href="/onboarding" className="text-blue-600 hover:underline">
                  {t('editOnboarding')}
                </Link>
              </p>
            </div>
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {t('editOnboarding')}
            </Link>
          </div>

          {userPreferences && (
            <div className="mt-4 space-y-4">
              {userPreferences.musicPreferences && userPreferences.musicPreferences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('musicGenres')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.musicPreferences.map((genre: string) => (
                      <span
                        key={genre}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {userPreferences.categoryPreferences && userPreferences.categoryPreferences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('categories')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.categoryPreferences.map((category: string) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {userPreferences.vibePreferences && userPreferences.vibePreferences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('ambiances')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.vibePreferences.map((vibe: string) => (
                      <span
                        key={vibe}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-pink-50 text-pink-800 border border-pink-200 text-sm"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('tastesPreferences')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('tastesDescription')}{' '}
                <Link href="/onboarding" className="text-blue-600 hover:underline">
                  {t('editOnboarding')}
                </Link>
              </p>
            </div>
          </div>

          {/* Toggle personnalisation */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t('personalization')}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {t('personalizationDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={personalizationEnabled}
                  onChange={(e) => togglePersonalization(e.target.checked)}
                  disabled={loadingPersonalization}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {loadingInterests ? (
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('loading')}
            </div>
          ) : (
            <>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('manualPreferences')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {interestTags
                      .filter((tag) => tag.source === 'manual')
                      .map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-sm"
                        >
                          {tag.category}:{tag.value}
                          <button
                            type="button"
                            onClick={() => removeInterest(tag)}
                            className="text-blue-700 hover:text-blue-900"
                            title={t('remove')}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    {interestTags.filter((tag) => tag.source === 'manual').length === 0 && (
                      <p className="text-sm text-gray-500">{t('noManualPreferences')}</p>
                    )}
                  </div>
                </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t('addPreference')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">{t('category')}</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const v = e.target.value as any;
                        setSelectedCategory(v);
                        setSelectedValue('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="genre">{t('genre')}</option>
                      <option value="style">{t('style')}</option>
                      <option value="type">{t('type')}</option>
                      <option value="ambiance">{t('ambiance')}</option>
                    </select>
                  </div>

                  {selectedCategory === 'style' && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('genreForStyles')}</label>
                      <select
                        value={selectedGenreForStyles}
                        onChange={(e) => {
                          setSelectedGenreForStyles(e.target.value);
                          setSelectedValue('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={selectedCategory === 'style' ? '' : 'md:col-span-2'}>
                    <label className="block text-sm text-gray-700 mb-1">{t('value')}</label>
                    <select
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t('select')}</option>
                      {selectedCategory === 'genre' &&
                        GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      {selectedCategory === 'type' &&
                        EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      {selectedCategory === 'ambiance' &&
                        AMBIANCES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      {selectedCategory === 'style' &&
                        getStylesForGenre(selectedGenreForStyles).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    onClick={addManualInterest}
                    disabled={adding || !selectedValue}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t('add')}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {(session?.user?.role === 'ORGANIZER' || (session?.user as any)?.organizer) && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                  {t('organizerIntegrations')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('organizerDescription')}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="/organisateur/integrations"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('manageIntegrations')}
              </a>
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t('followedOrganizers')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('followedDescription')}
              </p>
            </div>
          </div>

          <FollowingOrganizersList />
        </section>
      </main>
    </div>
  );
}

// Composant pour afficher la liste des organisateurs suivis
function FollowingOrganizersList() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/organizers/following');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setOrganizers(data.organizers || []);
    } catch (e: any) {
      // Gérer les erreurs réseau différemment des erreurs serveur
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError(e.message || 'Erreur lors du chargement des organisateurs suivis');
      }
      console.error('Erreur loadFollowing:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFollowing();
  }, []);

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{t('errorLoading')}</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => void loadFollowing()}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (organizers.length === 0) {
    return (
      <div className="mt-4 text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{t('noOrganizers')}</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('discoverOrganizers')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {organizers.map((org) => (
        <Link
          key={org.id}
          href={`/organisateur/${org.id}`}
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            {org.user?.image ? (
              <img
                src={org.user.image}
                alt={org.displayName}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                {org.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{org.displayName}</h3>
                {org.verified && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {org.eventsCount} {tCommon('events')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {org.followersCount} {tCommon('followers')}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


