# Configuration de sécurité et observabilité

## Sentry

Sentry est configuré pour capturer les erreurs côté serveur et client.

### Variables d'environnement requises

```env
# Sentry DSN (obtenu depuis https://sentry.io)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Configuration

- **Client** : `sentry.client.config.ts` - Configuration pour le navigateur
- **Serveur** : `sentry.server.config.ts` - Configuration pour le serveur Node.js
- **Edge** : `sentry.edge.config.ts` - Configuration pour les fonctions edge

### Test

Pour tester que Sentry fonctionne, visitez `/api/test-error` qui génère une erreur de test.

## Rate Limiting avec Upstash

Le rate limiting est configuré via Upstash Redis pour protéger les endpoints sensibles.

### Variables d'environnement requises

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Limites configurées

- **POST sensibles** : 10 requêtes par minute par IP
  - `/api/events`
  - `/api/promotions`
  - `/api/favorites`
  - `/api/organizers`
  - `/auth/signin`
  - `/auth/signup`

- **Authentification** : 5 tentatives par 15 minutes par IP
- **Création d'événements** : 20 requêtes par heure par IP

### Headers de réponse

Les réponses incluent des headers de rate limiting :
- `X-RateLimit-Limit` : Limite totale
- `X-RateLimit-Remaining` : Requêtes restantes
- `X-RateLimit-Reset` : Timestamp de réinitialisation
- `Retry-After` : Secondes avant de pouvoir réessayer (si limit atteint)

## Content Security Policy (CSP)

CSP est configuré dans `next.config.ts` avec les règles suivantes :

- `default-src 'self'` : Par défaut, uniquement depuis le même domaine
- `script-src` : Autorise Sentry et scripts inline nécessaires
- `style-src` : Autorise Google Fonts et styles inline
- `img-src` : Autorise toutes les images HTTPS
- `connect-src` : Autorise les connexions vers Sentry

## Headers de sécurité

Les headers suivants sont configurés :

- `X-Frame-Options: DENY` - Empêche l'inclusion dans des iframes
- `X-Content-Type-Options: nosniff` - Empêche le MIME-sniffing
- `Referrer-Policy: origin-when-cross-origin` - Contrôle les informations de referrer
- `X-XSS-Protection: 1; mode=block` - Protection XSS
- `Strict-Transport-Security` - Force HTTPS
- `Content-Security-Policy` - Politique de sécurité du contenu
- `Permissions-Policy` - Désactive les fonctionnalités non nécessaires

## Mode développement

En développement, le rate limiting est désactivé si les variables Upstash ne sont pas configurées. Sentry est également désactivé en développement par défaut.

