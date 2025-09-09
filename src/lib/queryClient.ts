import { QueryClient } from '@tanstack/react-query';

// Configuration du client React Query optimisée pour Pulse
export const queryClient = new QueryClient({
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
});
