'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'Il y a un problème avec la configuration du serveur. Vérifiez que les variables d\'environnement sont correctement configurées.',
  AccessDenied: 'Vous n\'avez pas l\'autorisation d\'accéder à cette page.',
  Verification: 'Le lien de vérification a expiré ou a déjà été utilisé.',
  OAuthSignin: 'Erreur lors de la connexion OAuth. Vérifiez que Google OAuth est correctement configuré.',
  OAuthCallback: 'Erreur lors du callback OAuth. Vérifiez les URLs de redirection dans Google Cloud Console.',
  OAuthCreateAccount: 'Impossible de créer le compte. Vérifiez la configuration de la base de données.',
  EmailCreateAccount: 'Impossible de créer le compte avec cet email.',
  Callback: 'Erreur lors du callback d\'authentification.',
  OAuthAccountNotLinked: 'Un compte existe déjà avec cette adresse email. Connectez-vous avec votre méthode habituelle.',
  EmailSignin: 'Erreur lors de l\'envoi de l\'email de connexion.',
  CredentialsSignin: 'Les identifiants fournis sont incorrects.',
  SessionRequired: 'Vous devez être connecté pour accéder à cette page.',
  Default: 'Une erreur inattendue est survenue. Si le problème persiste, vérifiez la configuration OAuth.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
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
            <h1 className="text-2xl font-bold text-white mb-2">Erreur d'authentification</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            
            {showDebugInfo && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-left">
                <p className="text-sm text-yellow-400 font-semibold mb-2">💡 Informations de débogage:</p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Vérifiez que GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont configurés dans Vercel</li>
                  <li>Vérifiez que NEXTAUTH_URL correspond à votre domaine (https://pulse-event.ca)</li>
                  <li>Vérifiez les URLs de redirection dans Google Cloud Console</li>
                  <li>Consultez le guide: docs/GOOGLE_OAUTH_SETUP.md</li>
                </ul>
              </div>
            )}
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

