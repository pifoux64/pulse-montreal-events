'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function AuthErrorContent() {
  const t = useTranslations('auth.error');
  const tErrors = useTranslations('errors');
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const errorMessages: Record<string, string> = {
    Configuration: t('configuration'),
    AccessDenied: t('accessDenied'),
    Verification: t('verification'),
    OAuthSignin: t('oauthSignin'),
    OAuthCallback: t('oauthCallback'),
    OAuthCreateAccount: t('oauthCreateAccount'),
    EmailCreateAccount: t('emailCreateAccount'),
    Callback: t('callback'),
    OAuthAccountNotLinked: t('oauthAccountNotLinked'),
    EmailSignin: t('emailSignin'),
    CredentialsSignin: t('credentialsSignin'),
    SessionRequired: t('sessionRequired'),
    Default: t('default'),
  };
  
  const message = errorMessages[error] || errorMessages.Default;
  
  // Afficher des informations de débogage si l'erreur est undefined
  const isUndefinedError = error === 'undefined' || error === 'Default';
  const showDebugInfo = isUndefinedError && typeof window !== 'undefined';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            
            {showDebugInfo && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-left">
                <p className="text-sm text-yellow-400 font-semibold mb-2">💡 {t('debugInfo')}:</p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>{t('debugCheck1')}</li>
                  <li>{t('debugCheck2')}</li>
                  <li>{t('debugCheck3')}</li>
                  <li>{t('debugCheck4')}</li>
                </ul>
              </div>
            )}
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                {tErrors('tryAgain')}
              </Link>
              <Link
                href="/"
                className="block w-full bg-white/10 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {tErrors('goHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}

