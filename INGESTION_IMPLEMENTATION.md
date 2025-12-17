# 🚀 Implémentation Pipeline d'Ingestion - Guide Complet

## 📊 Résumé de l'Architecture

Cette implémentation transforme le système d'ingestion pour le rendre plus robuste, observable et extensible.

---

## 📁 Fichiers à Créer/Modifier

### 1. Schéma Prisma (MODIFIÉ)
- ✅ `prisma/schema.prisma` - ImportJob enrichi avec champs détaillés

### 2. Migration Prisma (À CRÉER)
- `prisma/migrations/[timestamp]_enrich_import_job/migration.sql`

### 3. Architecture commune (NOUVEAUX FICHIERS)
- `src/ingestion/sources.ts` - Interface IngestionSource commune
- `src/ingestion/runAllSources.ts` - Orchestrateur simplifié
- `src/ingestion/types.ts` - Types partagés

### 4. Connecteurs refactorés (NOUVEAUX FICHIERS)
- `src/ingestion/ticketmasterSource.ts`
- `src/ingestion/meetupSource.ts`
- `src/ingestion/eventbriteSource.ts` (MVP amélioré)
- `src/ingestion/alleventsSource.ts`
- `src/ingestion/lavitrineSource.ts`

### 5. Squelettes futurs (NOUVEAUX FICHIERS)
- `src/ingestion/openDataMontrealSource.ts`
- `src/ingestion/icsSource.ts`

### 6. Dashboard Admin (NOUVEAUX FICHIERS)
- `src/app/admin/ingestion/page.tsx` - Page dashboard
- `src/app/api/admin/ingestion/route.ts` - API dashboard
- `src/app/api/admin/ingest-all/route.ts` - API déclencher tout
- `src/app/api/admin/ingest/[source]/route.ts` - API déclencher source

### 7. Documentation (NOUVEAUX FICHIERS)
- `README-ingestion.md` - Documentation complète

### 8. Orchestrateur (MODIFIÉ)
- `src/lib/orchestrator.ts` - Mise à jour pour utiliser nouveaux champs ImportJob

---

## 🔧 Détails d'Implémentation

### Tâche 1 : ImportJob enrichi

**Modifications Prisma :**
```prisma
model ImportJob {
  // Champs existants
  id, source, status, runAt, stats, errorText
  
  // Nouveaux champs
  startedAt   DateTime   @default(now())
  finishedAt  DateTime?
  nbCreated   Int        @default(0)
  nbUpdated   Int        @default(0)
  nbSkipped   Int        @default(0)
  nbErrors    Int        @default(0)
}
```

### Tâche 2 : Interface commune

**Structure :**
```typescript
interface IngestionSource {
  name: string;
  source: EventSource;
  enabled: boolean;
  run: () => Promise<IngestionResult>;
}

interface IngestionResult {
  source: EventSource;
  startedAt: Date;
  finishedAt: Date;
  nbCreated: number;
  nbUpdated: number;
  nbSkipped: number;
  nbErrors: number;
  errors: string[];
  duration: number;
}
```

### Tâche 3 : Eventbrite MVP

- API Eventbrite v3
- Mapping complet
- Gestion erreurs
- Pagination

### Tâche 4 : Déduplication

- Utiliser (source, sourceId) comme clé unique
- Fallback sur titre+date+lieu normalisés

---

## 🎯 Ordre d'Exécution Recommandé

1. Migration Prisma (changements ImportJob)
2. Interface commune (sources.ts)
3. Dashboard admin (visualisation)
4. Refactorer 1 connecteur (exemple)
5. Eventbrite MVP
6. Améliorer déduplication
7. Squelettes futurs
8. Documentation

---

## 📝 Commandes de Test

```bash
# Générer migration
npx prisma migrate dev --name enrich_import_job

# Générer client Prisma
npx prisma generate

# Tester ingestion manuelle
curl -X POST http://localhost:3000/api/admin/ingest-all \
  -H "Cookie: next-auth.session-token=..."

# Tester source spécifique
curl -X POST http://localhost:3000/api/admin/ingest/TICKETMASTER \
  -H "Cookie: next-auth.session-token=..."
```








