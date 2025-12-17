'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { CheckCircle, ExternalLink, Loader2, Music, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

type MusicConnection = {
  id: string;
  service: string;
  externalUserId: string;
  expiresAt: string;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilClient() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<MusicConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const refreshConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await fetch('/api/user/music-services');
      if (!res.ok) throw new Error('Erreur lors du chargement des connexions');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoadingConnections(false);
    }
  };

  const connectSpotify = async () => {
    try {
      setError(null);
      const res = await fetch('/api/user/music-services/spotify/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion Spotify');
      window.location.href = data.authUrl;
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de synchronisation');
      setSuccess(`Synchronisation terminée: ${data.pulseGenres?.length || 0} genre(s) détecté(s).`);
      await refreshConnections();
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
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
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setDisconnecting(false);
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
            Connectez Spotify pour obtenir des recommandations basées sur vos goûts (ex: reggae, dancehall).
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
                Autorisez Pulse à lire vos top artistes pour déduire vos genres préférés.
              </p>
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

                <a
                  href="/organisateur/integrations"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Intégrations organisateur
                </a>
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
              <p className="text-xs text-gray-500 mt-2">
                Nécessite: <code>SPOTIFY_CLIENT_ID</code> et <code>SPOTIFY_CLIENT_SECRET</code> dans l’environnement.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


