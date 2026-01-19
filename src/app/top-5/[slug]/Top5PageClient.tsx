'use client';

/**
 * Client component pour la page Top 5 avec CTAs de partage et "Save all 5"
 * Sprint V3: Share triggers + Save all 5
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Share2, Heart, Loader2, Check, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Top5ShareModal from '@/components/Top5ShareModal';
import { trackLandingView } from '@/lib/analytics/tracking';

interface Top5PageClientProps {
  post: {
    id: string;
    slug: string;
    title: string;
    theme: string;
    description?: string | null;
    periodStart: string; // ISO string
    periodEnd: string; // ISO string
  };
  eventIds: string[];
}

export default function Top5PageClient({ post, eventIds }: Top5PageClientProps) {
  const t = useTranslations('top5');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const isAuthenticated = status === 'authenticated';

  // Track landing view si on vient d'un lien partagé
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source');
    if (source === 'share') {
      trackLandingView({
        path: `/top-5/${post.slug}`,
        source: 'share',
        medium: urlParams.get('utm_medium') || 'link',
        campaign: urlParams.get('utm_campaign') || 'top5',
      });

      // Afficher le prompt de partage après 3 secondes
      setTimeout(() => {
        setShowSharePrompt(true);
        // Auto-dismiss après 8 secondes
        setTimeout(() => {
          setShowSharePrompt(false);
        }, 8000);
      }, 3000);
    }
  }, [post.slug]);

  const handleSaveAll = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/top-5/${post.slug}`)}`);
      return;
    }

    try {
      setIsSavingAll(true);
      const response = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error(t('errorAddingFavorites'));
      }

      setSavedAll(true);
      setTimeout(() => setSavedAll(false), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout en bulk:', error);
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <>
      {/* Header avec CTAs */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <p className="text-slate-300 text-sm mb-2">
              {t('top5Theme', { theme: post.theme })}
            </p>
            {post.periodStart && post.periodEnd && !isNaN(new Date(post.periodStart).getTime()) && !isNaN(new Date(post.periodEnd).getTime()) && (
              <p className="text-slate-400 text-xs mb-4">
                {t('period', {
                  start: new Date(post.periodStart).toLocaleDateString('fr-CA'),
                  end: new Date(post.periodEnd).toLocaleDateString('fr-CA'),
                })}
              </p>
            )}
          </div>
          
          {/* CTAs */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              {t('share')}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll || savedAll}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                savedAll
                  ? 'bg-green-600 text-white'
                  : isAuthenticated
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('saving')}
                </>
              ) : savedAll ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('saved')}
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  {t('saveAll')}
                </>
              )}
            </button>
          </div>
        </div>

        {post.description && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-sm text-slate-100 whitespace-pre-line">
            {post.description}
          </div>
        )}
      </div>

      {/* Share prompt (si venant d'un lien partagé) */}
      {showSharePrompt && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {t('sharePrompt')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowShareModal(true);
                  setShowSharePrompt(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {t('share')}
              </button>
              <button
                onClick={() => setShowSharePrompt(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <Top5ShareModal
        slug={post.slug}
        title={post.title}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}

