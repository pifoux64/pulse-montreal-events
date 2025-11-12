'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'Il y a un problème avec la configuration du serveur.',
  AccessDenied: 'Vous n\'avez pas l\'autorisation d\'accéder à cette page.',
  Verification: 'Le lien de vérification a expiré ou a déjà été utilisé.',
  Default: 'Une erreur inattendue est survenue.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Erreur d'authentification</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                Réessayer
              </Link>
              <Link
                href="/"
                className="block w-full bg-white/10 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
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

