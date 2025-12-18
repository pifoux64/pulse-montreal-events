/**
 * Client OpenAI centralisé pour toutes les fonctionnalités AI
 * SPRINT 1: Architecture AI réutilisable avec cache + retry + validation
 */

import { z } from 'zod';

export interface OpenAICallOptions {
  model?: string;
  temperature?: number;
  maxRetries?: number;
  cacheKey?: string;
  cacheTTL?: number; // en secondes
}

export interface OpenAICallResult<T> {
  data: T;
  cached: boolean;
  tokensUsed?: number;
  latency?: number;
}

/**
 * Cache simple en mémoire (à remplacer par Redis/DB plus tard)
 */
const aiCache = new Map<string, { data: any; expiresAt: number }>();

/**
 * Client OpenAI avec retry, cache et validation JSON
 */
export async function callOpenAI<T>(
  systemPrompt: string,
  userPrompt: string,
  outputSchema: z.ZodSchema<T>,
  options: OpenAICallOptions = {}
): Promise<OpenAICallResult<T>> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0,
    maxRetries = 3,
    cacheKey,
    cacheTTL = 3600, // 1h par défaut
  } = options;

  // Vérifier le cache
  if (cacheKey) {
    const cached = aiCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        data: cached.data as T,
        cached: true,
      };
    }
  }

  // Si pas de clé API, retourner une erreur
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configurée');
  }

  const startTime = Date.now();
  let lastError: any;

  // Retry avec backoff exponentiel
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = { status: response.status, message: errorText };

        try {
          errorData = { ...errorData, ...JSON.parse(errorText) };
        } catch {
          // Ignorer si pas JSON
        }

        // Rate limit: retry avec délai
        if (response.status === 429 && attempt < maxRetries - 1) {
          const retryAfter = errorData.retry_after || errorData.retryAfter || Math.pow(2, attempt) * 1000;
          const delay = Math.min(retryAfter * 1000, 60000); // Max 60s
          console.warn(`⚠️ Rate limit OpenAI (429) - Tentative ${attempt + 1}/${maxRetries} - Retry dans ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        const error = new Error(errorText) as any;
        error.status = response.status;
        error.retryAfter = errorData.retry_after || errorData.retryAfter;
        throw error;
      }

      const data: any = await response.json();
      const rawContent = data.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(rawContent);

      // Valider avec Zod
      const validated = outputSchema.parse(parsed);

      const latency = Date.now() - startTime;
      const tokensUsed = data.usage?.total_tokens;

      // Mettre en cache
      if (cacheKey) {
        aiCache.set(cacheKey, {
          data: validated,
          expiresAt: Date.now() + cacheTTL * 1000,
        });

        // Nettoyer le cache si trop grand (max 1000 entrées)
        if (aiCache.size > 1000) {
          const firstKey = aiCache.keys().next().value;
          aiCache.delete(firstKey);
        }
      }

      return {
        data: validated,
        cached: false,
        tokensUsed,
        latency,
      };
    } catch (error: any) {
      lastError = error;

      // Si erreur de validation Zod, ne pas retry
      if (error instanceof z.ZodError) {
        console.error('❌ Erreur de validation Zod:', error.issues);
        throw new Error(`Validation échouée: ${error.issues.map((e) => e.message).join(', ')}`);
      }

      // Si dernière tentative, throw
      if (attempt === maxRetries - 1) {
        console.error(`❌ Erreur OpenAI après ${maxRetries} tentatives:`, error?.message || error);
        throw error;
      }

      // Attendre avant retry (backoff exponentiel)
      const delay = Math.min(Math.pow(2, attempt) * 1000, 60000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Erreur inconnue lors de l'appel OpenAI");
}

/**
 * Génère une clé de cache à partir d'un hash
 */
export function generateCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const key = `${prefix}:${parts.filter(Boolean).join(':')}`;
  // Hash simple (à améliorer avec crypto plus tard)
  return Buffer.from(key).toString('base64').substring(0, 64);
}


