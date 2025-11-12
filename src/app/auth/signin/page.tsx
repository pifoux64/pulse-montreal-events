'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Mail, Loader2 } from 'lucide-react';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setError(
        errorParam === 'CredentialsSignin'
          ? 'Identifiants invalides'
          : errorParam === 'EmailSignin'
          ? 'Erreur lors de l\'envoi de l\'email'
          : 'Une erreur est survenue lors de la connexion'
      );
    }
  }, [errorParam]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Messages d'erreur plus spécifiques
        const errorMessage = result.error === 'EmailSigninError'
          ? 'Erreur lors de l\'envoi de l\'email. Vérifiez que le serveur email est configuré.'
          : result.error === 'Configuration'
          ? 'Erreur de configuration. Contactez l\'administrateur.'
          : 'Erreur lors de l\'envoi de l\'email. Vérifiez votre adresse.';
        setError(errorMessage);
      } else {
        setIsEmailSent(true);
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      const errorMessage = err?.message?.includes('EMAIL_SERVER')
        ? 'Le serveur email n\'est pas configuré. Contactez l\'administrateur.'
        : err?.message?.includes('ECONNREFUSED')
        ? 'Impossible de se connecter au serveur email.'
        : 'Une erreur est survenue. Veuillez réessayer.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('google', { callbackUrl, redirect: false });
      if (result?.error) {
        const errorMessage = result.error === 'OAuthSignin'
          ? 'Erreur lors de la connexion Google. Vérifiez que Google OAuth est configuré.'
          : result.error === 'OAuthCallback'
          ? 'Erreur lors du callback Google.'
          : 'Erreur lors de la connexion Google.';
        setError(errorMessage);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Erreur Google OAuth:', err);
      setError('Erreur lors de la connexion Google. Vérifiez la configuration.');
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h1>
              <p className="text-slate-300 mb-6">
                Un lien de connexion a été envoyé à <strong className="text-white">{email}</strong>
              </p>
              <p className="text-sm text-slate-400">
                Cliquez sur le lien dans l'email pour vous connecter. Le lien expire dans 24 heures.
              </p>
              <button
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail('');
                }}
                className="mt-6 text-sky-400 hover:text-sky-300 text-sm font-medium"
              >
                Utiliser une autre adresse
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
            <p className="text-slate-300">Connectez-vous pour accéder à vos favoris et plus encore</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Envoyer un lien de connexion
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-950 text-slate-400">Ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white/10 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            En vous connectant, vous acceptez nos{' '}
            <a href="/terms" className="text-sky-400 hover:text-sky-300">
              conditions d'utilisation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

