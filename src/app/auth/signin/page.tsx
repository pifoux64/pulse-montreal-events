'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Mail, Loader2, Facebook, Instagram } from 'lucide-react';
import EmailInput from './EmailInput';

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

  const handleOAuthSignIn = async (provider: string, providerLabel: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn(provider, { callbackUrl, redirect: false });
      if (result?.error) {
        const errorMessage = result.error === 'OAuthSignin'
          ? `Erreur lors de la connexion ${providerLabel}. Vérifiez que ${providerLabel} OAuth est configuré.`
          : result.error === 'OAuthCallback'
          ? `Erreur lors du callback ${providerLabel}.`
          : `Erreur lors de la connexion ${providerLabel}.`;
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error(`Erreur ${providerLabel} OAuth:`, err);
      setError(`Erreur lors de la connexion ${providerLabel}. Vérifiez la configuration.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => handleOAuthSignIn('google', 'Google');
  const handleFacebookSignIn = () => handleOAuthSignIn('facebook', 'Facebook');
  const handleInstagramSignIn = () => handleOAuthSignIn('instagram', 'Instagram');
  const handleTiktokSignIn = () => handleOAuthSignIn('tiktok', 'TikTok');

  const socialButtons = [
    {
      label: 'Continuer avec Google',
      onClick: handleGoogleSignIn,
      icon: (
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
      ),
    },
    {
      label: 'Continuer avec Facebook',
      onClick: handleFacebookSignIn,
      icon: <Facebook className="w-5 h-5" />,
    },
    {
      label: 'Continuer avec Instagram',
      onClick: handleInstagramSignIn,
      icon: <Instagram className="w-5 h-5" />,
    },
    {
      label: 'Continuer avec TikTok',
      onClick: handleTiktokSignIn,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
          <path
            d="M28.5 14.5c2.1 2.4 4.6 3.7 7.9 3.9v7.2c-2.6.25-5-.35-7.9-1.85v8.95c0 6.6-4.05 10.7-10.45 10.7-4.3 0-7.9-2-9.95-5.7-.85-1.5-1.3-3.5-1.3-5.9 0-7.3 5.3-12.7 13.2-12.7 1.1 0 2.2.1 3.3.25v7.75c-.9-.35-1.8-.55-2.7-.55-3.1 0-5.4 2.35-5.4 5.6 0 3.45 2.3 5.75 5.5 5.75 1.8 0 3-.7 3.6-1.65.55-.85.8-2.2.8-4.1V6h8.4c.25 3.05 1.3 5.45 3.35 7.6 1.05 1.05 2.35 1.9 3.9 2.55v7.55c-2.3.05-4.4-.25-6.45-.95-1.9-.65-3.45-1.5-4.85-2.45v10.8c0 10.4-6.95 15.2-14.35 15.2-4.25 0-8.3-1.7-11.15-4.8-2.9-3.1-4.45-7.35-4.45-12.35 0-10.6 7.8-19 19.25-19 1.65 0 3.3.15 4.95.5Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 pt-24">
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
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 pt-24">
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
              <EmailInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="votre@email.com"
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

          <div className="space-y-3">
            {socialButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                disabled={isLoading}
                className="w-full bg-white/10 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

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

