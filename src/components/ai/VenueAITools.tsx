'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calendar, TrendingUp, Users, Loader2, AlertCircle, Lightbulb, Target } from 'lucide-react';
import Link from 'next/link';

interface VenueAIToolsProps {
  venueId: string;
}

export default function VenueAITools({ venueId }: VenueAIToolsProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'matching' | 'stats'>('suggestions');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [matching, setMatching] = useState<any>(null);
  const [occupationStats, setOccupationStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadOccupationStats();
    }
  }, [activeTab, venueId]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/venue-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setSuggestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatching = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/venue-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setMatching(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOccupationStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/occupation-stats`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setOccupationStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">Outils IA pour Salles</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => {
            setActiveTab('suggestions');
            if (!suggestions) loadSuggestions();
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-2" />
          Suggestions
        </button>
        <button
          onClick={() => {
            setActiveTab('matching');
            if (!matching) loadMatching();
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'matching'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Matching
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Stats
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
        </div>
      )}

      {/* Suggestions */}
      {activeTab === 'suggestions' && suggestions && !isLoading && (
        <div className="space-y-6">
          {/* Jours creux */}
          {suggestions.slowDays && suggestions.slowDays.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Jours creux identifiés
              </h4>
              <div className="space-y-3">
                {suggestions.slowDays.map((day: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-semibold text-white mb-2">{day.day}</div>
                    <p className="text-sm text-slate-300 mb-3">{day.reason}</p>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Suggestions :</p>
                      <ul className="space-y-1">
                        {day.suggestions.map((suggestion: string, j: number) => (
                          <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-sky-400 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Types d'événements manquants */}
          {suggestions.missingEventTypes && suggestions.missingEventTypes.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Types d'événements manquants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.missingEventTypes.map((type: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-semibold text-white mb-1">{type.type}</div>
                    <div className="text-xs text-sky-400 mb-2">Potentiel : {type.potential}</div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Exemples :</p>
                      <div className="flex flex-wrap gap-2">
                        {type.examples.map((example: string, j: number) => (
                          <span key={j} className="px-2 py-1 bg-sky-600/30 text-sky-300 rounded text-xs">
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {suggestions.recommendations && suggestions.recommendations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recommandations</h4>
              <ul className="space-y-2">
                {suggestions.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats rapides */}
          {suggestions.stats && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">Statistiques</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Total événements</div>
                  <div className="text-white font-semibold">{suggestions.stats.totalEvents}</div>
                </div>
                <div>
                  <div className="text-slate-400">Moyenne/semaine</div>
                  <div className="text-white font-semibold">{suggestions.stats.averagePerWeek}</div>
                </div>
                <div>
                  <div className="text-slate-400">Jours actifs</div>
                  <div className="text-white font-semibold">
                    {Object.values(suggestions.stats.dayDistribution || {}).filter((v: any) => v > 0).length}/7
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matching */}
      {activeTab === 'matching' && matching && !isLoading && (
        <div className="space-y-6">
          {/* Organisateurs compatibles */}
          {matching.compatibleOrganizers && matching.compatibleOrganizers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organisateurs compatibles
              </h4>
              <div className="space-y-3">
                {matching.compatibleOrganizers.map((org: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-white">{org.organizerName}</div>
                      <div className="px-3 py-1 bg-sky-600/30 text-sky-300 rounded-full text-sm font-medium">
                        {org.compatibilityScore}/100
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {org.pastEvents} événement(s) similaire(s)
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Raisons :</p>
                      <ul className="space-y-1">
                        {org.reasons.map((reason: string, j: number) => (
                          <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-sky-400 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/organisateur/${org.organizerId}`}
                      className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
                    >
                      Voir le profil →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepts similaires */}
          {matching.similarConcepts && matching.similarConcepts.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Concepts similaires performants</h4>
              <div className="space-y-3">
                {matching.similarConcepts.map((concept: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="font-semibold text-white mb-1">{concept.eventTitle}</div>
                    <div className="text-xs text-slate-400 mb-2">
                      {concept.venueName} • {concept.performance}
                    </div>
                    <p className="text-sm text-slate-300">{concept.whySimilar}</p>
                    <Link
                      href={`/evenement/${concept.eventId}`}
                      className="mt-2 inline-block text-sm text-sky-400 hover:text-sky-300"
                    >
                      Voir l'événement →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats d'occupation */}
      {activeTab === 'stats' && occupationStats && !isLoading && (
        <div className="space-y-6">
          {/* Taux d'occupation */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Taux d'occupation</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{occupationStats.occupancy.eventsPerWeek}</div>
                <div className="text-sm text-slate-400">Événements/semaine</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{occupationStats.occupancy.totalEvents}</div>
                <div className="text-sm text-slate-400">Total (6 mois)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{occupationStats.occupancy.upcomingEvents}</div>
                <div className="text-sm text-slate-400">À venir</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {occupationStats.occupancy.occupancyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400">Taux d'occupation</div>
              </div>
            </div>
          </div>

          {/* Tendances */}
          {occupationStats.trends && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Tendances (3 derniers mois)</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Événements</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{occupationStats.trends.events.current}</span>
                    {occupationStats.trends.events.change !== 0 && (
                      <span
                        className={`text-sm ${
                          occupationStats.trends.events.change > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {occupationStats.trends.events.change > 0 ? '+' : ''}
                        {occupationStats.trends.events.change} (
                        {occupationStats.trends.events.changePercent > 0 ? '+' : ''}
                        {occupationStats.trends.events.changePercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Favoris</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{occupationStats.trends.favorites.current}</span>
                    {occupationStats.trends.favorites.change !== 0 && (
                      <span
                        className={`text-sm ${
                          occupationStats.trends.favorites.change > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {occupationStats.trends.favorites.change > 0 ? '+' : ''}
                        {occupationStats.trends.favorites.change} (
                        {occupationStats.trends.favorites.changePercent > 0 ? '+' : ''}
                        {occupationStats.trends.favorites.changePercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Répartition par jour */}
          {occupationStats.distribution && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Répartition par jour</h4>
              <div className="space-y-2">
                {Object.entries(occupationStats.distribution.byDay || {}).map(([day, count]: [string, any]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-slate-300 capitalize">{day}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-sky-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(occupationStats.distribution.byDay))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top catégories */}
          {occupationStats.performance && occupationStats.performance.topCategories && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Top catégories</h4>
              <div className="space-y-2">
                {occupationStats.performance.topCategories.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-300">{cat.category}</span>
                    <span className="text-white font-semibold">{cat.count} événement(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message si aucune donnée */}
      {!isLoading && !error && activeTab === 'suggestions' && !suggestions && (
        <div className="text-center py-8 text-slate-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Cliquez sur l'onglet pour charger les suggestions</p>
        </div>
      )}
      {!isLoading && !error && activeTab === 'matching' && !matching && (
        <div className="text-center py-8 text-slate-400">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Cliquez sur l'onglet pour charger les matchings</p>
        </div>
      )}
    </div>
  );
}
