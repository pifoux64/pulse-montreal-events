'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ChevronRight, ChevronLeft, Music, Calendar, Heart, MapPin, Clock, X } from 'lucide-react';
import { GENRES, MAIN_CATEGORIES, AMBIANCES } from '@/lib/tagging/taxonomy';

// Options pour chaque étape - Utilisation de la taxonomie uniforme
// Genres musicaux principaux (sélection des plus populaires pour l'onboarding)
const MUSIC_GENRES = [
  { id: 'rock' },
  { id: 'indie' },
  { id: 'hip_hop' },
  { id: 'reggae' },
  { id: 'electronic' },
  { id: 'techno' },
  { id: 'jazz' },
  { id: 'afrobeat' },
  { id: 'pop' },
  { id: 'heavy_metal' },
  { id: 'latin' },
  { id: 'funk' },
  { id: 'soul' },
  { id: 'rnb' },
] as const;

const EVENT_CATEGORIES = [
  { id: 'culture' },
  { id: 'family' },
  { id: 'sport' },
  { id: 'nightlife' },
  { id: 'festivals' },
  { id: 'community' },
  { id: 'wellness' },
  { id: 'talks' },
];

const VIBES = [
  { id: 'chill' },
  { id: 'dancing' },
  { id: 'underground' },
  { id: 'festive' },
  { id: 'intimate' },
  { id: 'political' },
  { id: 'alternative' },
  { id: 'mainstream' },
];

const PREFERRED_DAYS = [
  { id: 'weekday' },
  { id: 'weekend' },
];

const PREFERRED_TIMES = [
  { id: 'day' },
  { id: 'evening' },
  { id: 'night' },
];

export default function OnboardingClient() {
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État des sélections
  const [musicPreferences, setMusicPreferences] = useState<string[]>([]);
  const [categoryPreferences, setCategoryPreferences] = useState<string[]>([]);
  const [vibePreferences, setVibePreferences] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [preferredNeighborhoods, setPreferredNeighborhoods] = useState<string[]>([]);

  const totalSteps = 4;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/onboarding');
    }
  }, [status, router]);

  const toggleSelection = (
    id: string,
    selected: string[],
    setSelected: (value: string[]) => void
  ) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await savePreferences(true);
  };

  const savePreferences = async (skip: boolean = false) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/preferences/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicPreferences: skip ? [] : musicPreferences,
          categoryPreferences: skip ? [] : categoryPreferences,
          vibePreferences: skip ? [] : vibePreferences,
          preferredDays: skip ? [] : preferredDays,
          preferredTimes: skip ? [] : preferredTimes,
          preferredNeighborhoods: skip ? [] : preferredNeighborhoods,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || tCommon('error'));
      }

      router.push('/pour-toi');
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    await savePreferences(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-8 border border-white/10">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <span className="text-sm text-slate-400">
            {t('step', { current: currentStep, total: totalSteps })}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Step 1: Music Genres */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">{t('step1.title')}</h2>
          </div>
          <p className="text-slate-400 mb-6">
            {t('step1.description')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MUSIC_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => toggleSelection(genre.id, musicPreferences, setMusicPreferences)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  musicPreferences.includes(genre.id)
                    ? 'border-sky-500 bg-sky-500/20 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t(`genres.${genre.id}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Event Categories */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">{t('step2.title')}</h2>
          </div>
          <p className="text-slate-400 mb-6">
            {t('step2.description')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {EVENT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleSelection(category.id, categoryPreferences, setCategoryPreferences)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  categoryPreferences.includes(category.id)
                    ? 'border-sky-500 bg-sky-500/20 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t(`categories.${category.id}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Vibes */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">{t('step3.title')}</h2>
          </div>
          <p className="text-slate-400 mb-6">
            {t('step3.description')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {VIBES.map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => toggleSelection(vibe.id, vibePreferences, setVibePreferences)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  vibePreferences.includes(vibe.id)
                    ? 'border-sky-500 bg-sky-500/20 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t(`vibes.${vibe.id}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Optional Preferences */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">{t('step4.title')}</h2>
          </div>
          <p className="text-slate-400 mb-6">
            {t('step4.description')}
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">{t('step4.preferredDays')}</h3>
              <div className="flex gap-3">
                {PREFERRED_DAYS.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => toggleSelection(day.id, preferredDays, setPreferredDays)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      preferredDays.includes(day.id)
                        ? 'border-sky-500 bg-sky-500/20 text-white'
                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t(`step4.${day.id}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">{t('step4.preferredTimes')}</h3>
              <div className="flex gap-3">
                {PREFERRED_TIMES.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => toggleSelection(time.id, preferredTimes, setPreferredTimes)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      preferredTimes.includes(time.id)
                        ? 'border-sky-500 bg-sky-500/20 text-white'
                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t(`step4.${time.id}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('previous')}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="px-4 py-2 text-slate-400 hover:text-slate-300 disabled:opacity-50"
          >
            {t('skip')}
          </button>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
            >
              {t('next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  {t('finish')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

