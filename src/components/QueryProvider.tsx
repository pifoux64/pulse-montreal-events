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
        // Cache pendant 5 minutes
        staleTime: 5 * 60 * 1000,
        // Garde en cache pendant 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry automatique en cas d'erreur
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch en arrière-plan quand la fenêtre reprend le focus
        refetchOnWindowFocus: false,
        // Refetch quand la connexion se rétablit
        refetchOnReconnect: true,
        // Refetch quand le composant se remonte
        refetchOnMount: 'always',
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
