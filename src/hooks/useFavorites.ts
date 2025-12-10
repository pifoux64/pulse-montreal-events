'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/types';

const FAVORITES_STORAGE_KEY = 'pulse-montreal-favorites';

export interface FavoritesHook {
  favorites: string[];
  favoriteEvents: Event[];
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (eventId: string) => Promise<void>;
  addFavorite: (eventId: string) => Promise<void>;
  removeFavorite: (eventId: string) => Promise<void>;
  clearAllFavorites: () => Promise<void>;
  getFavoriteEvents: (allEvents: Event[]) => Event[];
  isLoading: boolean;
  error: Error | null;
  isFavoriteLoading: (eventId: string) => boolean;
}

// Fonction pour charger les favoris depuis l'API (retourne les IDs)
async function fetchFavorites(): Promise<string[]> {
  const response = await fetch('/api/favorites?pageSize=1000');
  if (!response.ok) {
    if (response.status === 401) {
      // Utilisateur non connecté, retourner tableau vide
      return [];
    }
    throw new Error('Erreur lors du chargement des favoris');
  }
  const data = await response.json();
  return data.items?.map((event: any) => event.id) || [];
}

// Fonction pour charger les événements favoris complets depuis l'API
async function fetchFavoriteEvents(): Promise<Event[]> {
  const response = await fetch('/api/favorites?pageSize=1000');
  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error('Erreur lors du chargement des favoris');
  }
  const data = await response.json();
  
  // Transformer les événements de l'API Prisma vers le format Event du frontend
  return (data.items || []).map((event: any) => {
    const startDate = new Date(event.startAt);
    const endDate = event.endAt ? new Date(event.endAt) : null;
    
    return {
      id: event.id,
      title: event.title,
      description: event.description || '',
      shortDescription: event.description?.substring(0, 100) + '...' || '',
      startDate,
      endDate,
      location: {
        name: event.venue?.name || 'Montréal',
        address: event.venue?.address || '',
        city: event.venue?.city || 'Montréal',
        postalCode: event.venue?.postalCode || '',
        coordinates: {
          lat: event.venue?.lat || 45.5088,
          lng: event.venue?.lon || -73.5542,
        },
      },
      category: event.category || 'Autre',
      subCategory: event.subcategory || '',
      tags: event.tags || [],
      price: {
        amount: event.priceMin ? event.priceMin / 100 : 0,
        currency: event.currency || 'CAD',
        isFree: !event.priceMin || event.priceMin === 0,
      },
      imageUrl: event.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      ticketUrl: event.url || '#',
      organizerId: event.organizerId || 'default',
      organizer: {
        id: event.organizerId || 'default',
        email: event.organizer?.user?.email || 'organizer@pulse.com',
        name: event.organizer?.displayName || event.organizer?.user?.name || 'Organisateur',
        role: 'organizer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      customFilters: [],
      accessibility: event.accessibility || [],
      status: 'published' as const,
      source: event.source || 'INTERNAL',
      externalId: event.sourceId || event.id,
      language: event.language === 'FR' ? 'fr' : event.language === 'EN' ? 'en' : 'fr',
      minAttendees: 0,
      maxAttendees: 0,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    } as Event;
  });
}

// Fonction pour ajouter un favori via l'API
async function addFavoriteAPI(eventId: string): Promise<void> {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Vous devez être connecté pour ajouter des favoris');
    }
    throw new Error('Erreur lors de l\'ajout du favori');
  }
}

// Fonction pour supprimer un favori via l'API
async function removeFavoriteAPI(eventId: string): Promise<void> {
  const response = await fetch(`/api/favorites/${eventId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Vous devez être connecté pour supprimer des favoris');
    }
    throw new Error('Erreur lors de la suppression du favori');
  }
}

export const useFavorites = (allEvents: Event[] = []): FavoritesHook => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  const isAuthenticated = status === 'authenticated';

  // Charger les favoris depuis localStorage au démarrage (pour utilisateurs non connectés)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setLocalFavorites(parsedFavorites);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris locaux:', error);
        setLocalFavorites([]);
      }
    }
  }, [isAuthenticated]);

  // Sauvegarder les favoris locaux dans localStorage (pour utilisateurs non connectés)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(localFavorites));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris locaux:', error);
      }
    }
  }, [localFavorites, isAuthenticated]);

  // Query pour charger les favoris depuis l'API (si connecté)
  const {
    data: apiFavorites = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes - cohérent avec la config globale
    retry: 1,
  });

  // Migration automatique des favoris localStorage vers API lors de la connexion
  useEffect(() => {
    if (isAuthenticated && apiFavorites.length === 0 && typeof window !== 'undefined') {
      let migrationDone = false;
      try {
        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites && !migrationDone) {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites) && parsedFavorites.length > 0) {
            migrationDone = true;
            // Migrer les favoris vers l'API
            console.log(`🔄 Migration de ${parsedFavorites.length} favoris depuis localStorage vers l'API`);
            Promise.all(
              parsedFavorites.map((eventId: string) => 
                addFavoriteAPI(eventId).catch(err => {
                  console.warn(`Impossible de migrer le favori ${eventId}:`, err);
                })
              )
            ).then(() => {
              // Vider localStorage après migration réussie
              localStorage.removeItem(FAVORITES_STORAGE_KEY);
              // Invalider le cache pour recharger les favoris
              queryClient.invalidateQueries({ queryKey: ['favorites'] });
              queryClient.invalidateQueries({ queryKey: ['favoriteEvents'] });
              console.log('✅ Migration des favoris terminée');
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la migration des favoris:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, apiFavorites.length]);

  // Mutation pour ajouter un favori
  const addMutation = useMutation({
    mutationFn: addFavoriteAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteEvents'] });
    },
  });

  // Mutation pour supprimer un favori
  const removeMutation = useMutation({
    mutationFn: removeFavoriteAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteEvents'] });
    },
  });

  // Utiliser les favoris de l'API si connecté, sinon localStorage
  const favorites = isAuthenticated ? apiFavorites : localFavorites;

  // Vérifier si un événement est en favori
  const isFavorite = useCallback(
    (eventId: string): boolean => {
      return favorites.includes(eventId);
    },
    [favorites]
  );

  // Ajouter un favori
  const addFavorite = useCallback(
    async (eventId: string) => {
      if (isAuthenticated) {
        try {
          await addMutation.mutateAsync(eventId);
        } catch (error) {
          console.error('Erreur lors de l\'ajout du favori:', error);
          throw error;
        }
      } else {
        setLocalFavorites((prev) => {
          if (!prev.includes(eventId)) {
            return [...prev, eventId];
          }
          return prev;
        });
      }
    },
    [isAuthenticated, addMutation]
  );

  // Supprimer un favori
  const removeFavorite = useCallback(
    async (eventId: string) => {
      if (isAuthenticated) {
        try {
          await removeMutation.mutateAsync(eventId);
        } catch (error) {
          console.error('Erreur lors de la suppression du favori:', error);
          throw error;
        }
      } else {
        setLocalFavorites((prev) => prev.filter((id) => id !== eventId));
      }
    },
    [isAuthenticated, removeMutation]
  );

  // Toggle favori (ajouter si pas présent, supprimer si présent)
  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (isFavorite(eventId)) {
        await removeFavorite(eventId);
      } else {
        await addFavorite(eventId);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  // Vider tous les favoris
  const clearAllFavorites = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/favorites', {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression des favoris');
        }
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['favoriteEvents'] });
      } catch (error) {
        console.error('Erreur lors de la suppression des favoris:', error);
        throw error;
      }
    } else {
      setLocalFavorites([]);
    }
  }, [isAuthenticated, queryClient]);

  // Obtenir les événements favoris à partir de la liste complète
  const getFavoriteEvents = useCallback(
    (events: Event[]): Event[] => {
      return events.filter((event) => favorites.includes(event.id));
    },
    [favorites]
  );

  // Calculer les événements favoris actuels
  const favoriteEvents = getFavoriteEvents(allEvents);

  // Vérifier si un événement est en cours de chargement (mutation en cours)
  const isFavoriteLoading = useCallback(
    (eventId: string): boolean => {
      if (!isAuthenticated) {
        return false; // Pas de chargement pour localStorage
      }
      // Vérifier si une mutation est en cours pour cet événement
      // Note: React Query ne track pas les mutations par paramètre, donc on vérifie globalement
      return addMutation.isPending || removeMutation.isPending;
    },
    [isAuthenticated, addMutation.isPending, removeMutation.isPending]
  );

  return {
    favorites,
    favoriteEvents,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearAllFavorites,
    getFavoriteEvents,
    isLoading: isLoading && isAuthenticated,
    error: queryError as Error | null,
    isFavoriteLoading,
  };
};

// Hook pour charger directement les événements favoris depuis l'API
export function useFavoriteEvents() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    queryKey: ['favoriteEvents'],
    queryFn: fetchFavoriteEvents,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
