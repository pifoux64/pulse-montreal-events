'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EventFormData, EventCategory } from '@/types';
import Navigation from '@/components/Navigation';
import EventForm from '@/components/EventForm';
import ModernLoader from '@/components/ModernLoader';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { EventCategory as PrismaEventCategory, EventLanguage } from '@prisma/client';

// Données de test pour les catégories
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#e74c3c',
    subCategories: [
      { id: '1-1', name: 'Reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-2', name: 'Jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-3', name: 'Rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-4', name: 'Électronique', nameEn: 'Electronic', categoryId: '1' },
      { id: '1-5', name: 'Pop', nameEn: 'Pop', categoryId: '1' },
      { id: '1-6', name: 'Hip-hop', nameEn: 'Hip-hop', categoryId: '1' },
      { id: '1-7', name: 'Rap', nameEn: 'Rap', categoryId: '1' },
      { id: '1-8', name: 'Classique', nameEn: 'Classical', categoryId: '1' },
      { id: '1-9', name: 'Indie', nameEn: 'Indie', categoryId: '1' },
      { id: '1-10', name: 'Folk', nameEn: 'Folk', categoryId: '1' },
      { id: '1-11', name: 'Blues', nameEn: 'Blues', categoryId: '1' },
      { id: '1-12', name: 'Metal', nameEn: 'Metal', categoryId: '1' },
      { id: '1-13', name: 'R&B / Soul', nameEn: 'R&B / Soul', categoryId: '1' },
      { id: '1-14', name: 'Country', nameEn: 'Country', categoryId: '1' },
      { id: '1-15', name: 'Latino', nameEn: 'Latin', categoryId: '1' },
      { id: '1-16', name: 'Musique du monde', nameEn: 'World Music', categoryId: '1' },
      { id: '1-17', name: 'Ambient / Chill', nameEn: 'Ambient / Chill', categoryId: '1' },
      { id: '1-18', name: 'House & Techno', nameEn: 'House & Techno', categoryId: '1' },
      { id: '1-19', name: 'Chorale / Vocal', nameEn: 'Choir / Vocal', categoryId: '1' },
      { id: '1-20', name: 'Expérimental', nameEn: 'Experimental', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Art & Culture',
    nameEn: 'Art & Culture',
    icon: '🎨',
    color: '#9b59b6',
    subCategories: [
      { id: '2-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: '2' },
      { id: '2-2', name: 'Théâtre', nameEn: 'Theater', categoryId: '2' },
      { id: '2-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Sport',
    nameEn: 'Sports',
    icon: '⚽',
    color: '#3498db',
    subCategories: [
      { id: '3-1', name: 'Football', nameEn: 'Soccer', categoryId: '3' },
      { id: '3-2', name: 'Basketball', nameEn: 'Basketball', categoryId: '3' },
      { id: '3-3', name: 'Course', nameEn: 'Running', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Famille',
    nameEn: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f39c12',
    subCategories: [
      { id: '4-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: '4' },
      { id: '4-2', name: 'Parcs', nameEn: 'Parks', categoryId: '4' },
      { id: '4-3', name: 'Éducation', nameEn: 'Education', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Gastronomie',
    nameEn: 'Food & Drink',
    icon: '🍽️',
    color: '#e67e22',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
    ]
  }
];

// Mapping des catégories du frontend vers Prisma (enum: MUSIC, THEATRE, EXHIBITION, FAMILY, SPORT, NIGHTLIFE, EDUCATION, COMMUNITY, OTHER)
const mapCategoryToPrisma = (category: string): PrismaEventCategory => {
  const mapping: Record<string, PrismaEventCategory> = {
    'Musique': PrismaEventCategory.MUSIC,
    'Art & Culture': PrismaEventCategory.THEATRE,
    'Sport': PrismaEventCategory.SPORT,
    'Famille': PrismaEventCategory.FAMILY,
    'Gastronomie': PrismaEventCategory.OTHER,
  };
  return mapping[category] ?? PrismaEventCategory.OTHER;
};

export default function PublierPage() {
  const t = useTranslations('publish');
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [needsOrganizerProfile, setNeedsOrganizerProfile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/publier');
      return;
    }

    if (status === 'authenticated') {
      const checkOrganizer = async () => {
        try {
          const res = await fetch('/api/organizers/me', { cache: 'no-store' });
          if (res.ok) {
            setNeedsOrganizerProfile(false);
          } else if (res.status === 404) {
            setNeedsOrganizerProfile(true);
          } else {
            setNeedsOrganizerProfile(true);
          }
        } catch {
          setNeedsOrganizerProfile(true);
        } finally {
          setIsLoading(false);
        }
      };

      checkOrganizer();
    }
  }, [status, router]);

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');
    
    try {
      // Transformer les données du formulaire au format API
      const apiData = {
        title: data.title,
        description: data.description,
        longDescription: data.longDescription || undefined, // SPRINT 4
        lineup: data.lineup && data.lineup.length > 0 ? data.lineup : undefined, // SPRINT 4
        startAt: new Date(data.startDate).toISOString(),
        endAt: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        venue: {
          name: data.location.name,
          address: data.location.address,
          city: data.location.city,
          postalCode: data.location.postalCode,
          neighborhood: undefined, // Sera calculé automatiquement
        },
        url: data.ticketUrl || undefined,
        sourceUrl: data.sourceUrl || undefined, // URL source de l'import
        priceMin: data.price.isFree ? 0 : Math.round(data.price.amount * 100), // Convertir en cents
        priceMax: data.price.isFree ? 0 : Math.round(data.price.amount * 100),
        currency: data.price.currency || 'CAD',
        language: data.language === 'fr' ? EventLanguage.FR : EventLanguage.EN,
        imageUrl: data.imageUrl || undefined,
        tags: data.tags || [],
        category: mapCategoryToPrisma(data.category),
        subcategory: data.subCategory || undefined,
        accessibility: [
          ...(data.accessibility.wheelchairAccessible ? ['wheelchair'] : []),
          ...(data.accessibility.hearingAssistance ? ['hearing_aid'] : []),
          ...(data.accessibility.visualAssistance ? ['visual_aid'] : []),
          ...(data.accessibility.quietSpace ? ['quiet_space'] : []),
        ],
        ageRestriction: undefined,
        musicUrls: data.musicUrls,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || t('publishError');
        const details = errorData.details;
        const detailStr = Array.isArray(details) && details.length > 0
          ? details.map((d: { path?: string[]; message?: string }) => `${d.path?.join('.') || '?'}: ${d.message || ''}`).join('; ')
          : '';
        throw new Error(detailStr ? `${msg} (${detailStr})` : msg);
      }

      const createdEvent = await response.json();
      
      setSubmitStatus('success');
      setSubmitMessage(t('eventPublished'));
      
      // Redirection après 3 secondes vers la page de l'événement
      setTimeout(() => {
        router.push(`/evenement/${createdEvent.id}`);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur lors de la publication:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.message || t('publishError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm(t('cancelConfirm'))) {
      window.location.href = '/';
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900 flex items-center justify-center">
        <ModernLoader />
      </div>
    );
  }

  if (needsOrganizerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-8 text-center space-y-6">
            <h1 className="text-3xl font-semibold text-white">
              {t('createOrganizerProfile')}
            </h1>
            <p className="text-slate-300">
              {t('organizerProfileRequired')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/organisateur/mon-profil')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
              >
                {t('createProfile')}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 transition"
              >
                {t('backToHome')}
              </button>
            </div>
            <p className="text-sm text-slate-400">
              {t('organizerTip')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-sky-600 to-emerald-600 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* Message de statut */}
        {submitStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-xl ${
            submitStatus === 'success' 
              ? 'bg-green-500/20 border-green-400/50 text-green-200' 
              : 'bg-red-500/20 border-red-400/50 text-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {submitStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="font-medium">{submitMessage}</span>
            </div>
          </div>
        )}

        {/* Guide de publication */}
        <div className="bg-slate-800/70 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">
            💡 {t('successTips')}
          </h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start space-x-2">
              <span className="text-sky-400">•</span>
              <span>{t('tip1')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-sky-400">•</span>
              <span>{t('tip2')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-sky-400">•</span>
              <span>{t('tip3')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-sky-400">•</span>
              <span>{t('tip4')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-sky-400">•</span>
              <span>{t('tip5')}</span>
            </li>
          </ul>
        </div>

        {/* Formulaire */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10">
          <EventForm
            categories={mockCategories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">
            {t('faq')}
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2">
                {t('faq1Question')}
              </h4>
              <p className="text-slate-300">
                {t('faq1Answer')}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">
                {t('faq2Question')}
              </h4>
              <p className="text-slate-300">
                {t('faq2Answer')}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">
                {t('faq3Question')}
              </h4>
              <p className="text-slate-300">
                {t('faq3Answer')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
