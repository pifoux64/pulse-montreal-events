import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import ProfilClient from './profil-client';

// Marquer la page comme dynamique pour éviter les erreurs de build
export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const t = await getTranslations('common');
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          {t('loading')}
        </div>
      }
    >
      <ProfilClient />
    </Suspense>
  );
}


