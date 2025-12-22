# 🔧 Corrections des Erreurs d'Ingestion

## Problèmes identifiés

### 1. ❌ "Error: the worker has exited"
**Cause** : Le logger Pino utilise des workers (via pino-pretty) qui se terminent et font planter le processus.

**Correction** : ✅ Déjà corrigé - Logger wrapper créé pour gérer ces erreurs silencieusement.

### 2. ⚠️ Rate limit OpenAI (429)
**Cause** : L'API OpenAI atteint sa limite de tokens par minute lors de l'enrichissement des tags.

**Impact** : L'enrichissement des tags échoue, mais l'ingestion continue (gestion d'erreur en place).

**Solution recommandée** :
- Ajouter un retry avec backoff exponentiel
- Ou désactiver temporairement l'enrichissement pendant l'ingestion
- Ou limiter le nombre d'événements enrichis par batch

### 3. ⏸️ Imports bloqués en "RUNNING"
**Cause** : Les imports restent en "RUNNING" si le processus crash avant de finaliser.

**Solution** : Les imports se terminent normalement en cas d'erreur grâce au try/catch, mais si le processus crash complètement, ils restent bloqués.

## Corrections à appliquer

### Correction 1 : Améliorer la gestion d'erreur OpenAI

Ajouter un retry avec backoff dans `src/lib/tagging/aiClassifier.ts` :

```typescript
// Retry avec backoff exponentiel pour les erreurs 429
async function classifyWithRetry(input: AIClassificationInput, maxRetries = 3): Promise<AIClassificationOutput> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await classifyEventWithAI(input);
      return result;
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  return { type: null, genres: [], ambiance: [], public: [] };
}
```

### Correction 2 : Désactiver l'enrichissement pendant l'ingestion (temporaire)

Dans `src/lib/orchestrator.ts`, commenter ou conditionner l'enrichissement :

```typescript
// Enrichissement en tags structurés (désactivé si rate limit)
try {
  if (process.env.DISABLE_TAG_ENRICHMENT !== 'true') {
    await enrichEventWithTags(created.id);
  }
} catch (error) {
  logger.error(`Erreur enrichissement tags: ${error}`);
}
```

### Correction 3 : Nettoyer les imports bloqués

Créer un script pour finaliser les imports bloqués en "RUNNING" :

```typescript
// Script à créer : scripts/clean-stuck-imports.ts
// Marque tous les imports RUNNING depuis plus de 1h comme ERROR
```

## Actions immédiates

1. ✅ Logger corrigé (déjà fait)
2. ⏳ Améliorer gestion OpenAI rate limit
3. ⏳ Nettoyer les imports bloqués
4. ⏳ Désactiver temporairement l'enrichissement si nécessaire

## Recommandation

**Solution temporaire** : Désactiver l'enrichissement des tags pendant l'ingestion pour éviter les rate limits :

```bash
# Dans .env.local
DISABLE_TAG_ENRICHMENT=true
```

Ensuite, relancer l'enrichissement manuellement plus tard quand le rate limit est réinitialisé.















