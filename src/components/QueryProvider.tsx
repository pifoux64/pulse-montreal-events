'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Créer un QueryClient unique par instance du composant
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache pendant 2 minutes - cohérent pour toutes les requêtes
        staleTime: 2 * 60 * 1000,
        // Garde en cache pendant 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry automatique en cas d'erreur (réduit pour améliorer la réactivité)
        retry: 1,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch en arrière-plan quand la fenêtre reprend le focus
        refetchOnWindowFocus: false,
        // Refetch quand la connexion se rétablit
        refetchOnReconnect: false,
        // Ne pas refetch automatiquement au mount (utiliser le cache)
        refetchOnMount: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
