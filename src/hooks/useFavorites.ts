'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types';

const FAVORITES_STORAGE_KEY = 'pulse-montreal-favorites';

export interface FavoritesHook {
  favorites: string[];
  favoriteEvents: Event[];
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (eventId: string) => void;
  addFavorite: (eventId: string) => void;
  removeFavorite: (eventId: string) => void;
  clearAllFavorites: () => void;
  getFavoriteEvents: (allEvents: Event[]) => Event[];
}

export const useFavorites = (allEvents: Event[] = []): FavoritesHook => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Charger les favoris depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Sauvegarder les favoris dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris:', error);
      }
    }
  }, [favorites]);

  // Vérifier si un événement est en favori
  const isFavorite = useCallback((eventId: string): boolean => {
    return favorites.includes(eventId);
  }, [favorites]);

  // Ajouter un favori
  const addFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      if (!prev.includes(eventId)) {
        return [...prev, eventId];
      }
      return prev;
    });
  }, []);

  // Supprimer un favori
  const removeFavorite = useCallback((eventId: string) => {
    setFavorites(prev => prev.filter(id => id !== eventId));
  }, []);

  // Toggle favori (ajouter si pas présent, supprimer si présent)
  const toggleFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  }, []);

  // Vider tous les favoris
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  // Obtenir les événements favoris à partir de la liste complète
  const getFavoriteEvents = useCallback((events: Event[]): Event[] => {
    return events.filter(event => favorites.includes(event.id));
  }, [favorites]);

  // Calculer les événements favoris actuels
  const favoriteEvents = getFavoriteEvents(allEvents);

  return {
    favorites,
    favoriteEvents,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearAllFavorites,
    getFavoriteEvents,
  };
};
