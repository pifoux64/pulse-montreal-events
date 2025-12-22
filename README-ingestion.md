# 📥 Guide d'Ingestion d'Événements - Pulse Montreal

## 🎯 Vue d'ensemble

Le système d'ingestion permet d'importer automatiquement des événements depuis diverses sources externes (Ticketmaster, Eventbrite, Meetup, etc.) dans la base de données Pulse.

---

## 🏗️ Architecture

### Composants principaux

1. **Connecteurs** (`src/ingestors/` ou `src/ingestion/`)
   - Chaque source a son connecteur
   - Hérite de `BaseConnector`
   - Implémente `listUpdatedSince()` et `mapToUnifiedEvent()`

2. **Orchestrateur** (`src/lib/orchestrator.ts`)
   - Coordonne tous les connecteurs
   - Gère les ImportJob
   - Déduplication automatique

3. **ImportJob** (Prisma)
   - Trace chaque import
   - Statistiques détaillées (créés, mis à jour, ignorés, erreurs)
   - Dashboard admin pour visualisation

4. **Déduplication** (`src/lib/deduplication.ts`)
   - Clé primaire : `(source, sourceId)`
   - Fallback : titre normalisé + date + lieu

---

## 📋 Sources Actuelles

### ✅ Implémentées et actives

- **Ticketmaster** - Via API officielle
- **Meetup** - Via API (si configuré)

### ✅ Implémentées mais désactivées

- **Eventbrite** - Limitation API (voir ci-dessous)
- **AllEvents** - Connecteur disponible
- **LaVitrine** - Connecteur disponible

### ⚠️ Limitations connues

#### Eventbrite
L'API Eventbrite v3 **ne permet pas** de rechercher des événements publics par localisation. Elle est conçue uniquement pour gérer vos propres événements.

**Solutions :**
1. Contacter le support Eventbrite pour l'accès à l'API de recherche publique
2. Utiliser les autres sources (Ticketmaster, Meetup, etc.)
3. Utiliser l'API Eventbrite uniquement pour vos propres événements

**Référence:** `docs/EVENTBRITE_SETUP.md`

---

## 🚀 Configuration

### Variables d'environnement

```env
# Ticketmaster (actif)
TICKETMASTER_API_KEY=votre_cle_api

# Eventbrite (si disponible)
EVENTBRITE_TOKEN=votre_token_oauth

# Meetup (si configuré)
MEETUP_API_KEY=votre_cle_api
```

### Vérifier la configuration

```bash
npm run checkenv
```

---

## 📊 Dashboard Admin

### Accès

URL: `/admin/ingestion`

**Prérequis:** Rôle ADMIN requis

### Fonctionnalités

- ✅ Tableau des ImportJob récents
- ✅ Statistiques par source (nombre d'événements, dernier import)
- ✅ Bouton pour déclencher ingestion complète
- ✅ Bouton pour relancer une source spécifique
- ✅ Détails des erreurs

### Utilisation

1. Se connecter en tant qu'admin
2. Aller sur `/admin/ingestion`
3. Consulter les statistiques par source
4. Voir l'historique des imports
5. Déclencher manuellement une ingestion si nécessaire

---

## 🔧 Déclencher une Ingestion

### Via Dashboard (recommandé)

1. Aller sur `/admin/ingestion`
2. Cliquer sur "Ingestion complète" ou "Relancer" sur une source

### Via API

#### Ingestion complète (toutes sources)

```bash
POST /api/admin/ingest-all
Headers: Cookie avec session admin
```

#### Ingestion source spécifique

```bash
POST /api/admin/ingest/TICKETMASTER
Headers: Cookie avec session admin
```

### Via CRON automatique

Le système déclenche automatiquement l'ingestion toutes les 2 heures via Vercel Cron.

**Route:** `/api/cron/ingestion` (protégée par `CRON_SECRET`)

---

## 📝 Ajouter une Nouvelle Source

### Étape 1 : Créer le connecteur

Créez un fichier `src/ingestors/[source].ts` qui hérite de `BaseConnector`:

```typescript
import { BaseConnector, UnifiedEvent } from './base';
import { EventSource } from '@prisma/client';

export class MaSourceConnector extends BaseConnector {
  constructor(apiKey?: string) {
    super(
      EventSource.MA_SOURCE,
      apiKey,
      'https://api.example.com',
      1 // rate limit par seconde
    );
  }

  async listUpdatedSince(since: Date, limit: number = 100): Promise<any[]> {
    // Récupérer les événements depuis l'API
    // Retourner un tableau d'événements bruts
  }

  async mapToUnifiedEvent(rawEvent: any): Promise<UnifiedEvent> {
    // Mapper l'événement brut vers UnifiedEvent
    return {
      sourceId: rawEvent.id,
      source: EventSource.MA_SOURCE,
      title: rawEvent.title,
      // ... autres champs
    };
  }
}
```

### Étape 2 : Ajouter à l'orchestrateur

Dans `src/lib/orchestrator.ts`, ajoutez :

```typescript
// Dans initializeConnectors()
{
  source: EventSource.MA_SOURCE,
  enabled: !!process.env.MA_SOURCE_API_KEY,
  apiKey: process.env.MA_SOURCE_API_KEY,
  batchSize: 100,
}

// Dans le switch case
case EventSource.MA_SOURCE:
  connector = new MaSourceConnector(config.apiKey);
  break;
```

### Étape 3 : Ajouter au schéma Prisma (si nouvelle source)

Si c'est une nouvelle source, ajoutez-la à l'enum `EventSource` dans `prisma/schema.prisma` :

```prisma
enum EventSource {
  // ... sources existantes
  MA_SOURCE
}
```

Puis créez une migration :

```bash
npx prisma migrate dev --name add_ma_source
```

### Étape 4 : Configuration

Ajoutez la variable d'environnement :

```env
MA_SOURCE_API_KEY=votre_cle
```

Sur Vercel : Settings → Environment Variables

---

## 🔍 Déduplication

### Clé primaire : (source, sourceId)

Chaque événement est identifié de manière unique par la combinaison `(source, sourceId)`.

Le schéma Prisma a une contrainte unique :
```prisma
@@unique([sourceId, source], name: "unique_source_event")
```

### Logique d'upsert

1. **Recherche par (source, sourceId)**
   - Si trouvé → UPDATE
   - Si non trouvé → CREATE

2. **Fallback : détection de doublons**
   - Si pas de sourceId, recherche par titre normalisé + date + lieu
   - Utilise la similarité de texte (Levenshtein)
   - Seuil de similarité : 82%

### Améliorer la déduplication

Pour une source sans `sourceId` fiable, vous pouvez :

1. Normaliser le titre
2. Extraire une date précise
3. Utiliser les coordonnées GPS si disponibles

---

## 🐛 Debugging

### Vérifier les logs

Les logs sont disponibles dans :
- Console Vercel (production)
- Terminal local (`npm run dev`)
- Dashboard Sentry (si configuré)

### Commandes utiles

```bash
# Vérifier la configuration
npm run checkenv

# Tester une ingestion localement (via script)
tsx scripts/test-ingestion.ts

# Voir les événements dans la DB
# (utiliser Prisma Studio)
npx prisma studio
```

### Problèmes courants

#### Aucun événement importé

1. Vérifier que la source est activée dans l'orchestrateur
2. Vérifier les clés API (variables d'env)
3. Consulter les logs d'erreur
4. Vérifier le dashboard `/admin/ingestion`

#### Erreurs API

1. Vérifier les limites de taux (rate limiting)
2. Vérifier l'expiration des tokens
3. Consulter la documentation de l'API source

#### Doublons d'événements

1. Vérifier que `sourceId` est bien renseigné
2. Vérifier la contrainte unique dans Prisma
3. Consulter les logs de déduplication

---

## 📈 Monitoring

### Dashboard Admin

Accédez à `/admin/ingestion` pour voir :
- Nombre d'événements par source
- Dernier import par source
- Historique des imports
- Erreurs récentes

### Métriques importantes

- **Nombre total d'événements** : Comptage par source
- **Taux de succès** : ImportJob SUCCESS vs ERROR
- **Performance** : Durée des imports
- **Erreurs** : Messages d'erreur détaillés

---

## 🔄 Workflow d'Ingestion

### Automatique (CRON)

1. Vercel CRON déclenche `/api/cron/ingestion` toutes les 2h
2. L'orchestrateur exécute chaque source activée
3. Pour chaque source :
   - Créer un ImportJob (status: RUNNING)
   - Récupérer les événements depuis la dernière exécution
   - Traiter chaque événement (déduplication + upsert)
   - Mettre à jour ImportJob (statistiques + status)
4. Enrichir avec tags structurés (IA)

### Manuel (Dashboard)

1. Aller sur `/admin/ingestion`
2. Cliquer sur "Ingestion complète" ou "Relancer" une source
3. L'ingestion se déroule en arrière-plan
4. Rafraîchir la page pour voir les résultats

---

## 📚 Références

### Fichiers clés

- **Orchestrateur** : `src/lib/orchestrator.ts`
- **Base connector** : `src/ingestors/base.ts`
- **Déduplication** : `src/lib/deduplication.ts`
- **Schéma** : `prisma/schema.prisma`

### Documentation

- **Eventbrite** : `docs/EVENTBRITE_SETUP.md`
- **API Keys** : `docs/api-keys-guide.md`
- **Performance** : `docs/PERFORMANCE.md`

---

## 🎯 Prochaines Améliorations

- [ ] Architecture commune standardisée (IngestionSource)
- [ ] Sources Open Data Montréal
- [ ] Import ICS générique
- [ ] Amélioration déduplication avec ML
- [ ] Retry automatique en cas d'erreur
- [ ] Notifications en cas d'échec répété

---

**Dernière mise à jour :** Janvier 2025















