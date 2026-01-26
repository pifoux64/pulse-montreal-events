'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import FollowUserButton from '@/components/social/FollowUserButton';
import FollowOrganizerButton from '@/components/FollowOrganizerButton';
import { Users, MessageCircle, Heart, Calendar, TrendingUp, Search, Building2, UserCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Pulser {
  id: string;
  type: 'user' | 'venue' | 'organizer';
  name: string | null;
  image: string | null;
  slug?: string | null;
  similarityScore?: number;
  commonFavorites?: number;
  commonEvents?: number;
  isFollowing: boolean;
  eventsCount?: number;
  verified?: boolean;
}

export default function PulsersPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pulsers, setPulsers] = useState<Pulser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/pulsers');
    } else if (status === 'authenticated') {
      loadRecommendedUsers();
    }
  }, [status, router]);

  const loadRecommendedUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/users/recommended?limit=50');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || tErrors('loadingError'));
      }

      const data = await response.json();
      setPulsers(data.pulsers || []);
      
      // Si aucun pulser mais pas d'erreur, c'est normal (pas encore d'activité)
      if (data.pulsers && data.pulsers.length === 0) {
        setError(null); // Pas d'erreur, juste pas de recommandations
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err.message || tErrors('loadingError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = (id: string, type: 'user' | 'organizer', newState: boolean) => {
    setPulsers(prevPulsers =>
      prevPulsers.map(pulser =>
        pulser.id === id && pulser.type === type ? { ...pulser, isFollowing: newState } : pulser
      )
    );
  };

  const filteredPulsers = pulsers.filter(pulser =>
    pulser.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSimilarityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="pt-24 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <ModernLoader size="lg" text={t('loadingPulsers')} variant="default" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('discoverPulsers')}</h1>
                <p className="text-slate-400 mt-1">
                  {t('findSimilarTastes')}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPulser')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
              <p className="font-semibold mb-1">{tCommon('error')}</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Pulsers Grid */}
          {!error && filteredPulsers.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center border border-white/10">
              <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                {searchQuery ? t('noPulsersFound') : t('noPulsersRecommended')}
              </p>
              {!searchQuery && (
                <p className="text-slate-500 text-sm">
                  {t('addFavoritesToDiscover')}
                </p>
              )}
            </div>
          ) : !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPulsers.map((pulser) => (
                <div
                  key={`${pulser.type}-${pulser.id}`}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                >
                  {/* Pulser Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                        {pulser.image ? (
                          <Image
                            src={pulser.image}
                            alt={pulser.name || t('pulser')}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {pulser.type === 'venue' ? (
                              <Building2 className="w-6 h-6" />
                            ) : pulser.type === 'organizer' ? (
                              <UserCheck className="w-6 h-6" />
                            ) : (
                              <Users className="w-6 h-6" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {pulser.name || (pulser.type === 'venue' ? t('venues') : pulser.type === 'organizer' ? t('organizers') : t('anonymousUser'))}
                          </h3>
                          {pulser.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" title={t('verified')} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Badge type */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            pulser.type === 'venue' 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : pulser.type === 'organizer'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {pulser.type === 'venue' ? (
                              <>
                                <Building2 className="w-3 h-3" />
                                {t('venues')}
                              </>
                            ) : pulser.type === 'organizer' ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                {t('organizers')}
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" />
                                {t('pulser')}
                              </>
                            )}
                          </span>
                          {pulser.type === 'user' && pulser.similarityScore !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>{formatSimilarityScore(pulser.similarityScore)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    {pulser.type === 'user' && pulser.commonFavorites !== undefined && pulser.commonFavorites > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>{t('commonFavorites', { count: pulser.commonFavorites })}</span>
                      </div>
                    )}
                    {pulser.type === 'user' && pulser.commonEvents !== undefined && pulser.commonEvents > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{t('commonEvents', { count: pulser.commonEvents })}</span>
                      </div>
                    )}
                    {(pulser.type === 'venue' || pulser.type === 'organizer') && pulser.eventsCount !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{t('eventsCount', { count: pulser.eventsCount })}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {pulser.type === 'user' ? (
                      <>
                        <FollowUserButton
                          userId={pulser.id}
                          isFollowing={pulser.isFollowing}
                          onToggle={(newState) => handleFollowToggle(pulser.id, 'user', newState)}
                          className="flex-1"
                        />
                        <Link
                          href={`/messages?userId=${pulser.id}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {t('message')}
                        </Link>
                      </>
                    ) : pulser.type === 'organizer' ? (
                      <FollowOrganizerButton
                        organizerId={pulser.id}
                        initialIsFollowing={pulser.isFollowing}
                        onToggle={(newState) => handleFollowToggle(pulser.id, 'organizer', newState)}
                        className="flex-1"
                      />
                    ) : pulser.type === 'venue' ? (
                      <Link
                        href={pulser.slug ? `/salle/${pulser.slug}` : `/salle/${pulser.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        {t('viewVenue')}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
