'use client';

/**
 * Wrapper pour HomePage qui gère useSearchParams correctement
 * Nécessaire car useSearchParams doit être dans un Suspense boundary
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HomePage from './HomePage';

function HomePageWithSearchParams() {
  const searchParams = useSearchParams();
  return <HomePage searchParams={searchParams} />;
}

export default function HomePageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-slate-300">Chargement...</p>
          </div>
        </div>
      }
    >
      <HomePageWithSearchParams />
    </Suspense>
  );
}
