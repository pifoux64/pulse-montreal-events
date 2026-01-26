'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2, Copy, CheckCircle } from 'lucide-react';

interface EventAssistantProps {
  onResult?: (result: {
    title: string;
    description: string;
    shortDescription: string;
    tags: string[];
    musicGenres?: string[];
    eventType?: string;
    ambiance?: string;
    targetAudience?: string;
    suggestedPrice?: number;
  }) => void;
}

export default function EventAssistant({ onResult }: EventAssistantProps) {
  const [input, setInput] = useState('');
  const [eventType, setEventType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError(t('describeError'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/event-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: input,
          eventType: eventType || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('error'));
      }

      const data = await response.json();
      setResult(data);
      if (onResult) {
        onResult(data);
      }
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">{t('title')}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('describeEvent')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder={t('describePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('eventType')}
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t('selectType')}</option>
            <option value="concert">Concert</option>
            <option value="dj_set">DJ Set</option>
            <option value="festival">Festival</option>
            <option value="soiree_club">Soirée Club</option>
            <option value="theatre">Théâtre</option>
            <option value="exposition">Exposition</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('generate')}
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">{t('titleLabel')}</label>
                <button
                  onClick={() => handleCopy(result.title, 'title')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'title' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white font-semibold">{result.title}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">{t('shortDescription')}</label>
                <button
                  onClick={() => handleCopy(result.shortDescription, 'short')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'short' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white">{result.shortDescription}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">{t('fullDescription')}</label>
                <button
                  onClick={() => handleCopy(result.description, 'description')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'description' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white whitespace-pre-wrap">{result.description}</p>
            </div>

            {result.tags && result.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">{t('tags')}</label>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-sky-600/30 text-sky-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.musicGenres && result.musicGenres.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">{t('musicGenres')}</label>
                <div className="flex flex-wrap gap-2">
                  {result.musicGenres.map((genre: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-600/30 text-emerald-300 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {result.eventType && (
                <div>
                  <label className="text-xs text-slate-400">{t('type')}</label>
                  <p className="text-white">{result.eventType}</p>
                </div>
              )}
              {result.ambiance && (
                <div>
                  <label className="text-xs text-slate-400">{t('ambiance')}</label>
                  <p className="text-white">{result.ambiance}</p>
                </div>
              )}
              {result.targetAudience && (
                <div>
                  <label className="text-xs text-slate-400">{t('audience')}</label>
                  <p className="text-white">{result.targetAudience}</p>
                </div>
              )}
              {result.suggestedPrice && (
                <div>
                  <label className="text-xs text-slate-400">{t('suggestedPrice')}</label>
                  <p className="text-white">{result.suggestedPrice.toFixed(2)} $</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
