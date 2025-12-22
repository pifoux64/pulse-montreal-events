# 🏗️ Architecture Complète - Pipeline d'Ingestion

## 📊 Résumé de l'État Actuel

### ✅ Déjà en place
- Modèle ImportJob dans Prisma (à enrichir)
- Orchestrateur fonctionnel (`src/lib/orchestrator.ts`)
- Connecteurs existants (Ticketmaster, Meetup, Eventbrite, etc.)
- BaseConnector avec interface commune
- Routes API d'ingestion (`/api/ingestion`)
- CRON automatique

### 🔄 À améliorer
- Enrichir ImportJob avec champs détaillés
- Créer dashboard admin pour visualisation
- Standardiser l'architecture des sources
- Améliorer connecteur Eventbrite
- Améliorer déduplication
- Ajouter sources futures (Open Data, ICS)

---

## 📋 Plan d'Implémentation Détaillé

### ✅ Tâche 1.1 - ImportJob enrichi (FAIT)
- Champs ajoutés : startedAt, finishedAt, nbCreated, nbUpdated, nbSkipped, nbErrors
- Migration à créer

### ⏳ Tâche 1.2 - Dashboard Admin (À FAIRE)
- Page `/admin/ingestion`
- Tableau ImportJob
- Statistiques par source
- Graphiques (optionnel)

### ⏳ Tâche 1.3 - API Dashboard (À FAIRE)
- GET `/api/admin/ingestion` - Stats complètes

### ⏳ Tâche 2 - Architecture commune (EN COURS)
- ✅ Interface IngestionSource créée
- À faire : Refactorer connecteurs
- À faire : Orchestrateur simplifié

### ⏳ Tâche 3 - Eventbrite MVP (À FAIRE)
- Améliorer connecteur existant
- Mapping complet
- Tests

### ⏳ Tâche 4 - Déduplication (À FAIRE)
- Utiliser (source, sourceId) comme clé
- Fallback titre+date+lieu

### ⏳ Tâche 5 - Squelettes (À FAIRE)
- Open Data Montréal
- ICS générique

### ⏳ Tâche 6 - Documentation (À FAIRE)
- README-ingestion.md

---

## 🎯 Recommandation

Étant donné l'ampleur du travail, je recommande de procéder par étapes :

1. **Phase 1 (Immédiat)** : Dashboard admin + Migration Prisma
2. **Phase 2 (Court terme)** : Architecture commune + Eventbrite
3. **Phase 3 (Moyen terme)** : Refactorisation complète + nouvelles sources

Voulez-vous que je continue avec l'implémentation complète maintenant, ou préférez-vous que je crée d'abord les fichiers prioritaires (dashboard + migration) ?















