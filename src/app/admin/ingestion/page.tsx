'use client';

/**
 * Dashboard Admin - Ingestion d'Événements
 * Page protégée admin pour visualiser et gérer les imports
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Play,
  Calendar,
  Database,
  TrendingUp
} from 'lucide-react';
import { EventSource, ImportJobStatus } from '@prisma/client';

interface ImportJob {
  id: string;
  source: EventSource;
  status: ImportJobStatus;
  startedAt: string;
  finishedAt?: string;
  runAt: string;
  nbCreated: number;
  nbUpdated: number;
  nbSkipped: number;
  nbErrors: number;
  errorText?: string;
  stats?: any;
}

interface SourceStats {
  source: EventSource;
  totalEvents: number;
  lastImport?: string;
  lastStatus?: ImportJobStatus;
  successCount: number;
  errorCount: number;
}

export default function AdminIngestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/ingestion');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN') {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [status, session, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/ingestion');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setImportJobs(data.recentJobs || []);
      setSourceStats(data.sourceStats || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleTriggerIngestion = async (source?: EventSource) => {
    try {
      setIsTriggering(true);
      setError(null);
      
      const url = source 
        ? `/api/admin/ingest/${encodeURIComponent(source)}`
        : '/api/admin/ingest-all';
      
      console.log(`[DEBUG] Déclenchement ingestion pour source: ${source}, URL: ${url}`);
      
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du déclenchement');
      }
      
      const result = await response.json();
      console.log(`[DEBUG] Réponse ingestion:`, result);
      
      // Attendre un peu puis recharger
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error(`[DEBUG] Erreur ingestion:`, err);
      setError(err.message || 'Erreur lors du déclenchement');
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    if (!finishedAt) return 'En cours...';
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}min`;
    return `${Math.round(duration / 3600)}h`;
  };

  const getStatusIcon = (status: ImportJobStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RUNNING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ImportJobStatus) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-400';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400';
      case 'RUNNING':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <ModernLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl pt-24">
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-red-400">Erreur</h2>
            </div>
            <p className="text-red-300">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Ingestion</h1>
              <p className="text-slate-400">
                Gestion et monitoring du pipeline d'ingestion d'événements
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={() => handleTriggerIngestion()}
                disabled={isTriggering}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isTriggering ? 'Déclenchement...' : 'Ingestion complète'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Statistiques par source */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sourceStats.map((stat) => (
            <div
              key={stat.source}
              className="glass-effect p-6 rounded-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{stat.source}</h3>
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Événements</span>
                  <span className="font-bold text-xl">{stat.totalEvents.toLocaleString()}</span>
                </div>
                
                {stat.lastImport && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Dernier import</span>
                    <span className="text-slate-300">{formatDate(stat.lastImport)}</span>
                  </div>
                )}
                
                {!stat.lastImport && (
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Aucun import récent</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>{stat.successCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>{stat.errorCount}</span>
                  </div>
                </div>
                
                {stat.lastStatus === 'SUCCESS' && (
                  <button
                    onClick={() => handleTriggerIngestion(stat.source)}
                    disabled={isTriggering}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 rounded transition-colors disabled:opacity-50"
                  >
                    Relancer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tableau des ImportJobs */}
        <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Historique des imports récents
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Début</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Créés</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Mis à jour</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Ignorés</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Erreurs</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {importJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                      Aucun import récent
                    </td>
                  </tr>
                ) : (
                  importJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium">{job.source}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(job.startedAt || job.runAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDuration(job.startedAt || job.runAt, job.finishedAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-green-400">{job.nbCreated}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-blue-400">{job.nbUpdated}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-400">{job.nbSkipped}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {job.nbErrors > 0 ? (
                          <span className="font-semibold text-red-400">{job.nbErrors}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {job.errorText && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-red-400 hover:text-red-300">
                              Erreur
                            </summary>
                            <p className="mt-2 text-xs text-slate-400 max-w-md">
                              {job.errorText}
                            </p>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

