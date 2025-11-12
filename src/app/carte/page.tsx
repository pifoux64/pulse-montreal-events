import { Suspense } from 'react';
import OptimizedCartePage from '@/components/OptimizedCartePage';

// ISR: Revalider la page toutes les 2 minutes
export const revalidate = 120;

export default function CartePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
          Chargement de la carte des événements...
        </div>
      }
    >
      <OptimizedCartePage />
    </Suspense>
  );
}