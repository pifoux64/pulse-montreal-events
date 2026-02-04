'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Music, Clock, Eye, Accessibility, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { looksLikeHtml, sanitizeDescriptionHtml } from '@/lib/sanitizeHtml';

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
  const t = useTranslations('eventDetail');
  const locale = useLocale();
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

  const getDateLocale = () => {
    switch (locale) {
      case 'en': return 'en-CA';
      case 'es': return 'es-CA';
      default: return 'fr-CA';
    }
  };

  const formatSchedule = () => {
    const start = new Date(startAt);
    const dateLocale = getDateLocale();
    const startDate = start.toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal',
    });
    const startTime = start.toLocaleTimeString(dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal',
    });

    if (endAt) {
      const end = new Date(endAt);
      const endTime = end.toLocaleTimeString(dateLocale, {
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
        durationText = `${durationHours}${t('h')}`;
        if (durationMinutes > 0) {
          durationText += ` ${durationMinutes}${t('min')}`;
        }
      } else {
        durationText = `${durationMinutes}${t('min')}`;
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
            <h3 className="text-xl font-bold text-white">{t('description')}</h3>
            {expandedSections.description ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          {expandedSections.description && (
            <div className="px-6 pb-6">
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed [&_a]:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-300 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1">
                {[description, longDescription].filter(Boolean).map((text, i) => {
                  if (!text) return null;
                  const isHtml = looksLikeHtml(text);
                  const key = i === 0 ? 'desc' : 'longDesc';
                  if (isHtml) {
                    return (
                      <div
                        key={key}
                        className={i > 0 ? 'mt-4' : ''}
                        dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(text) }}
                      />
                    );
                  }
                  return (
                    <p key={key} className={i > 0 ? 'mt-4' : ''} style={{ whiteSpace: 'pre-line' }}>
                      {text}
                    </p>
                  );
                })}
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
              <h3 className="text-xl font-bold text-white">{t('lineup')}</h3>
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
            <h3 className="text-xl font-bold text-white">{t('schedule')}</h3>
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
              <div className="text-sm text-slate-400 mb-1">{t('date')}</div>
              <div className="text-white font-medium">{schedule.date}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">{t('time')}</div>
              <div className="text-white font-medium">{schedule.time}</div>
            </div>
            {schedule.duration && (
              <div>
                <div className="text-sm text-slate-400 mb-1">{t('estimatedDuration')}</div>
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
              <h3 className="text-xl font-bold text-white">{t('whatToExpect')}</h3>
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
                  <div className="text-sm text-slate-400 mb-2">{t('targetAudience')}</div>
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
                  <div className="text-sm text-slate-400 mb-1">{t('capacity')}</div>
                  <div className="text-white font-medium">
                    <Users className="w-4 h-4 inline mr-2" />
                    {maxCapacity.toLocaleString()} {t('people')}
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
              <h3 className="text-xl font-bold text-white">{t('accessibility')}</h3>
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
