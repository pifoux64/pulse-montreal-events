/**
 * Dashboard admin pour l'observabilité de l'ingestion
 * SPRINT A: Architecture d'ingestion légale et durable
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import AdminNav from '@/components/AdminNav';
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Settings,
  Play,
  Pause,
  Eye,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface Source {
  id: string;
  name: string;
  type: string;
  eventSource: string;
  legalStatus: string;
  isEnabled: boolean;
  syncInterval: number;
  lastSyncAt: string | null;
  createdAt: string;
  health: {
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    consecutiveFailures: number;
    nextRunAt: string | null;
    lastErrorMessage: string | null;
  } | null;
  _count: {
    importJobs: number;
  };
}

interface ImportJob {
  id: string;
  source: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errorSample: string | null;
}

export default function IngestionDashboard() {
  const { data: session, status } = useSession();
  const [sources, setSources] = useState<Source[]>([]);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les sources
      const sourcesRes = await fetch('/api/ingestion/sources');
      if (!sourcesRes.ok) {
        throw new Error('Erreur lors du chargement des sources');
      }
      const sourcesData = await sourcesRes.json();
      setSources(sourcesData.data || []);

      // Charger les jobs récents
      const jobsRes = await fetch('/api/ingestion/jobs?limit=10');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setRecentJobs(jobsData.data || []);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (sourceId: string) => {
    try {
      setImporting((prev) => new Set(prev).add(sourceId));
      setError(null);

      const res = await fetch(`/api/ingestion/sources/${sourceId}/import`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      // Recharger les données
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleString('fr-CA', {
      timeZone: 'America/Montreal',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-50';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLegalStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-green-700 bg-green-100';
      case 'PENDING_VERIFICATION':
        return 'text-yellow-700 bg-yellow-100';
      case 'UNVERIFIED':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-950">
        <Navigation />
        <div className="pt-24">
          <ModernLoader size="lg" text="Chargement du dashboard..." variant="light" />
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-950 text-white">
        <Navigation />
        <div className="pt-24 text-center py-12">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-3xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-gray-300 mb-6">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const totalEvents = sources.reduce(
    (sum, source) => sum + (source._count?.importJobs || 0),
    0
  );
  const activeSources = sources.filter((s) => s.isEnabled).length;
  const healthySources = sources.filter(
    (s) => s.health && s.health.consecutiveFailures < 3
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-950 text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Admin Navigation */}
        <AdminNav />
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Database className="w-10 h-10 text-emerald-400" />
                Dashboard Ingestion
              </h1>
              <p className="text-gray-300">
                Observabilité et gestion des sources d'ingestion d'événements
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{sources.length}</span>
            </div>
            <p className="text-gray-300 text-sm">Sources configurées</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{activeSources}</span>
            </div>
            <p className="text-gray-300 text-sm">Sources actives</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold text-white">{healthySources}</span>
            </div>
            <p className="text-gray-300 text-sm">Sources saines</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{totalEvents}</span>
            </div>
            <p className="text-gray-300 text-sm">Jobs d'import</p>
          </div>
        </div>

        {/* Liste des sources */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Sources d'ingestion
          </h2>

          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{source.name}</h3>
                      {source.isEnabled ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full flex items-center gap-1">
                          <Pause className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getLegalStatusColor(
                          source.legalStatus
                        )}`}
                      >
                        {source.legalStatus === 'VERIFIED'
                          ? '✓ Vérifié'
                          : source.legalStatus === 'PENDING_VERIFICATION'
                            ? '⏳ En attente'
                            : '⚠ Non vérifié'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="text-white font-medium">{source.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Dernière sync</p>
                        <p className="text-white font-medium">
                          {formatDate(source.lastSyncAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Intervalle</p>
                        <p className="text-white font-medium">
                          {formatDuration(source.syncInterval)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Échecs consécutifs</p>
                        <p
                          className={`font-medium ${
                            source.health?.consecutiveFailures >= 3
                              ? 'text-red-400'
                              : source.health?.consecutiveFailures > 0
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }`}
                        >
                          {source.health?.consecutiveFailures || 0}
                        </p>
                      </div>
                    </div>

                    {source.health?.lastErrorMessage && (
                      <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                        <p className="text-red-300 text-sm">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          {source.health.lastErrorMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleImport(source.id)}
                      disabled={importing.has(source.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {importing.has(source.id) ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Import...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Importer
                        </>
                      )}
                    </button>
                    <Link
                      href={`/admin/ingestion/sources/${source.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {sources.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Aucune source configurée</p>
              </div>
            )}
          </div>
        </div>

        {/* Jobs récents */}
        {recentJobs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Jobs récents
            </h2>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Résultats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white">{job.source}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex gap-4">
                          <span className="text-green-400">
                            +{job.insertedCount}
                          </span>
                          <span className="text-blue-400">
                            ~{job.updatedCount}
                          </span>
                          <span className="text-gray-400">
                            -{job.skippedCount}
                          </span>
                          {job.errorCount > 0 && (
                            <span className="text-red-400">
                              !{job.errorCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(job.startedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
