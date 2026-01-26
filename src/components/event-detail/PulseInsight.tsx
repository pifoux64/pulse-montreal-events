'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Music, Users, Zap, Clock, Accessibility } from 'lucide-react';
import Link from 'next/link';
import EventTagsDisplay, { EventTag } from '../EventTagsDisplay';

interface PulseInsightData {
  summary: string;
  musicStyle?: string;
  vibe: string;
  expectedAudience: string;
  intensity: 'chill' | 'moderate' | 'high' | 'very_high';
  danceLevel?: 'none' | 'low' | 'medium' | 'high';
  culturalContext?: string;
  tags: Array<{
    category: 'genre' | 'ambiance' | 'time' | 'crowd' | 'accessibility';
    value: string;
    label: string;
  }>;
}

interface PulseInsightProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string | null;
  eventCategory?: string | null;
  eventTags?: Array<{ category: string; value: string }> | null;
  venue?: { name?: string | null; neighborhood?: string | null } | null;
  organizer?: { displayName?: string | null } | null;
  lineup?: string[] | null;
  fallbackTags?: string[] | null;
}

const intensityLabels = {
  chill: 'Chill',
  moderate: 'Modéré',
  high: 'Intense',
  very_high: 'Très intense',
};

const danceLevelLabels = {
  none: 'Pas de danse',
  low: 'Danse légère',
  medium: 'Danse modérée',
  high: 'Danse intense',
};

export default function PulseInsight({
  eventId,
  eventTitle,
  eventDescription,
  eventCategory,
  eventTags,
  venue,
  organizer,
  lineup,
  fallbackTags,
}: PulseInsightProps) {
  const [insight, setInsight] = useState<PulseInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/ai/pulse-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            title: eventTitle,
            description: eventDescription,
            category: eventCategory,
            tags: fallbackTags || [],
            eventTags: eventTags || [],
            venue: venue ? { name: venue.name, neighborhood: venue.neighborhood } : null,
            organizer: organizer ? { displayName: organizer.displayName } : null,
            lineup: lineup || [],
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de l\'insight');
        }

        const data = await response.json();
        setInsight(data);
      } catch (err: any) {
        console.error('Erreur fetch Pulse Insight:', err);
        setError(err.message || 'Impossible de charger l\'insight');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [eventId, eventTitle, eventDescription, eventCategory, eventTags, venue, organizer, lineup, fallbackTags]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Pulse Insight</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Pulse Insight</h2>
        </div>
        <p className="text-slate-400">
          {error || 'Insight non disponible pour le moment'}
        </p>
      </div>
    );
  }

  // Convertir les tags de l'insight en format EventTag pour EventTagsDisplay
  const displayTags: EventTag[] = insight.tags.map((tag, index) => ({
    id: `insight-${index}`,
    category: tag.category === 'genre' ? 'genre' : tag.category === 'ambiance' ? 'ambiance' : 'public',
    value: tag.value,
  }));

  return (
    <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Pulse Insight</h2>
        <span className="text-xs px-2 py-1 bg-purple-500/30 text-purple-200 rounded-full">
          IA
        </span>
      </div>

      {/* Résumé principal */}
      <div className="mb-6">
        <p className="text-lg text-white/90 leading-relaxed">{insight.summary}</p>
      </div>

      {/* Détails structurés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {insight.musicStyle && (
          <div className="flex items-start gap-3">
            <Music className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-400 mb-1">Style musical</div>
              <div className="text-white font-medium">{insight.musicStyle}</div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <div className="text-sm text-slate-400 mb-1">Ambiance</div>
            <div className="text-white font-medium">{insight.vibe}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <div className="text-sm text-slate-400 mb-1">Public attendu</div>
            <div className="text-white font-medium">{insight.expectedAudience}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-orange-400 mt-0.5" />
          <div>
            <div className="text-sm text-slate-400 mb-1">Intensité</div>
            <div className="text-white font-medium">{intensityLabels[insight.intensity]}</div>
          </div>
        </div>

        {insight.danceLevel && (
          <div className="flex items-start gap-3">
            <Music className="w-5 h-5 text-pink-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-400 mb-1">Niveau de danse</div>
              <div className="text-white font-medium">{danceLevelLabels[insight.danceLevel]}</div>
            </div>
          </div>
        )}
      </div>

      {/* Contexte culturel */}
      {insight.culturalContext && (
        <div className="mb-6 p-4 bg-black/20 rounded-lg border border-white/10">
          <div className="text-sm text-slate-400 mb-2">Contexte montréalais</div>
          <p className="text-white/90">{insight.culturalContext}</p>
        </div>
      )}

      {/* Tags visuels cliquables */}
      {displayTags.length > 0 && (
        <div>
          <div className="text-sm text-slate-400 mb-3">Découvrir par</div>
          <EventTagsDisplay eventTags={displayTags} />
        </div>
      )}
    </div>
  );
}
