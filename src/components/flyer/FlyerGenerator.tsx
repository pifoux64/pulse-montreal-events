'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Download, RefreshCw, Image as ImageIcon, QrCode } from 'lucide-react';

export type FlyerFormat = 'story' | 'square' | 'cover';
export type FlyerStyle = 'reggae' | 'techno' | 'family' | 'culture' | 'minimal';

interface FlyerGeneratorProps {
  eventId: string;
  eventTitle: string;
}

export default function FlyerGenerator({ eventId, eventTitle }: FlyerGeneratorProps) {
  const t = useTranslations('flyer');
  const [format, setFormat] = useState<FlyerFormat>('square');
  const [stylePreset, setStylePreset] = useState<FlyerStyle>('minimal');
  const [includeQR, setIncludeQR] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formats: Array<{ value: FlyerFormat; label: string; icon: string }> = [
    { value: 'story', label: t('formats.story'), icon: '📱' },
    { value: 'square', label: t('formats.square'), icon: '⬜' },
    { value: 'cover', label: t('formats.cover'), icon: '📄' },
  ];

  const styles: Array<{ value: FlyerStyle; label: string; description: string }> = [
    { value: 'reggae', label: t('styles.reggae'), description: t('styles.reggaeDesc') },
    { value: 'techno', label: t('styles.techno'), description: t('styles.technoDesc') },
    { value: 'family', label: t('styles.family'), description: t('styles.familyDesc') },
    { value: 'culture', label: t('styles.culture'), description: t('styles.cultureDesc') },
    { value: 'minimal', label: t('styles.minimal'), description: t('styles.minimalDesc') },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const response = await fetch('/api/flyer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          format,
          stylePreset,
          includeQR,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du flyer');
      }

      const data = await response.json();
      setGeneratedUrl(data.url);
    } catch (err: any) {
      console.error('Erreur génération flyer:', err);
      setError(err.message || 'Erreur lors de la génération du flyer');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedUrl;
    link.download = `flyer-${eventId}-${format}-${stylePreset}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sky-400" />
          {t('title')}
        </h3>
        <p className="text-slate-400 text-sm mb-6">{t('description')}</p>

        {/* Sélection du format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            {t('selectFormat')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setFormat(fmt.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  format === fmt.value
                    ? 'border-sky-400 bg-sky-400/10 text-white'
                    : 'border-white/20 bg-white/5 text-slate-400 hover:border-white/40 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-2">{fmt.icon}</div>
                <div className="text-sm font-medium">{fmt.label}</div>
                <div className="text-xs mt-1 opacity-75">
                  {fmt.value === 'story' && '1080×1920'}
                  {fmt.value === 'square' && '1080×1080'}
                  {fmt.value === 'cover' && '1200×628'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sélection du style */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            {t('selectStyle')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {styles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setStylePreset(style.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  stylePreset === style.value
                    ? 'border-purple-400 bg-purple-400/10 text-white'
                    : 'border-white/20 bg-white/5 text-slate-400 hover:border-white/40 hover:text-white'
                }`}
              >
                <div className="font-semibold mb-1">{style.label}</div>
                <div className="text-xs opacity-75">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Option QR Code */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeQR}
              onChange={(e) => setIncludeQR(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-sky-400 focus:ring-sky-400 focus:ring-offset-slate-900"
            />
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{t('includeQR')}</span>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1 ml-8">{t('includeQRDesc')}</p>
        </div>

        {/* Bouton générer */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-sky-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-sky-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              {t('generate')}
            </>
          )}
        </button>

        {/* Erreur */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Prévisualisation */}
        {generatedUrl && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">{t('preview')}</h4>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl hover:bg-green-500/30 transition-all text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                {t('download')}
              </button>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <img
                src={generatedUrl}
                alt={t('flyerPreview')}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-white/5 border border-white/20 text-white font-medium py-2 px-4 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('regenerate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
