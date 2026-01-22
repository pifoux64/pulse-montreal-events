'use client';

import { useState } from 'react';
import { FileText, Loader2, Copy, CheckCircle, Facebook, Instagram, Calendar } from 'lucide-react';

interface ContentGeneratorProps {
  eventTitle?: string;
  eventDescription?: string;
  eventDate?: string;
  eventLocation?: string;
  eventUrl?: string;
}

export default function ContentGenerator({
  eventTitle = '',
  eventDescription = '',
  eventDate = '',
  eventLocation = '',
  eventUrl = '',
}: ContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'facebook' | 'instagram'>('plan');

  const handleGenerate = async () => {
    if (!eventTitle || !eventDescription || !eventDate) {
      setError('Veuillez remplir au moins le titre, la description et la date');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/content-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle,
          eventDescription,
          eventDate,
          eventLocation: eventLocation || undefined,
          eventUrl: eventUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération');
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
        <FileText className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">Générateur de Contenu</h3>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !eventTitle || !eventDescription || !eventDate}
          className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Générer le plan de communication
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-white/10">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'plan'
                    ? 'text-sky-400 border-b-2 border-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Plan
              </button>
              <button
                onClick={() => setActiveTab('facebook')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'facebook'
                    ? 'text-sky-400 border-b-2 border-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Facebook className="w-4 h-4 inline mr-2" />
                Facebook
              </button>
              <button
                onClick={() => setActiveTab('instagram')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'instagram'
                    ? 'text-sky-400 border-b-2 border-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Instagram className="w-4 h-4 inline mr-2" />
                Instagram
              </button>
            </div>

            {/* Plan de communication */}
            {activeTab === 'plan' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Timeline</h4>
                  <div className="space-y-3">
                    {result.communicationPlan?.timeline?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-sky-400">{item.date}</span>
                          <span className="text-xs text-slate-400">{item.platform}</span>
                        </div>
                        <p className="text-white">{item.action}</p>
                        {item.content && (
                          <p className="text-sm text-slate-300 mt-2">{item.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Conseils</h4>
                  <ul className="space-y-2">
                    {result.communicationPlan?.tips?.map((tip: string, i: number) => (
                      <li key={i} className="text-slate-300 flex items-start gap-2">
                        <span className="text-sky-400 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Facebook */}
            {activeTab === 'facebook' && result.facebookPost && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Post Facebook</label>
                    <button
                      onClick={() => handleCopy(result.facebookPost.text, 'facebook')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied === 'facebook' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white whitespace-pre-wrap">{result.facebookPost.text}</p>
                  </div>
                </div>
                {result.facebookPost.suggestedImage && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Image suggérée</label>
                    <p className="text-slate-300 text-sm">{result.facebookPost.suggestedImage}</p>
                  </div>
                )}
              </div>
            )}

            {/* Instagram */}
            {activeTab === 'instagram' && result.instagramPost && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Légende Instagram</label>
                    <button
                      onClick={() => handleCopy(result.instagramPost.caption, 'instagram')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied === 'instagram' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white whitespace-pre-wrap">{result.instagramPost.caption}</p>
                  </div>
                </div>
                {result.instagramPost.hashtags && result.instagramPost.hashtags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Hashtags</label>
                    <div className="flex flex-wrap gap-2">
                      {result.instagramPost.hashtags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-emerald-600/30 text-emerald-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.instagramPost.suggestedImage && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Image suggérée</label>
                    <p className="text-slate-300 text-sm">{result.instagramPost.suggestedImage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
