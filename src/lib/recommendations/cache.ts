/**
 * Cache simple en mémoire pour les recommandations
 * Pour production, utiliser Redis ou un cache distribué
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Instance singleton
export const recommendationCache = new SimpleCache();

// Nettoyer le cache toutes les heures
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    recommendationCache.cleanup();
  }, 60 * 60 * 1000); // 1 heure
}

/**
 * Génère une clé de cache pour les recommandations
 */
export function getRecommendationCacheKey(
  userId: string,
  options: { genre?: string; style?: string; scope?: string } = {}
): string {
  const parts = ['rec', userId];
  if (options.genre) parts.push(`g:${options.genre}`);
  if (options.style) parts.push(`s:${options.style}`);
  if (options.scope) parts.push(`scope:${options.scope}`);
  return parts.join(':');
}

