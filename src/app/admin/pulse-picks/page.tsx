'use client';

/**
 * Admin - Pulse Picks (Top 5)
 * SPRINT 3: Gestion éditoriale des Top 5
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar, RefreshCw, Eye, Edit3, CheckCircle, XCircle, Archive, Send } from 'lucide-react';
import Link from 'next/link';
import { toMontrealDateString } from '@/lib/utils';

interface EditorialPost {
  id: string;
  slug: string;
  title: string;
  theme: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  periodStart: string;
  periodEnd: string;
  eventsOrder: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

const THEMES: { value: string; label: string }[] = [
  { value: 'famille', label: 'Famille' },
  { value: 'culture', label: 'Culture' },
  { value: 'sport', label: 'Sport' },
  { value: 'musique', label: 'Musique' },
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'rock', label: 'Rock' },
  { value: 'electro', label: 'Electro / Techno' },
  { value: 'sound-system', label: 'Sound System / Dub' },
];

export default function PulsePicksAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<string>('famille');
  const [weekStart, setWeekStart] = useState<string>('');
  const [weekEnd, setWeekEnd] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [socialKitPostId, setSocialKitPostId] = useState<string | null>(null);
  const [socialKitLoading, setSocialKitLoading] = useState(false);
  const [socialKitError, setSocialKitError] = useState<string | null>(null);
  const [socialKit, setSocialKit] = useState<{
    shortCaption: string;
    longCaption: string;
    hashtags: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Rediriger si non admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  async function fetchPosts(selectedTheme?: string) {
    try {
      setLoading(true);
      const url = new URL('/api/editorial/pulse-picks', window.location.origin);
      if (selectedTheme) {
        url.searchParams.set('theme', selectedTheme);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des Pulse Picks');
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPosts();
    }
  }, [status]);

  // Calculer la semaine courante par défaut
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7; // 0 = dimanche, 1 = lundi...
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setWeekStart(toMontrealDateString(monday));
    setWeekEnd(toMontrealDateString(sunday));
  }, []);

  async function handleGenerate() {
    if (!theme || !weekStart || !weekEnd) return;
    try {
      setIsGenerating(true);
      const res = await fetch('/api/editorial/pulse-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          periodStart: weekStart,
          periodEnd: weekEnd,
          limit: 5,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la génération des Pulse Picks');
      }
      await fetchPosts(theme);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur inattendue');
    } finally {
      setIsGenerating(false);
    }
  }

  async function openSocialKit(postId: string) {
    try {
      setSocialKitPostId(postId);
      setSocialKitLoading(true);
      setSocialKitError(null);
      setSocialKit(null);

      const res = await fetch(`/api/editorial/pulse-picks/${postId}/social-kit`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la génération du Social Kit');
      }
      const data = await res.json();
      setSocialKit(data.kit);
    } catch (err: any) {
      console.error(err);
      setSocialKitError(err.message || 'Erreur inattendue');
    } finally {
      setSocialKitLoading(false);
    }
  }

  async function updateStatus(postId: string, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    try {
      setUpdatingStatus(postId);
      const res = await fetch(`/api/editorial/pulse-picks/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'PUBLISHED' && { publishedAt: new Date().toISOString() }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
      }

      // Rafraîchir la liste
      await fetchPosts();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur inattendue');
    } finally {
      setUpdatingStatus(null);
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pulse Picks - Top 5</h1>
            <p className="text-slate-400 text-sm mt-1">
              Génération automatique de Top 5 par thème, avec validation éditoriale avant publication.
            </p>
          </div>
        </div>

        {/* Bloc génération */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            Générer un Pulse Picks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Thème</label>
              <select
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Du</label>
              <input
                type="date"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Au</label>
              <input
                type="date"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Générer / mettre à jour
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {/* Liste des posts */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Posts éditoriaux récents</h2>
            <button
              onClick={() => fetchPosts()}
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun Pulse Picks généré pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-800 rounded-xl px-4 py-3 bg-slate-950/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {post.theme}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                            : post.status === 'DRAFT'
                            ? 'bg-slate-800 text-slate-200 border-slate-600'
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-100">{post.title}</div>
                    <div className="text-xs text-slate-400">
                      Semaine du {toMontrealDateString(post.periodStart)} au {toMontrealDateString(post.periodEnd)}
                      {post.eventsOrder?.length ? ` • ${post.eventsOrder.length} événements` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Link
                      href={`/top-5/${post.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Link>
                    <button
                      onClick={() => openSocialKit(post.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
                    >
                      <Edit3 className="w-4 h-4" />
                      Social Kit
                    </button>
                    
                    {/* Actions selon le statut */}
                    {post.status === 'DRAFT' && (
                      <button
                        onClick={() => updateStatus(post.id, 'PUBLISHED')}
                        disabled={updatingStatus === post.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                      >
                        {updatingStatus === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Publier
                      </button>
                    )}
                    
                    {post.status === 'PUBLISHED' && (
                      <button
                        onClick={() => updateStatus(post.id, 'ARCHIVED')}
                        disabled={updatingStatus === post.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-600 hover:bg-slate-500 text-white disabled:opacity-50"
                      >
                        {updatingStatus === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                        Archiver
                      </button>
                    )}
                    
                    {post.status === 'ARCHIVED' && (
                      <button
                        onClick={() => updateStatus(post.id, 'PUBLISHED')}
                        disabled={updatingStatus === post.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50"
                      >
                        {updatingStatus === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Republier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Social Kit */}
      {socialKitPostId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Social Kit</h2>
              <button
                onClick={() => {
                  setSocialKitPostId(null);
                  setSocialKit(null);
                  setSocialKitError(null);
                }}
                className="text-sm text-slate-400 hover:text-slate-100"
              >
                Fermer
              </button>
            </div>
            {socialKitLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : socialKitError ? (
              <p className="text-sm text-red-400">{socialKitError}</p>
            ) : socialKit ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Légende courte</h3>
                  <textarea
                    readOnly
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm h-20"
                    value={socialKit.shortCaption}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Légende longue</h3>
                  <textarea
                    readOnly
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm h-32"
                    value={socialKit.longCaption}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Hashtags</h3>
                  <textarea
                    readOnly
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm h-20"
                    value={socialKit.hashtags}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Copier-coller ces textes dans Instagram / Facebook. Aucun appel à l&apos;API Meta n&apos;est utilisé.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucune donnée Social Kit pour ce post.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
