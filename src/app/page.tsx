import { Suspense } from 'react';
import HomePageContent from '@/components/HomePageContent';

// ISR: Revalider la page toutes les 2 minutes
export const revalidate = 120;

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-slate-300">Chargement de Pulse Montréal...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
