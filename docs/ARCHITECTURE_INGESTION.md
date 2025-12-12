# 🏗️ Architecture d'Ingestion d'Événements - Pulse Montreal

## Vue d'ensemble

L'architecture d'ingestion permet d'ajouter facilement de nouvelles sources d'événements tout en maintenant un pipeline robuste et observable.

## Structure Actuelle

### Fichiers existants
- `src/lib/orchestrator.ts` - Orchestrateur principal
- `src/ingestors/base.ts` - Interface BaseConnector
- `src/ingestors/*.ts` - Connecteurs spécifiques (Ticketmaster, Meetup, etc.)
- `prisma/schema.prisma` - Modèle ImportJob

## Plan d'Amélioration

### Tâche 1 : ImportJob enrichi
- Ajouter champs détaillés pour meilleure traçabilité
- Créer dashboard admin pour visualisation

### Tâche 2 : Architecture commune
- Interface IngestionSource standardisée
- Refactorer connecteurs existants
- Orchestrateur simplifié

### Tâche 3 : Eventbrite MVP
- Connecteur Eventbrite fonctionnel
- Mapping complet vers Event

### Tâche 4 : Déduplication améliorée
- Utiliser (source, sourceId) comme clé primaire
- Fallback sur titre+date+lieu

### Tâche 5 : Sources futures
- Squelettes Open Data Montréal
- Squelette ICS générique

### Tâche 6 : Documentation
- README-ingestion.md complet
- Guide d'ajout de source




