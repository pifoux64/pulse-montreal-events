'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import FriendsEvents from '@/components/social/FriendsEvents';
import TrendingEvents from '@/components/social/TrendingEvents';
import EventInvitations from '@/components/social/EventInvitations';
import { Users, TrendingUp, Mail } from 'lucide-react';

export default function SocialPage() {
  const t = useTranslations('navigation.social');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'friends' | 'trending' | 'invitations'>('friends');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <ModernLoader />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/social');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-slate-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'friends'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            {t('myFriends')}
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'trending'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            {t('trending')}
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'invitations'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-5 h-5" />
            {t('invitations')}
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'friends' && <FriendsEvents />}
          {activeTab === 'trending' && <TrendingEvents />}
          {activeTab === 'invitations' && <EventInvitations />}
        </div>
      </main>
    </div>
  );
}
