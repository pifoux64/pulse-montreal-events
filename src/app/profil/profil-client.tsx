'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CheckCircle, ExternalLink, Loader2, Music, RefreshCw, Trash2, AlertCircle, Plus, X, Users, Calendar } from 'lucide-react';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<MusicConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [interestTags, setInterestTags] = useState<InterestTag[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'genre' | 'style' | 'type' | 'ambiance'>('genre');
  const [selectedGenreForStyles, setSelectedGenreForStyles] = useState<string>('reggae');
  const [selectedValue, setSelectedValue] = useState<string>('');

  const spotifyConnection = useMemo(
    () => connections.find((c) => c.service === 'spotify') ?? null,
    [connections],
  );

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
    if (urlSuccess === 'spotify_connected') setSuccess('Spotify connecté avec succès.');
  }, [status, searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    refreshConnections();
    refreshInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const refreshConnections = async () => {
    try {
      setLoadingConnections(true);
      setError(null); // Réinitialiser l'erreur avant le fetch
      const res = await fetch('/api/user/music-services');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (e: any) {
      // Gérer les erreurs réseau différemment des erreurs serveur
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError(e.message || 'Erreur lors du chargement des connexions');
      }
      console.error('Erreur refreshConnections:', e);
    } finally {
      setLoadingConnections(false);
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
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError(e.message || 'Erreur lors du chargement des goûts');
      }
      console.error('Erreur refreshInterests:', e);
    } finally {
      setLoadingInterests(false);
    }
  };

  const connectSpotify = async () => {
    try {
      setError(null);
      // Utiliser la nouvelle route standardisée
      window.location.href = '/api/integrations/spotify/auth';
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    }
  };

  const syncSpotify = async () => {
    try {
      setError(null);
      setSuccess(null);
      setSyncing(true);
      const res = await fetch('/api/user/music-taste/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'spotify' }),
      });
      
      // Vérifier si la réponse est vide ou non-JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Réponse invalide du serveur: ${text || 'Réponse vide'}`);
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Erreur de synchronisation (${res.status})`);
      }
      setSuccess(`Synchronisation terminée: ${data.pulseGenres?.length || 0} genre(s) détecté(s).`);
      await refreshConnections();
      await refreshInterests();
    } catch (e: any) {
      console.error('Erreur syncSpotify:', e);
      setError(e.message || 'Erreur inconnue lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectSpotify = async () => {
    if (!confirm('Déconnecter Spotify ? (les tags Spotify seront supprimés)')) return;
    try {
      setError(null);
      setDisconnecting(true);
      const res = await fetch('/api/user/music-services/spotify', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de déconnexion');
      setSuccess('Spotify déconnecté.');
      await refreshConnections();
      await refreshInterests();
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setDisconnecting(false);
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’ajout');
      setSuccess('Préférence ajoutée.');
      await refreshInterests();
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
      await refreshInterests();
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    }
  };

  if (status === 'loading' || loadingConnections) {
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
          <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
          <p className="text-gray-600">
            Connectez Spotify pour obtenir des recommandations basées sur vos goûts (ex: musique classique, electro, musées, sorties en famille etc..).
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
                <Music className="w-5 h-5 text-green-600" />
                Connexion Spotify
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Connectez votre compte Spotify pour obtenir des recommandations personnalisées d'événements basées sur vos goûts musicaux.
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">🔒 Données utilisées :</p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-0.5">
                  <li>Top artists (via API Spotify)</li>
                  <li>Genres musicaux dérivés</li>
                </ul>
                <p className="text-xs text-blue-800 font-medium mt-2 mb-1">🎯 Utilisation :</p>
                <p className="text-xs text-blue-700">
                  Ces données sont utilisées exclusivement pour générer des recommandations personnalisées d'événements. 
                  Elles ne sont jamais partagées avec des tiers.
                </p>
              </div>
            </div>

            {spotifyConnection ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm">
                <CheckCircle className="w-4 h-4" />
                Connecté
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-sm">
                Non connecté
              </span>
            )}
          </div>

          {spotifyConnection ? (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">Spotify user id:</span> {spotifyConnection.externalUserId}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Dernière sync:</span>{' '}
                  {spotifyConnection.lastSyncAt
                    ? new Date(spotifyConnection.lastSyncAt).toLocaleString('fr-CA')
                    : 'Jamais'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={syncSpotify}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Synchroniser mes goûts
                </button>

                <button
                  onClick={disconnectSpotify}
                  disabled={disconnecting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Déconnecter
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={connectSpotify}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Connecter Spotify
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes goûts & préférences</h2>
              <p className="text-sm text-gray-600 mt-1">
                Ces préférences servent aux recommandations et notifications. Vous pouvez compléter/ajuster ce que Spotify a détecté.
              </p>
            </div>
          </div>

          {loadingInterests ? (
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Détecté depuis Spotify</h3>
                  <div className="flex flex-wrap gap-2">
                    {interestTags
                      .filter((t) => t.source === 'spotify' && t.category === 'genre')
                      .map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200 text-sm"
                        >
                          {t.value}
                          <button
                            type="button"
                            onClick={() => removeInterest(t)}
                            className="text-green-700 hover:text-green-900"
                            title="Retirer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    {interestTags.filter((t) => t.source === 'spotify' && t.category === 'genre').length === 0 && (
                      <p className="text-sm text-gray-500">Aucun genre Spotify enregistré (sync non faite ou vide).</p>
                    )}
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Styles détectés</h4>
                    <div className="flex flex-wrap gap-2">
                      {interestTags
                        .filter((t) => t.source === 'spotify' && t.category === 'style')
                        .map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm"
                          >
                            {t.value}
                            <button
                              type="button"
                              onClick={() => removeInterest(t)}
                              className="text-emerald-700 hover:text-emerald-900"
                              title="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      {interestTags.filter((t) => t.source === 'spotify' && t.category === 'style').length === 0 && (
                        <p className="text-sm text-gray-500">Aucun style détecté pour l’instant.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mes préférences manuelles</h3>
                  <div className="flex flex-wrap gap-2">
                    {interestTags
                      .filter((t) => t.source === 'manual')
                      .map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-sm"
                        >
                          {t.category}:{t.value}
                          <button
                            type="button"
                            onClick={() => removeInterest(t)}
                            className="text-blue-700 hover:text-blue-900"
                            title="Retirer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    {interestTags.filter((t) => t.source === 'manual').length === 0 && (
                      <p className="text-sm text-gray-500">Aucune préférence manuelle pour l’instant.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Ajouter une préférence</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const v = e.target.value as any;
                        setSelectedCategory(v);
                        setSelectedValue('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="genre">Genre</option>
                      <option value="style">Style</option>
                      <option value="type">Type</option>
                      <option value="ambiance">Ambiance</option>
                    </select>
                  </div>

                  {selectedCategory === 'style' && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Genre (pour styles)</label>
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
                    <label className="block text-sm text-gray-700 mb-1">Valeur</label>
                    <select
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Sélectionner…</option>
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
                    Ajouter
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
                  Intégrations organisateur
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Publiez vos événements sur Facebook, Eventbrite et d'autres plateformes.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="/organisateur/integrations"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Gérer les intégrations (Facebook/Eventbrite)
              </a>
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Mes organisateurs suivis
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Organisateurs que vous suivez pour recevoir des notifications sur leurs nouveaux événements.
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
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Erreur lors du chargement</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => void loadFollowing()}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
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
        <p className="text-gray-600 mb-4">Vous ne suivez aucun organisateur pour le moment.</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Découvrir des organisateurs
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
                  {org.eventsCount} événement{org.eventsCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {org.followersCount} follower{org.followersCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


