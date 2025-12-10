# 📋 Plan d'Implémentation - Pipeline d'Ingestion

## Vue d'ensemble
Amélioration du pipeline d'ingestion pour le rendre plus robuste, observable et extensible.

---

## ✅ Tâche 1 - Dashboard Ingestion et ImportJob enrichi

### 1.1 Migration Prisma ImportJob
**Fichier**: `prisma/schema.prisma`
- ✅ Ajout des champs : startedAt, finishedAt, nbCreated, nbUpdated, nbSkipped, nbErrors
- Créer migration : `prisma migrate dev --name enrich_import_job`

### 1.2 Dashboard Admin
**Fichier**: `src/app/admin/ingestion/page.tsx`
- Liste des ImportJob récents (tableau)
- Statistiques par source (agrégations)
- UI simple et lisible
- Protection admin

### 1.3 API Dashboard
**Fichier**: `src/app/api/admin/ingestion/route.ts`
- GET : Liste ImportJob avec pagination
- GET : Statistiques agrégées par source
- Nombre d'événements par source

---

## ✅ Tâche 2 - Architecture commune des sources

### 2.1 Interface commune
**Fichier**: `src/ingestion/sources.ts`
- Interface `IngestionSource`
- Interface `IngestionResult`
- Fonction helper pour créer un résultat

### 2.2 Refactorer connecteurs
Pour chaque connecteur existant :
- Extraire dans `src/ingestion/[source]Source.ts`
- Implémenter interface IngestionSource
- Garder BaseConnector pour compatibilité temporaire

### 2.3 Orchestrateur simplifié
**Fichier**: `src/ingestion/runAllSources.ts`
- Liste des sources actives
- Exécution séquentielle ou parallèle
- Gestion d'erreurs robuste
- Création ImportJob automatique

### 2.4 Routes API
**Fichier**: `src/app/api/admin/ingest-all/route.ts`
- POST : Déclenche toutes les sources

**Fichier**: `src/app/api/admin/ingest/[source]/route.ts`
- POST : Déclenche une source spécifique

---

## ✅ Tâche 3 - Connecteur Eventbrite MVP

### 3.1 Connecteur Eventbrite
**Fichier**: `src/ingestion/eventbriteSource.ts`
- Récupération API Eventbrite
- Mapping complet vers UnifiedEvent
- Gestion pagination
- Gestion erreurs

### 3.2 Configuration
- Variable d'env : EVENTBRITE_TOKEN
- Ajout dans orchestrateur
- Test local

---

## ✅ Tâche 4 - Améliorer déduplication

### 4.1 Vérifier modèle Event
- ✅ source + sourceId existe déjà avec unique constraint
- Vérifier que externalId = sourceId

### 4.2 Logique upsert améliorée
**Fichier**: `src/lib/deduplication.ts` (améliorer)
- Utiliser (source, sourceId) comme clé primaire
- Fallback : titre normalisé + date + lieu
- Améliorer findPotentialDuplicates

---

## ✅ Tâche 5 - Squelettes sources futures

### 5.1 Open Data Montréal
**Fichier**: `src/ingestion/openDataMontrealSource.ts`
- Squelette avec TODO
- Interface respectée
- Documentation

### 5.2 ICS générique
**Fichier**: `src/ingestion/icsSource.ts`
- Squelette avec TODO
- Paramètre URL ICS
- Parser ICS (node-ical)

---

## ✅ Tâche 6 - Documentation

### 6.1 README Ingestion
**Fichier**: `README-ingestion.md`
- Architecture
- Comment ajouter une source
- Configuration clés API
- Déclencher manuellement
- Logs et debugging

---

## Ordre d'implémentation

1. ✅ Tâche 1.1 - Migration ImportJob
2. Tâche 1.2 - Dashboard admin
3. Tâche 2.1 - Interface commune
4. Tâche 2.2 - Refactorer 1-2 connecteurs (exemple)
5. Tâche 3 - Eventbrite MVP
6. Tâche 4 - Déduplication
7. Tâche 5 - Squelettes
8. Tâche 6 - Documentation



