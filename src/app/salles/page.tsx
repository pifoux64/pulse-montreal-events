'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { VenueImage } from '@/components/VenueImage';
import { Building2, MapPin, Calendar, Search, Loader2, Star, Users, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Venue {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string;
  city: string;
  neighborhood: string | null;
  imageUrl: string | null;
  capacity: number | null;
  tags: string[];
  _count: {
    events: number;
  };
}

interface ApiResponse {
  items: Venue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function SallesPage() {
  const t = useTranslations('venues');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['venues', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', page.toString());
      params.set('pageSize', '20');
      
      const res = await fetch(`/api/venues?${params.toString()}`);
      if (!res.ok) throw new Error(tErrors('loadingError'));
      return res.json();
    },
  });

  const venues = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section avec gradient animé */}
          <div className="mb-12 text-center relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">{t('badge')}</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-purple-200">
                {t('title')}
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Barre de recherche améliorée */}
          <div className="mb-10 max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-14 pr-5 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-lg"
                />
              </div>
            </div>
          </div>

          {/* Liste des venues */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400">{t('loadingError')}</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t('noVenuesFound')}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <span className="text-slate-300 font-semibold">
                      {t('venuesFound', { count: total })}
                    </span>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {t('clearSearch')}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue, index) => (
                  <Link
                    key={venue.id}
                    href={venue.slug ? `/salle/${venue.slug}` : `/salle/${venue.id}`}
                    className="group relative bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image de la salle */}
                    {venue.imageUrl ? (
                      <div className="relative h-48 overflow-hidden">
                        <VenueImage
                          src={venue.imageUrl}
                          alt={venue.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none"></div>
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    
                    {/* Gradient background animé */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                    
                    {/* Badge événements populaires */}
                    {venue._count.events > 5 && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm border border-amber-400/50">
                          <TrendingUp className="w-3 h-3 text-white" />
                          <span className="text-xs font-bold text-white">{t('popular')}</span>
                        </div>
                      </div>
                    )}

                    <div className="relative p-6">
                      {/* Header avec icône et nom */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
                          <Building2 className="w-7 h-7 text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                            {venue.name}
                          </h3>
                          {venue.neighborhood && (
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <p className="text-sm text-purple-300 font-medium">{venue.neighborhood}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Informations */}
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                          <div className="p-1.5 rounded-lg bg-white/5">
                            <MapPin className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="line-clamp-1">{venue.address}, {venue.city}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white/5">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="font-semibold">{t('eventsCount', { count: venue._count.events })}</span>
                          </div>
                          {venue.capacity && (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-white/5">
                                <Users className="w-4 h-4 text-purple-400" />
                              </div>
                              <span className="font-semibold">{t('capacity', { count: venue.capacity })}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags / Styles d'événements */}
                      {venue.tags && venue.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {venue.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-white/5 text-slate-300 text-xs rounded-lg border border-white/10"
                              >
                                {tag}
                              </span>
                            ))}
                            {venue.tags.length > 3 && (
                              <span className="px-2 py-1 bg-white/5 text-slate-400 text-xs rounded-lg border border-white/10">
                                +{venue.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {venue.description && (
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                          {venue.description}
                        </p>
                      )}

                      {/* Footer avec CTA */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{t('seeDetails')}</span>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-blue-300 text-lg">→</span>
                          </div>
                        </div>
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
