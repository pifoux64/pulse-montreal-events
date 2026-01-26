'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Music, Clock, Eye, Accessibility, Users } from 'lucide-react';

interface EventDescriptionStructuredProps {
  description?: string | null;
  longDescription?: string | null;
  lineup?: string[] | null;
  startAt: Date;
  endAt?: Date | null;
  accessibility?: string[] | null;
  targetAudience?: string[] | null;
  maxCapacity?: number | null;
}

export default function EventDescriptionStructured({
  description,
  longDescription,
  lineup,
  startAt,
  endAt,
  accessibility,
  targetAudience,
  maxCapacity,
}: EventDescriptionStructuredProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    lineup: false,
    schedule: false,
    whatToExpect: false,
    accessibility: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatSchedule = () => {
    const start = new Date(startAt);
    const startDate = start.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal',
    });
    const startTime = start.toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal',
    });

    if (endAt) {
      const end = new Date(endAt);
      const endTime = end.toLocaleTimeString('fr-CA', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Montreal',
      });
      
      // Calculer la durée
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let durationText = '';
      if (durationHours > 0) {
        durationText = `${durationHours}h`;
        if (durationMinutes > 0) {
          durationText += ` ${durationMinutes}min`;
        }
      } else {
        durationText = `${durationMinutes}min`;
      }

      return {
        date: startDate,
        time: `${startTime} - ${endTime}`,
        duration: durationText,
      };
    }

    return {
      date: startDate,
      time: startTime,
      duration: null,
    };
  };

  const schedule = formatSchedule();

  const hasContent = description || longDescription || (lineup && lineup.length > 0) || accessibility || targetAudience;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Description principale */}
      {(description || longDescription) && (
        <div className="border-b border-white/10">
          <button
            onClick={() => toggleSection('description')}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <h3 className="text-xl font-bold text-white">Description</h3>
            {expandedSections.description ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          {expandedSections.description && (
            <div className="px-6 pb-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {longDescription || description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line-up */}
      {lineup && lineup.length > 0 && (
        <div className="border-b border-white/10">
          <button
            onClick={() => toggleSection('lineup')}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Line-up</h3>
            </div>
            {expandedSections.lineup ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          {expandedSections.lineup && (
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-3">
                {lineup.map((artist, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-white"
                  >
                    {artist}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      <div className="border-b border-white/10">
        <button
          onClick={() => toggleSection('schedule')}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Horaires</h3>
          </div>
          {expandedSections.schedule ? (
            <ChevronUp className="w-5 h-5 text-white/70" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/70" />
          )}
        </button>
        {expandedSections.schedule && (
          <div className="px-6 pb-6 space-y-3">
            <div>
              <div className="text-sm text-slate-400 mb-1">Date</div>
              <div className="text-white font-medium">{schedule.date}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Heure</div>
              <div className="text-white font-medium">{schedule.time}</div>
            </div>
            {schedule.duration && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Durée estimée</div>
                <div className="text-white font-medium">{schedule.duration}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* What to expect */}
      {(targetAudience || maxCapacity) && (
        <div className="border-b border-white/10">
          <button
            onClick={() => toggleSection('whatToExpect')}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-green-400" />
              <h3 className="text-xl font-bold text-white">À quoi s'attendre</h3>
            </div>
            {expandedSections.whatToExpect ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          {expandedSections.whatToExpect && (
            <div className="px-6 pb-6 space-y-4">
              {targetAudience && targetAudience.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Public cible</div>
                  <div className="flex flex-wrap gap-2">
                    {targetAudience.map((audience, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-white"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {maxCapacity && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Capacité</div>
                  <div className="text-white font-medium">
                    <Users className="w-4 h-4 inline mr-2" />
                    {maxCapacity.toLocaleString()} personnes
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Accessibility */}
      {accessibility && accessibility.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('accessibility')}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Accessibility className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Accessibilité</h3>
            </div>
            {expandedSections.accessibility ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          {expandedSections.accessibility && (
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {accessibility.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
