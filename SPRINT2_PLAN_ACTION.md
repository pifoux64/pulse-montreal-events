# 🟩 SPRINT 2 — CLASSIFICATION IA & TAGGING INTELLIGENT - Plan d'Action

**Date**: Janvier 2025  
**Objectif**: Taxonomie complète, IA classification automatique, tags affichés, filtres avancés

---

## 📊 État Actuel vs Objectifs

### ✅ Déjà Complété
- ✅ Taxonomy complète : `src/lib/tagging/taxonomy.ts`
  - Genres musicaux principaux
  - Types d'événements
  - Ambiances
  - Publics
- ✅ Classification IA : `src/lib/tagging/aiClassifier.ts`
  - Utilise GPT-4.1-mini
  - Retry avec backoff exponentiel
  - Filtrage strict selon taxonomie
- ✅ Service d'enrichissement : `src/lib/tagging/eventTaggingService.ts`
  - Fonction `enrichEventWithTags(eventId)`
  - Écrit dans table EventTag

### 🔄 À Compléter
- [x] Intégration dans l'ingestion (enrichir automatiquement après import) ✅ FAIT
- [ ] Affichage des tags structurés dans EventCard
- [ ] Affichage des tags structurés dans EventPage
- [ ] Filtres avancés sur `/carte` et `/` (accueil)
- [x] API pour récupérer les EventTag avec les événements ✅ FAIT (ligne 406 de route.ts)

---

## 🎯 Tâches Détaillées

### 1. ✅ Taxonomy (FAIT)
**Statut**: ✅ Complété

**Fichier**: `src/lib/tagging/taxonomy.ts`

**Contenu**:
- `EVENT_TYPES` : Types d'événements (concert, dj_set, soiree_club, etc.)
- `GENRES` : Genres musicaux principaux (reggae, hip_hop, pop, techno, etc.)
- `AMBIANCES` : Ambiances (salle_de_concert, warehouse, exterieur, etc.)
- `PUBLICS` : Publics (tout_public, 18_plus, famille)
- `MUSIC_STYLES` : Styles musicaux par genre (pour référence future)

**Action**: Aucune action requise

---

### 2. ✅ Classification IA (FAIT)
**Statut**: ✅ Complété

**Fichier**: `src/lib/tagging/aiClassifier.ts`

**Fonctionnalités**:
- Appel OpenAI GPT-4.1-mini
- Retry automatique avec backoff exponentiel
- Gestion des rate limits (429)
- Filtrage strict selon taxonomie
- Prompt optimisé pour genres principaux uniquement

**Action**: Aucune action requise

---

### 3. ✅ Service d'enrichissement (FAIT)
**Statut**: ✅ Complété

**Fichier**: `src/lib/tagging/eventTaggingService.ts`

**Fonction**: `enrichEventWithTags(eventId)`
- Charge l'événement + venue
- Appelle `classifyEventWithAI`
- Filtre les tags avec `filterToAllowedTags`
- Remplace les EventTag existants (transaction)

**Action**: Aucune action requise

---

### 4. ✅ Intégration dans l'ingestion
**Statut**: ✅ Complété

**Objectif**: Enrichir automatiquement les événements après chaque ingestion

**Implémentation**:
- ✅ `enrichEventWithTags` appelé automatiquement après création (ligne 596)
- ✅ `enrichEventWithTags` appelé automatiquement après mise à jour (ligne 638)
- ✅ Gestion d'erreurs : Les erreurs de tagging ne bloquent pas l'ingestion
- ✅ Variable d'environnement : `DISABLE_TAG_ENRICHMENT` pour désactiver si nécessaire

**Résultats** :
- 78% des événements (368/474) ont des tags IA structurés
- Enrichissement automatique fonctionnel

**Fichiers**:
- `src/lib/orchestrator.ts` (lignes 593-604 et 635-645)

**Action**: Aucune action requise

---

### 5. 🆕 Affichage tags dans EventCard
**Statut**: 🆕 À implémenter

**Objectif**: Afficher les tags structurés (EventTag) dans EventCard

**Actions**:
1. Modifier le type `Event` pour inclure `eventTags` (relation Prisma)
2. Récupérer les EventTag lors de la requête des événements
3. Afficher les badges pour :
   - Type d'événement
   - Genres musicaux (avec emoji et couleur)
   - Ambiance
   - Public
4. Conserver l'affichage actuel des tags musicaux enrichis comme fallback

**Fichiers à modifier**:
- `src/types/index.ts` (ajouter eventTags au type Event)
- `src/app/api/events/route.ts` (inclure eventTags dans la requête)
- `src/components/EventCard.tsx` (afficher les EventTag structurés)

---

### 6. 🆕 Affichage tags dans EventPage
**Statut**: 🆕 À implémenter

**Objectif**: Afficher tous les tags structurés sur la page de détail

**Actions**:
1. Récupérer les EventTag dans la page de détail
2. Afficher une section "Tags" avec :
   - Type d'événement
   - Genres musicaux (liste complète)
   - Ambiances
   - Public
3. Design cohérent avec EventCard

**Fichiers à modifier**:
- `src/app/evenement/[id]/page.tsx` (inclure eventTags)
- Créer un composant `EventTagsDisplay.tsx` pour réutiliser l'affichage

---

### 7. 🆕 Filtres avancés
**Statut**: 🆕 À implémenter

**Objectif**: Ajouter des filtres par tags structurés sur `/carte` et `/` (accueil)

**Filtres à ajouter**:
- **Type** : concert, dj_set, soiree_club, etc.
- **Genres** : reggae, hip_hop, pop, techno, etc.
- **Ambiance** : salle_de_concert, warehouse, exterieur, etc.
- **Public** : tout_public, 18_plus, famille
- **Gratuit/Payant** : free / paid

**Actions**:
1. Créer composant `AdvancedFilters.tsx`
2. Modifier `src/app/api/events/route.ts` pour supporter les filtres par EventTag
3. Ajouter les filtres dans :
   - `src/components/OptimizedHomePage.tsx` (page d'accueil)
   - `src/components/OptimizedCartePage.tsx` (page carte)
4. UI avec checkboxes/multi-select pour chaque catégorie de tags

**Fichiers à créer/modifier**:
- `src/components/AdvancedFilters.tsx` (nouveau)
- `src/app/api/events/route.ts` (ajouter filtres EventTag)
- `src/components/OptimizedHomePage.tsx` (intégrer filtres)
- `src/components/OptimizedCartePage.tsx` (intégrer filtres)

---

## 📋 Checklist Finale SPRINT 2

- [x] Taxonomy complète
- [x] Classification IA fonctionnelle
- [x] Service d'enrichissement
- [x] Intégration dans l'ingestion (enrichir automatiquement) ✅ **FAIT - 78% d'enrichissement**
- [x] API pour récupérer EventTag ✅ **FAIT - eventTags inclus dans la réponse**
- [ ] Tags affichés dans EventCard
- [ ] Tags affichés dans EventPage
- [ ] Filtres avancés sur `/carte`
- [ ] Filtres avancés sur `/` (accueil)

---

## 🚀 Prochaines Étapes

Une fois le SPRINT 2 complété :
1. Tester l'enrichissement automatique sur un batch d'événements
2. Vérifier l'affichage des tags sur toutes les pages
3. Tester les filtres avancés avec différents scénarios
4. Passer au SPRINT 3 (Notifications & Favoris Avancés)

---

## 📝 Notes Techniques

### Performance
- L'enrichissement IA peut être coûteux (OpenAI API)
- Considérer un batch processing pour enrichir plusieurs événements
- Mettre en cache les résultats de classification si possible

### Fallback
- Si les EventTag ne sont pas disponibles, utiliser les tags musicaux enrichis actuels
- Si l'IA échoue, ne pas bloquer l'affichage de l'événement

### UX
- Les filtres doivent être intuitifs et visuellement clairs
- Afficher le nombre de résultats après filtrage
- Permettre de combiner plusieurs filtres

---

**Note**: Le système de tagging IA est déjà bien implémenté. Il reste principalement à l'intégrer dans l'UI et l'ingestion.

