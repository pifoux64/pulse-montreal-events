# Optimisations de performance

## React Query

### Configuration globale
- `staleTime`: 2 minutes (cohérent pour toutes les requêtes)
- `gcTime`: 10 minutes (temps de cache)
- `refetchOnMount`: false (utiliser le cache)
- `refetchOnWindowFocus`: false
- `refetchOnReconnect`: false
- `retry`: 1 (réduit pour améliorer la réactivité)

### Hooks optimisés
- `useEvents`: staleTime 2 minutes
- `useFavorites`: staleTime 2 minutes

## ISR (Incremental Static Regeneration)

Pages avec ISR activé :
- `/` (page d'accueil) : revalidate 120s (2 minutes)
- `/carte` : revalidate 120s (2 minutes)
- `/evenement/[id]` : revalidate 600s (10 minutes)
- `/organisateur/[id]` : revalidate 300s (5 minutes)

## API /api/events

### Optimisations
- Utilisation de `select` dans Prisma pour ne récupérer que les champs nécessaires
- Headers de cache : `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`
- Pagination efficace avec `skip` et `take`
- Tri par promotions actives en priorité

### Performance attendue
- TTFB < 200ms avec cache chaud
- Cache CDN pendant 2 minutes
- Stale-while-revalidate pendant 10 minutes

## Headers de cache

Les réponses API incluent :
- `Cache-Control`: Stratégie de cache
- `X-Cache-Status`: Statut du cache (MISS/HIT)

## Optimisations Prisma

- Utilisation de `select` au lieu de `include` pour réduire la taille des réponses
- Requêtes parallèles avec `Promise.all`
- Index sur les colonnes fréquemment utilisées (voir schema.prisma)

