# 🟦 SPRINT 1 — INGESTION LÉGALE ET STABLE - Plan d'Action

**Date**: Janvier 2025  
**Objectif**: Conserver uniquement les sources légales, stabiliser l'ingestion, atteindre 300+ événements dans la DB

---

## 📊 État Actuel vs Objectifs

### ✅ Déjà Complété
- ✅ Déduplication robuste : `(source, sourceId)` + fallback titre+date+lieu
- ✅ ImportJob enrichi : `startedAt`, `finishedAt`, `nbCreated`, `nbUpdated`, `nbSkipped`, `nbErrors`
- ✅ Orchestrateur stable avec gestion d'erreurs
- ✅ Dashboard admin `/admin/ingestion`
- ✅ Sources non-API désactivées (AllEvents, LaVitrine)

### 🔄 À Compléter
- [ ] Stabiliser Ticketmaster (vérifier pagination, timezone)
- [ ] Implémenter Open Data Montréal
- [ ] Documenter limitations Eventbrite
- [ ] Vérifier que 300+ événements sont ingérés

---

## 🎯 Tâches Détaillées

### 1. ✅ Nettoyage des sources (FAIT)
**Statut**: ✅ Complété

Les sources non-API sont déjà désactivées dans l'orchestrateur :
- AllEvents : `enabled: false`
- LaVitrine : `enabled: false`
- Lepointdevente : `enabled: false` (nécessite partenariat API)

**Action**: Aucune action requise

---

### 2. ✅ Stabiliser Ticketmaster
**Statut**: ✅ Complété

**Améliorations apportées**:
- [x] Pagination : Ajout de la pagination pour récupérer plus de 200 événements
- [x] Dates : Filtrage automatique des événements passés
- [x] Timezone : `America/Montreal` correctement gérée dans le mapping
- [x] Géocodage : Déjà en place pour les adresses sans coordonnées

**Modifications**:
- `src/ingestors/ticketmaster.ts` : Ajout de la pagination et filtrage des événements passés

---

### 3. ✅ Eventbrite (Limitation API)
**Statut**: ✅ Documenté

**Documentation créée**:
- ✅ `docs/EVENTBRITE_LIMITATIONS.md` : Documentation complète des limitations
- ✅ `docs/STATUT_SOURCES.md` : Mis à jour avec le statut Eventbrite

**Résumé**:
- L'API Eventbrite v3 ne permet **PAS** de rechercher des événements publics
- Le connecteur existe mais reste désactivé
- Alternatives proposées : Ticketmaster, Open Data Montréal

---

### 4. ✅ Implémenter Open Data Montréal
**Statut**: ✅ Complété

**Implémentation**:
- [x] Connecteur créé : `src/ingestors/open-data-montreal.ts`
- [x] Support JSON (Socrata et format simple) et CSV
- [x] Mapping flexible des champs (supporte plusieurs noms de colonnes)
- [x] Intégration dans l'orchestrateur
- [x] Documentation complète : `docs/OPEN_DATA_MONTREAL_SETUP.md`

**Configuration requise**:
- Variable d'environnement : `OPEN_DATA_MONTREAL_URL`
- Le connecteur s'active automatiquement si l'URL est configurée

**Fichiers créés/modifiés**:
- ✅ `src/ingestors/open-data-montreal.ts` (nouveau connecteur)
- ✅ `src/lib/orchestrator.ts` (ajout de MTL_OPEN_DATA)
- ✅ `docs/OPEN_DATA_MONTREAL_SETUP.md` (guide de configuration)

---

### 5. ✅ Déduplication (FAIT)
**Statut**: ✅ Complété

Le système de déduplication est déjà robuste :
- Clé primaire : `(source, sourceId)` via `unique_source_event`
- Fallback : Hash `(titre normalisé + date + lieu)` via `findPotentialDuplicates`
- Score de similarité : 82% minimum

**Action**: Aucune action requise

---

### 6. ✅ Orchestrateur (FAIT)
**Statut**: ✅ Complété

L'orchestrateur est stable avec :
- Gestion d'erreurs robuste
- ImportJob enrichi
- Retry automatique
- Logs détaillés

**Action**: Aucune action requise

---

### 7. ✅ Dashboard Admin (FAIT)
**Statut**: ✅ Complété

La page `/admin/ingestion` existe déjà et affiche :
- Derniers imports
- Stats par source
- Statut des jobs

**Action**: Aucune action requise

---

## 📋 Checklist Finale SPRINT 1

- [x] Sources non-API désactivées
- [x] Ticketmaster stabilisé (pagination ajoutée, filtrage événements passés)
- [x] Open Data Montréal implémenté (connecteur créé, nécessite configuration URL)
- [x] Eventbrite documenté (limitations documentées dans `docs/EVENTBRITE_LIMITATIONS.md`)
- [x] Déduplication robuste
- [x] Orchestrateur stable
- [x] Dashboard admin fonctionnel
- [ ] **Objectif**: 300+ événements dans la DB (à vérifier après prochaine ingestion)

---

## 🚀 Prochaines Étapes

Une fois le SPRINT 1 complété :
1. Vérifier le nombre d'événements ingérés
2. Tester la stabilité de l'ingestion sur 48h
3. Passer au SPRINT 2 (Classification IA & Tagging)

---

**Note**: Le système de tagging IA est déjà partiellement implémenté (`aiClassifier.ts`, `eventTaggingService.ts`), mais sera complété dans le SPRINT 2 selon le plan d'affaires.

