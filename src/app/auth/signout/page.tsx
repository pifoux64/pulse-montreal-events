'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import { LogOut, Loader2 } from 'lucide-react';

export default function SignOutPage() {
  const t = useTranslations('auth.signOut');
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ callbackUrl: '/' });
    };
    handleSignOut();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl text-center">
          <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-slate-300">{t('redirecting')}</p>
        </div>
      </div>
    </div>
  );
}

