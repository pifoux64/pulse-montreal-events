import { Suspense } from 'react';
import ProfilClient from './profil-client';

export default function ProfilPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Chargement du profil...
        </div>
      }
    >
      <ProfilClient />
    </Suspense>
  );
}


