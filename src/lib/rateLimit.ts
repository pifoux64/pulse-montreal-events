/**
 * Rate limiting avec Upstash Redis
 * Utilisé pour protéger les endpoints sensibles (POST, PUT, DELETE)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialiser Redis (utilise les variables d'environnement UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN)
// En développement, on peut utiliser un mock si les variables ne sont pas définies
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Rate limiter pour les requêtes POST sensibles
 * 10 requêtes par minute par IP
 */
export const postRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/post',
    })
  : null;

/**
 * Rate limiter pour les requêtes d'authentification
 * 5 tentatives par 15 minutes par IP
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null;

/**
 * Rate limiter pour les requêtes de création d'événements
 * 20 requêtes par heure par IP
 */
export const eventCreationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/event-creation',
    })
  : null;

/**
 * Obtenir l'IP de la requête
 */
export function getClientIP(request: Request): string {
  // Vérifier les headers proxy (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (ne devrait jamais arriver en production)
  return 'unknown';
}

/**
 * Vérifier le rate limit et retourner le résultat
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const result = await rateLimiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

