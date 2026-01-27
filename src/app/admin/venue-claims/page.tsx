/**
 * Dashboard admin pour modérer les venue claims
 * Permet d'approuver/rejeter les demandes de claim de venues
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import AdminNav from '@/components/AdminNav';
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Globe,
  MapPin,
  Calendar,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';

interface VenueClaim {
  id: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNCLAIMED';
  roleAtVenue: string | null;
  professionalEmail: string | null;
  website: string | null;
  socialLink: string | null;
  submittedInfo: any;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

const getDateLocale = (locale: string) => {
  switch (locale) {
    case 'fr': return fr;
    case 'es': return es;
    default: return enUS;
  }
};

export default function VenueClaimsAdminPage() {
  const t = useTranslations('admin.venueClaims');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'fr' | 'en' | 'es';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'authenticated') {
      loadClaims();
    }
  }, [status, statusFilter, page]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/admin/venue-claims?${params}`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/?error=admin_required');
          return;
        }
        throw new Error('Erreur lors du chargement des claims');
      }

      const data = await res.json();
      setClaims(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (claimId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      setProcessing(prev => new Set(prev).add(claimId));

      const res = await fetch(`/api/admin/venue-claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la modération');
      }

      // Recharger les claims
      await loadClaims();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la modération');
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'PENDING':
        return (
          <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}>
            <Clock className="w-3 h-3 inline mr-1" />
            En attente
          </span>
        );
      case 'VERIFIED':
        return (
          <span className={`${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`}>
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Approuvé
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`}>
            <XCircle className="w-3 h-3 inline mr-1" />
            Rejeté
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-slate-500/20 text-slate-400 border border-slate-500/30`}>
            Non revendiqué
          </span>
        );
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      claim.venue.name.toLowerCase().includes(query) ||
      claim.user.email.toLowerCase().includes(query) ||
      (claim.user.name && claim.user.name.toLowerCase().includes(query))
    );
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="pt-24 pb-12">
          <ModernLoader />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/api/auth/signin?callbackUrl=/admin/venue-claims');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <AdminNav />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-sky-400" />
            <h1 className="text-3xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <p className="text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="VERIFIED">Approuvés</option>
              <option value="REJECTED">Rejetés</option>
            </select>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noClaims')}</p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Left: Venue Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {claim.venue.name}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {claim.venue.address}, {claim.venue.city}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    {/* User Info */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-4 h-4" />
                        <span>
                          {claim.user.name || 'Utilisateur anonyme'} ({claim.user.email})
                        </span>
                      </div>
                      {claim.roleAtVenue && (
                        <div className="text-slate-400 text-sm">
                          {t('role')}: <span className="text-slate-300">{claim.roleAtVenue}</span>
                        </div>
                      )}
                      {claim.professionalEmail && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Mail className="w-4 h-4" />
                          <span>{claim.professionalEmail}</span>
                        </div>
                      )}
                      {claim.website && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Globe className="w-4 h-4" />
                          <a
                            href={claim.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300"
                          >
                            {claim.website}
                          </a>
                        </div>
                      )}
                      {claim.socialLink && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Globe className="w-4 h-4" />
                          <a
                            href={claim.socialLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300"
                          >
                            {claim.socialLink}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t('created')}: {format(new Date(claim.createdAt), 'PPp', { locale: getDateLocale(locale) })}
                        </span>
                      </div>
                      {claim.reviewedAt && (
                        <div className="flex items-center gap-1">
                          <span>
                            {t('reviewed')}: {format(new Date(claim.reviewedAt), 'PPp', { locale: getDateLocale(locale) })}
                          </span>
                        </div>
                      )}
                      {claim.reviewer && (
                        <div className="text-slate-400">
                          par {claim.reviewer.name || claim.reviewer.email}
                        </div>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {claim.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                        <strong>Raison du rejet:</strong> {claim.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {claim.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <button
                        onClick={() => handleReview(claim.id, 'approve')}
                        disabled={processing.has(claim.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processing.has(claim.id) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('processing')}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {t('approve')}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(`${t('rejectionReason')} (optionnel):`);
                          if (reason !== null) {
                            handleReview(claim.id, 'reject', reason || undefined);
                          }
                        }}
                        disabled={processing.has(claim.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processing.has(claim.id) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Rejeter
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('previous')}
            </button>
            <span className="px-4 py-2 text-slate-400">
              {t('page', { page, total: totalPages })}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
