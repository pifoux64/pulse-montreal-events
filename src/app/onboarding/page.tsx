import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import OnboardingClient from './onboarding-client';

export const metadata: Metadata = {
  title: 'Onboarding - Pulse Montreal',
  description: 'Configurez vos préférences pour des recommandations personnalisées',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <OnboardingClient />
      </main>
    </div>
  );
}

