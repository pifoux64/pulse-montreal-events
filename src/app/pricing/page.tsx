import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { Check, X, Crown, Sparkles, BarChart3, Upload, Star, Zap, Shield, Users, Calendar, MapPin } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricing');
  return {
    title: `${t('title')} - Pulse Montreal`,
    description: t('subtitle'),
  };
}

export default async function PricingPage() {
  const t = await getTranslations('pricing');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Plan BASIC */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-white/10 relative">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{t('basic')}</h2>
              <p className="text-slate-400">{t('basicDescription')}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">{t('free')}</span>
              </div>
              <p className="text-slate-400 mt-2">{t('forever')}</p>
            </div>

            <Link
              href="/publier"
              className="block w-full text-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors mb-8"
            >
              {t('startFree')}
            </Link>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('unlimitedEvents')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('customizableProfile')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('basicStats')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('aiClassification')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('onePromotion')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('unlimitedDrafts')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{t('mapCalendar')}</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">{t('detailedStats')}</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">{t('bulkImportICS')}</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-500">{t('unlimitedPromotions')}</span>
              </div>
            </div>
          </div>

          {/* Plan PRO */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-amber-400/50 relative overflow-hidden">
            {/* Badge "Populaire" */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              {t('popular')}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-3xl font-bold text-white">{t('pro')}</h2>
              </div>
              <p className="text-slate-300">{t('proDescription')}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">29$</span>
                <span className="text-xl text-slate-300 ml-2">CAD</span>
              </div>
              <p className="text-slate-300 mt-2">{t('perMonth')}</p>
            </div>

            <Link
              href="/publier"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-lg mb-8"
            >
              {t('upgradeToPro')}
            </Link>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('allBasic')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('detailedStatsPro')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('bulkImportICSPro')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('unlimitedPromotionsPro')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('prioritySupport')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('verifiedBadge')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{t('multiPlatform')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fonctionnalités détaillées */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t('featuresIncluded')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('eventManagement')}</h3>
              <p className="text-slate-300">
                {t('eventManagementDesc')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('maxVisibility')}</h3>
              <p className="text-slate-300">
                {t('maxVisibilityDesc')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('promotions')}</h3>
              <p className="text-slate-300">
                {t('promotionsDesc')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('statistics')}</h3>
              <p className="text-slate-300">
                {t('statisticsDesc')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('bulkImport')}</h3>
              <p className="text-slate-300">
                {t('bulkImportDesc')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('aiClassificationFeature')}</h3>
              <p className="text-slate-300">
                {t('aiClassificationDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t('faq')}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('faq1Question')}
              </h3>
              <p className="text-slate-300">
                {t('faq1Answer')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('faq2Question')}
              </h3>
              <p className="text-slate-300">
                {t('faq2Answer')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('faq3Question')}
              </h3>
              <p className="text-slate-300">
                {t('faq3Answer')}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('faq4Question')}
              </h3>
              <p className="text-slate-300">
                {t('faq4Answer')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center bg-gradient-to-r from-sky-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            {t('ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/publier"
              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
            >
              {t('createFreeAccount')}
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-slate-800/70 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold border border-white/10"
            >
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

