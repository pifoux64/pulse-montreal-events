'use client';

/**
 * Composant pour tracker les landing views depuis les liens partagés
 * Sprint V1: Instrumentation
 */

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackLandingView } from '@/lib/analytics/tracking';

function LandingViewTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier les paramètres UTM
    const source = searchParams.get('utm_source');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');

    // Si on a des paramètres UTM, c'est probablement un lien partagé
    if (source || medium || campaign) {
      trackLandingView({
        path: pathname,
        source: source || undefined,
        medium: medium || undefined,
        campaign: campaign || undefined,
      });
    }
  }, [pathname, searchParams]);

  return null; // Ce composant ne rend rien
}

export default function LandingViewTracker() {
  return (
    <Suspense fallback={null}>
      <LandingViewTrackerContent />
    </Suspense>
  );
}

