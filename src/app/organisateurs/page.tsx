'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { Users, Calendar, Search, Loader2, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Organizer {
  id: string;
  displayName: string;
  slug: string | null;
  verified: boolean;
  _count: {
    events: number;
  };
  user?: {
    name: string | null;
    image: string | null;
  };
}

interface ApiResponse {
  items: Organizer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function OrganisateursPage() {
  const t = useTranslations('organizers');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['organizers', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', page.toString());
      params.set('pageSize', '20');
      
      const res = await fetch(`/api/organizers?${params.toString()}`);
      if (!res.ok) throw new Error(t('loadingError'));
      return res.json();
    },
  });

  const organizers = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-slate-400 text-lg">
              {t('subtitleFull')}
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Liste des organisateurs */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400">{t('loadingError')}</p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('noOrganizersFound')}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-slate-400 text-sm">
                {t('organizersFound', { count: total })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizers.map((organizer) => (
                  <Link
                    key={organizer.id}
                    href={organizer.slug ? `/organisateur/${organizer.slug}` : `/organisateur/${organizer.id}`}
                    className="group bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        {organizer.user?.image ? (
                          <Image
                            src={organizer.user.image}
                            alt={organizer.displayName}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            <Users className="w-6 h-6 text-purple-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                              {organizer.displayName}
                            </h3>
                            {organizer.verified && (
                              <CheckCircle className="w-5 h-5 text-blue-400" title={t('verified')} />
                            )}
                          </div>
                          {organizer.user?.name && (
                            <p className="text-sm text-slate-400">{organizer.user.name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{t('eventsCount', { count: organizer._count.events })}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  >
                    {tCommon('previous')}
                  </button>
                  <span className="text-slate-400 px-4">
                    {tCommon('page')} {page} {tCommon('of')} {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  >
                    {tCommon('next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
