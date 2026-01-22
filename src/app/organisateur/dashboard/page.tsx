'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import { 
  Calendar, 
  Eye, 
  Heart, 
  MousePointerClick, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  BarChart3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Lock
} from 'lucide-react';
import EventAssistant from '@/components/ai/EventAssistant';
import ContentGenerator from '@/components/ai/ContentGenerator';
import BudgetCalculator from '@/components/ai/BudgetCalculator';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  imageUrl: string | null;
  _count?: {
    favorites: number;
    views?: number;
  };
}

interface Stats {
  totalEvents: number;
  upcomingEvents: number;
  totalViews: number;
  totalClicks: number;
  totalFavorites: number;
  viewsLast30Days: number;
  clicksLast30Days: number;
  favoritesLast30Days: number;
}

interface Subscription {
  plan: 'BASIC' | 'PRO';
  billingMonthly: number;
  active: boolean;
}

export default function OrganisateurDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportICS, setShowImportICS] = useState(false);
  const [icsPreview, setIcsPreview] = useState<any[]>([]);
  const [showAITools, setShowAITools] = useState(false);
  const [activeAITool, setActiveAITool] = useState<'assistant' | 'content' | 'budget'>('assistant');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/organisateur/dashboard');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
        router.push('/organisateur/mon-profil');
      } else {
        loadDashboard();
      }
    }
  }, [status, session, router]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Charger les événements de l'organisateur
      const organizerResponse = await fetch('/api/organizers/me');
      if (!organizerResponse.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const organizer = await organizerResponse.json();
      
      // Charger tous les événements de l'organisateur
      const allEventsResponse = await fetch(`/api/events?organizerId=${organizer.id}&pageSize=100`);
      if (allEventsResponse.ok) {
        const eventsData = await allEventsResponse.json();
        setEvents(eventsData.items || []);
      }

      // Charger les statistiques
      const statsResponse = await fetch(`/api/organizers/${organizer.id}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        // Calculer des stats basiques si l'API n'existe pas encore
        const loadedEvents = events.length > 0 ? events : [];
        const basicStats: Stats = {
          totalEvents: loadedEvents.length,
          upcomingEvents: loadedEvents.filter(e => new Date(e.startAt) > new Date()).length,
          totalViews: 0,
          totalClicks: 0,
          totalFavorites: loadedEvents.reduce((sum, e) => sum + (e._count?.favorites || 0), 0),
          viewsLast30Days: 0,
          clicksLast30Days: 0,
          favoritesLast30Days: 0,
        };
        setStats(basicStats);
      }

      // Charger l'abonnement
      const subscriptionResponse = await fetch(`/api/organizers/${organizer.id}/subscription`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);
      } else {
        // Par défaut BASIC
        setSubscription({ plan: 'BASIC', billingMonthly: 0, active: true });
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Recharger les données
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleImportICS = async (file: File) => {
    try {
      const text = await file.text();
      const events = parseICS(text);
      setIcsPreview(events);
      setShowImportICS(true);
    } catch (err: any) {
      alert('Erreur lors de la lecture du fichier ICS: ' + err.message);
    }
  };

  const parseICS = (icsContent: string): any[] => {
    // Parser ICS basique
    const events: any[] = [];
    const lines = icsContent.split('\n');
    let currentEvent: any = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent.start && currentEvent.title) {
          events.push(currentEvent);
        }
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.start = parseICSDate(line.substring(8));
      } else if (line.startsWith('DTEND:')) {
        currentEvent.end = parseICSDate(line.substring(6));
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9);
      }
    }
    
    return events;
  };

  const parseICSDate = (dateStr: string): Date => {
    // Format ICS: YYYYMMDDTHHMMSSZ ou YYYYMMDDTHHMMSS
    const cleaned = dateStr.replace(/[^0-9T]/g, '');
    const year = parseInt(cleaned.substring(0, 4));
    const month = parseInt(cleaned.substring(4, 6)) - 1;
    const day = parseInt(cleaned.substring(6, 8));
    const hour = cleaned.length > 8 ? parseInt(cleaned.substring(9, 11) || '0') : 0;
    const minute = cleaned.length > 10 ? parseInt(cleaned.substring(11, 13) || '0') : 0;
    return new Date(year, month, day, hour, minute);
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900 flex items-center justify-center">
        <ModernLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="pt-24 text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-xl font-semibold text-white mb-2">Erreur</p>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">
                  Tableau de bord
                </h1>
                {subscription && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
                    subscription.plan === 'PRO'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {subscription.plan === 'PRO' ? (
                      <>
                        <Crown className="w-4 h-4" />
                        PRO
                      </>
                    ) : (
                      'BASIC'
                    )}
                  </span>
                )}
              </div>
              <p className="text-slate-300">
                Gérez vos événements et consultez vos statistiques
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/publier"
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvel événement
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques 30 jours */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10 relative">
              {subscription?.plan === 'BASIC' && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-slate-500" title="Fonctionnalité PRO" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <Eye className="w-8 h-8 text-sky-400" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {subscription?.plan === 'PRO' ? stats.viewsLast30Days : '—'}
              </div>
              <div className="text-sm text-slate-400">Vues (30 jours)</div>
              <div className="text-xs text-slate-500 mt-2">
                {subscription?.plan === 'PRO' ? `Total: ${stats.totalViews}` : 'Upgradez vers PRO pour voir les détails'}
              </div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10 relative">
              {subscription?.plan === 'BASIC' && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-slate-500" title="Fonctionnalité PRO" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <MousePointerClick className="w-8 h-8 text-emerald-400" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {subscription?.plan === 'PRO' ? stats.clicksLast30Days : '—'}
              </div>
              <div className="text-sm text-slate-400">Clics (30 jours)</div>
              <div className="text-xs text-slate-500 mt-2">
                {subscription?.plan === 'PRO' ? `Total: ${stats.totalClicks}` : 'Upgradez vers PRO pour voir les détails'}
              </div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-8 h-8 text-red-400" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.favoritesLast30Days}
              </div>
              <div className="text-sm text-slate-400">Favoris (30 jours)</div>
              <div className="text-xs text-slate-500 mt-2">
                Total: {stats.totalFavorites}
              </div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.upcomingEvents}
              </div>
              <div className="text-sm text-slate-400">Événements à venir</div>
              <div className="text-xs text-slate-500 mt-2">
                Total: {stats.totalEvents}
              </div>
            </div>
          </div>
        )}

        {/* Outils IA */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 mb-8 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Outils IA pour Organisateurs
            </h2>
            <button
              onClick={() => setShowAITools(!showAITools)}
              className="text-sky-400 hover:text-sky-300 text-sm"
            >
              {showAITools ? 'Masquer' : 'Afficher'}
            </button>
          </div>

          {showAITools && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10">
                <button
                  onClick={() => setActiveAITool('assistant')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeAITool === 'assistant'
                      ? 'text-sky-400 border-b-2 border-sky-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Assistant Création
                </button>
                <button
                  onClick={() => setActiveAITool('content')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeAITool === 'content'
                      ? 'text-sky-400 border-b-2 border-sky-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Générateur Contenu
                </button>
                <button
                  onClick={() => setActiveAITool('budget')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeAITool === 'budget'
                      ? 'text-sky-400 border-b-2 border-sky-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Calculateur Budget
                </button>
              </div>

              {/* Content */}
              <div className="pt-4">
                {activeAITool === 'assistant' && (
                  <EventAssistant />
                )}
                {activeAITool === 'content' && (
                  <ContentGenerator />
                )}
                {activeAITool === 'budget' && (
                  <BudgetCalculator />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Import ICS */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 mb-8 border border-white/10 relative">
          {subscription?.plan === 'BASIC' && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-lg">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">PRO</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import ICS
            </h2>
            <button
              onClick={() => setShowImportICS(!showImportICS)}
              className="text-sky-400 hover:text-sky-300 text-sm"
              disabled={subscription?.plan === 'BASIC'}
            >
              {showImportICS ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {subscription?.plan === 'BASIC' && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg">
              <p className="text-sm text-amber-300">
                <Crown className="w-4 h-4 inline mr-2" />
                L'import ICS est disponible avec le plan PRO. Upgradez pour importer vos événements en masse.
              </p>
            </div>
          )}
          
          {showImportICS && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".ics,.ical"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportICS(file);
                    }}
                    className="hidden"
                    id="ics-upload"
                  />
                  <div className="cursor-pointer p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-sky-400 transition-colors text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <span className="text-slate-300">Cliquez pour sélectionner un fichier .ics</span>
                  </div>
                </label>
              </div>

              {icsPreview.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Aperçu ({icsPreview.length} événement{icsPreview.length > 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {icsPreview.map((event, index) => (
                      <div key={index} className="bg-slate-900/50 p-3 rounded-lg border border-white/10">
                        <div className="font-medium text-white">{event.title}</div>
                        <div className="text-sm text-slate-400">
                          {format(new Date(event.start), 'PPp', { locale: fr })}
                        </div>
                        {event.location && (
                          <div className="text-sm text-slate-400">{event.location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Implémenter l'import réel
                      alert('Import en cours de développement');
                    }}
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    Importer {icsPreview.length} événement{icsPreview.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des événements */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Mes événements ({events.length})
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-xl font-semibold text-white mb-2">
                Aucun événement
              </p>
              <p className="text-slate-300 mb-6">
                Créez votre premier événement pour commencer
              </p>
              <Link
                href="/publier"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Créer un événement
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-white/10 hover:border-sky-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {event.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.status === 'SCHEDULED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {event.status === 'SCHEDULED' ? 'Programmé' : event.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 mb-2">
                        {format(new Date(event.startAt), 'PPp', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {event._count?.views || 0} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {event._count?.favorites || 0} favoris
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/evenement/${event.id}`}
                        className="p-2 text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => router.push(`/publier?edit=${event.id}`)}
                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gestion d'abonnement */}
        <div className="mb-8">
          <SubscriptionManager type="organizer" />
        </div>
      </main>
    </div>
  );
}

