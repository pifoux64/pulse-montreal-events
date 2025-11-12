import { Suspense } from 'react';
import OptimizedHomePage from '@/components/OptimizedHomePage';

// ISR: Revalider la page toutes les 2 minutes
export const revalidate = 120;

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
          Chargement de Pulse Montréal...
        </div>
      }
    >
      <OptimizedHomePage />
    </Suspense>
  );
}