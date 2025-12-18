# 📋 Ce Qui Reste À Faire - Pulse Montréal

**Date** : Décembre 2025  
**Dernière mise à jour** : Après Sprint V1-V3 + Améliorations UX/UI/Performance

---

## ✅ État Actuel

### Sprints Complétés
- ✅ **Sprint 1** : Ingestion légale et stable
- ✅ **Sprint 2** : Classification IA & Tagging intelligent
- ✅ **Sprint 3** : Notifications & Favoris avancés
- ✅ **Sprint 4** : Publish Once → Publish Everywhere
- ✅ **Sprint V1** : Viral mechanics (partage + instrumentation)
- ✅ **Sprint V2** : Social proof + trending
- ✅ **Sprint V3** : Pulse Picks growth engine
- ✅ **Améliorations UX/UI/Performance** : Optimisations majeures

### Sprints Partiellement Complétés
- 🔄 **Sprint 6** : ~85% complété (manque Apple Music OAuth)

### Sprints En Attente
- ⏸️ **Sprint 5** : Monétisation (Stripe, Boosts, Notifications payantes)

---

## 🎯 Priorité HAUTE - À Faire En Premier

### 1. **Finaliser Sprint 6 - Apple Music OAuth** (Optionnel mais prévu)
**Complexité** : Moyenne | **Priorité** : Haute | **Temps estimé** : 4-6h

#### Tâches
- [ ] Créer `src/lib/music-services/apple-music.ts`
- [ ] API endpoints :
  - [ ] `POST /api/user/music-services/apple-music/connect`
  - [ ] `GET /api/user/music-services/apple-music/callback`
  - [ ] `DELETE /api/user/music-services/apple-music`
- [ ] Intégration dans la page profil
- [ ] Mapping genres Apple Music → Pulse taxonomy
- [ ] Synchronisation automatique des goûts

**Note** : Nécessite Apple Developer Account et configuration

---

### 2. **Améliorations UX Favoris** (Partiellement fait)
**Complexité** : Faible | **Priorité** : Haute | **Temps estimé** : 2-3h

#### Tâches
- [x] Animations au clic (✅ fait)
- [x] Feedback visuel amélioré (✅ fait)
- [ ] Badge compteur favoris dans la navigation
- [ ] Suggestions basées sur favoris
- [ ] Améliorer la page favoris (design, tri, recherche)

---

### 3. **Notifications Push Fonctionnelles**
**Complexité** : Moyenne | **Priorité** : Haute | **Temps estimé** : 3-4h

#### Tâches
- [ ] Vérifier configuration VAPID keys
- [ ] Tester notifications push sur différents navigateurs
- [ ] Notifications push mobile (PWA)
- [ ] Préférences utilisateur granulaires
- [ ] Gestion des notifications groupées

---

### 4. **Performance - Optimisations Restantes**
**Complexité** : Moyenne | **Priorité** : Haute | **Temps estimé** : 4-6h

#### Tâches
- [ ] Pagination cursor-based pour meilleures performances
- [ ] Code splitting optimisé (dynamic imports pour composants lourds)
- [ ] Cache Redis pour recommandations (optionnel mais recommandé)
- [ ] Vérifier et optimiser les requêtes Prisma N+1 restantes
- [ ] Ajouter des index sur les champs fréquemment filtrés

---

## 🟡 Priorité MOYENNE - Important Mais Pas Urgent

### 5. **Analytics & Monitoring**
**Complexité** : Moyenne | **Priorité** : Moyenne | **Temps estimé** : 6-8h

#### Tâches
- [ ] Analytics événements (Google Analytics / Plausible)
- [ ] Tracking conversions (partages, favoris, clics)
- [ ] Dashboard analytics pour admins
- [ ] A/B testing (optionnel)
- [ ] Logs structurés améliorés

**Note** : Sentry déjà configuré pour monitoring

---

### 6. **Documentation**
**Complexité** : Faible | **Priorité** : Moyenne | **Temps estimé** : 4-6h

#### Tâches
- [ ] Documentation API publique (OpenAPI/Swagger)
- [ ] Guide développeur (setup, architecture)
- [ ] Documentation déploiement (Vercel, env vars)
- [ ] Guide utilisateur organisateur
- [ ] Changelog maintenu automatiquement

---

### 7. **Améliorations Recherche**
**Complexité** : Moyenne | **Priorité** : Moyenne | **Temps estimé** : 4-5h

#### Tâches
- [ ] Recherche par tags structurés améliorée
- [ ] Autocomplétion intelligente
- [ ] Filtres sauvegardés (localStorage ou DB)
- [ ] Recherche sémantique (optionnel, complexe)

---

### 8. **Page Favoris Améliorée**
**Complexité** : Faible | **Priorité** : Moyenne | **Temps estimé** : 2-3h

#### Tâches
- [ ] Design amélioré
- [ ] Tri par date, popularité, distance
- [ ] Recherche dans les favoris
- [ ] Filtres (catégories, genres)
- [ ] Export ICS amélioré

---

## 🔵 Priorité BASSE - Nice To Have

### 9. **PWA Avancé**
**Complexité** : Moyenne | **Priorité** : Basse | **Temps estimé** : 6-8h

#### Tâches
- [ ] Service Worker optimisé
- [ ] Offline mode (cache stratégique)
- [ ] Installation PWA améliorée
- [ ] Notifications push mobile

---

### 10. **Dark Mode**
**Complexité** : Faible | **Priorité** : Basse | **Temps estimé** : 3-4h

#### Tâches
- [ ] Système de thème (light/dark)
- [ ] Toggle dans les paramètres
- [ ] Persistance préférence utilisateur
- [ ] Adaptation de tous les composants

---

### 11. **Sécurité & Conformité**
**Complexité** : Moyenne | **Priorité** : Basse | **Temps estimé** : 4-6h

#### Tâches
- [ ] Audit de sécurité
- [ ] RGPD compliance (politique de confidentialité à jour)
- [ ] Gestion des données utilisateur (export, suppression)
- [ ] Rate limiting amélioré
- [ ] Validation des inputs renforcée

---

## ⏸️ Sprint 5 - Monétisation (En Attente)

**Complexité** : Élevée | **Priorité** : Moyenne (quand prêt) | **Temps estimé** : 20-30h

### Fonctionnalités
1. **Stripe Subscriptions**
   - Modèle `Subscription` dans Prisma
   - Produits Stripe (PRO, BASIC)
   - Webhooks Stripe
   - Page de pricing complète
   - Dashboard organisateur avec gestion abonnements

2. **Boosts Événements**
   - Champs `boostedUntil` et `boostedLevel` au modèle Event
   - API pour booster un événement (paiement Stripe)
   - Logique d'affichage prioritaire
   - Badge "Boosté" sur les événements

3. **Notifications Payantes**
   - Modèle `NotificationCredit` dans Prisma
   - Système de crédits par organisateur
   - Achat de crédits via Stripe
   - Dashboard avec solde de crédits

4. **Dashboard PRO Organisateur**
   - Statistiques avancées (vues, clicks, favoris, conversions)
   - Graphiques et analytics
   - Export de données
   - Insights et recommandations

**Note** : Nécessite configuration Stripe complète

---

## 🐛 Bugs & Corrections À Vérifier

### À Tester
- [ ] Filtres de date (timezone Montréal correctement gérée ?)
- [ ] CRON jobs fonctionnent correctement ?
- [ ] Événements expirés sont-ils supprimés ?
- [ ] Performance des recommandations (cache ?)
- [ ] Gestion des erreurs OAuth (tokens expirés)

---

## 📊 Sources d'Ingestion - TODOs

### Sources Non Implémentées (Scraping interdit)
- [ ] Open Data Montréal (squelette créé, à implémenter avec API officielle)
- [ ] ICS générique (squelette créé, à compléter)
- [ ] LaVitrine (scraping nécessaire, interdit)
- [ ] AllEvents (scraping nécessaire, interdit)
- [ ] Quartier des Spectacles (scraping nécessaire, interdit)
- [ ] Tourisme Montréal (scraping nécessaire, interdit)

**Note** : Ces sources nécessitent des APIs officielles. Le scraping HTML est interdit.

---

## 🎯 Recommandations Par Ordre de Priorité

### Phase 1 - Court Terme (1-2 semaines)
1. ✅ Améliorations UX/UI/Performance (FAIT)
2. 🔄 Finaliser Sprint 6 - Apple Music OAuth
3. 🔄 Notifications push fonctionnelles
4. 🔄 Badge compteur favoris + améliorations page favoris

### Phase 2 - Moyen Terme (1 mois)
1. Analytics & Monitoring
2. Documentation complète
3. Améliorations recherche
4. Performance - Pagination cursor-based

### Phase 3 - Long Terme (2-3 mois)
1. Sprint 5 - Monétisation (quand prêt)
2. PWA avancé
3. Dark mode
4. Sécurité & Conformité

---

## 📈 Statistiques Actuelles

- **Sprints complétés** : 7/9 (Sprint 1-4, V1-V3)
- **Sprint 6** : ~85% complété
- **Sprint 5** : 0% (en attente)
- **Fonctionnalités principales** : ✅ Opérationnelles
- **Performance** : ✅ Optimisée (récentes améliorations)
- **UX/UI** : ✅ Améliorée (récentes améliorations)

---

## 💡 Notes Importantes

1. **Pas de scraping** : Toutes les sources doivent utiliser des APIs officielles
2. **Performance** : Les améliorations récentes ont déjà optimisé beaucoup de choses
3. **Monétisation** : Sprint 5 peut attendre jusqu'à ce que le produit soit validé
4. **Apple Music** : Optionnel mais prévu dans Sprint 6
5. **Documentation** : Important pour la maintenabilité à long terme

---

**Dernière mise à jour** : Décembre 2025

