'use client';

import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyRequestPage() {
  const t = useTranslations('auth.verifyRequest');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-slate-300 mb-4">
              {t('linkSent')}
            </p>
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300 space-y-2">
                  <p>1. {t('step1')}</p>
                  <p>2. {t('step2')}</p>
                  <p>3. {t('step3')}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              {t('expires')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

