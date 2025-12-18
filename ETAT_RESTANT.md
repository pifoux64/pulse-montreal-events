# 📋 État des Fonctionnalités Restantes - Pulse Montréal

**Date** : Décembre 2025

---

## ✅ SPRINT 6 — Partiellement Complété

### ✅ Fait
1. ✅ **Connexion Spotify** (OAuth, synchronisation, détection genres/styles)
2. ✅ **Page profil** avec préférences musicales manuelles
3. ✅ **Moteur de recommandations** personnalisées (scoring complet)
4. ✅ **Page "Pour toi"** avec recommandations
5. ✅ **Notifications personnalisées** (CRON job toutes les heures)
6. ✅ **QR code + partage** amélioré (Facebook, Twitter, LinkedIn)
7. ✅ **Follow Organisateur** avec notifications automatiques
8. ✅ **Feed événement** (déjà implémenté : EventPost, EventPostMedia)

### ❌ Reste à faire

#### 1. **OAuth Apple Music** (Optionnel - Phase 6)
- [ ] Créer `src/lib/music-services/apple-music.ts`
- [ ] API endpoints :
  - [ ] `POST /api/user/music-services/apple-music/connect`
  - [ ] `GET /api/user/music-services/apple-music/callback`
  - [ ] `DELETE /api/user/music-services/apple-music`
- [ ] Intégration dans la page profil
- [ ] Mapping genres Apple Music → Pulse taxonomy
- [ ] Synchronisation automatique des goûts

**Complexité** : Moyenne  
**Priorité** : Basse (après validation Spotify)  
**Note** : Nécessite Apple Developer Account et configuration

---

## ⏸️ SPRINT 5 — MONÉTISATION (En attente)

### Fonctionnalités à implémenter

#### 1. **Stripe Subscriptions**
- [ ] Modèle `Subscription` dans Prisma (déjà partiellement défini)
- [ ] Produits Stripe (PRO, BASIC)
- [ ] Webhooks Stripe (gestion abonnements)
- [ ] API endpoints :
  - [ ] `POST /api/organizers/subscription` (créer/modifier)
  - [ ] `GET /api/organizers/subscription` (statut)
  - [ ] `POST /api/stripe/webhook` (webhook handler)
- [ ] Page de pricing (`/pricing` existe mais à compléter)
- [ ] Gestion des abonnements dans dashboard organisateur

#### 2. **Boosts Événements**
- [ ] Ajouter champs `boostedUntil` et `boostedLevel` au modèle Event
- [ ] API pour booster un événement (paiement Stripe)
- [ ] Logique d'affichage prioritaire (homepage, carte)
- [ ] Badge "Boosté" sur les événements
- [ ] Dashboard avec statistiques de boost

#### 3. **Notifications Payantes**
- [ ] Modèle `NotificationCredit` dans Prisma
- [ ] Système de crédits par organisateur
- [ ] Décrémenter crédits lors d'envoi notifications ciblées
- [ ] Achat de crédits via Stripe
- [ ] Dashboard avec solde de crédits

#### 4. **Dashboard PRO Organisateur**
- [ ] Statistiques avancées (vues, clicks, favoris, conversions)
- [ ] Graphiques et analytics
- [ ] Export de données
- [ ] Comparaison avec période précédente
- [ ] Insights et recommandations

**Complexité** : Élevée  
**Priorité** : Moyenne (monétisation importante mais reportée)  
**Note** : Nécessite configuration Stripe complète

---

## 🔧 Améliorations & Optimisations

### 1. **Performance**
- [ ] Optimisation des requêtes Prisma (N+1 queries)
- [ ] Cache Redis pour recommandations
- [ ] Pagination améliorée (cursor-based)
- [ ] Lazy loading des images
- [ ] Code splitting optimisé

### 2. **UX/UI**
- [ ] Améliorer l'UX des favoris (animations, feedback)
- [ ] Page "Mes organisateurs suivis" dans profil
- [ ] Statistiques de recommandations (pourquoi recommandé)
- [ ] Améliorer la page favoris (design, tri, recherche)
- [ ] Dark mode (optionnel)

### 3. **Notifications**
- [ ] Notifications push fonctionnelles (vérifier configuration VAPID)
- [ ] Notifications email améliorées
- [ ] Préférences utilisateur granulaires
- [ ] Gestion des notifications groupées

### 4. **Recherche**
- [ ] Recherche par tags structurés améliorée
- [ ] Recherche sémantique (optionnel)
- [ ] Autocomplétion intelligente
- [ ] Filtres sauvegardés

### 5. **Social & Partage**
- [ ] Partage amélioré (Open Graph tags)
- [ ] Statistiques de partage
- [ ] Liens de tracking (UTM)
- [ ] Intégration réseaux sociaux (optionnel)

---

## 🐛 Bugs & Corrections

### À vérifier
- [ ] Filtres de date (timezone Montréal correctement gérée ?)
- [ ] CRON jobs fonctionnent correctement ?
- [ ] Événements expirés sont-ils supprimés ?
- [ ] Performance des recommandations (cache ?)
- [ ] Gestion des erreurs OAuth (tokens expirés)

---

## 📱 Mobile & PWA

### PWA
- [ ] Service Worker optimisé
- [ ] Offline mode (cache stratégique)
- [ ] Installation PWA améliorée
- [ ] Notifications push mobile

### Mobile
- [ ] Responsive design amélioré
- [ ] Touch gestures
- [ ] Performance mobile optimisée

---

## 📊 Analytics & Monitoring

- [ ] Analytics événements (Google Analytics / Plausible)
- [ ] Tracking conversions
- [ ] A/B testing (optionnel)
- [ ] Monitoring performance (Sentry déjà configuré)
- [ ] Logs structurés

---

## 🔐 Sécurité & Conformité

- [ ] Audit de sécurité
- [ ] RGPD compliance (politique de confidentialité à jour)
- [ ] Gestion des données utilisateur (export, suppression)
- [ ] Rate limiting amélioré
- [ ] Validation des inputs renforcée

---

## 📚 Documentation

- [ ] Documentation API publique
- [ ] Guide développeur
- [ ] Documentation déploiement
- [ ] Guide utilisateur organisateur
- [ ] Changelog maintenu

---

## 🎯 Priorités Recommandées

### Priorité HAUTE
1. **Finaliser SPRINT 6** : Apple Music (optionnel mais prévu)
2. **Améliorations UX** : Favoris, notifications
3. **Performance** : Optimisation requêtes, cache

### Priorité MOYENNE
1. **SPRINT 5** : Monétisation (quand prêt)
2. **Analytics** : Tracking et métriques
3. **Documentation** : API publique

### Priorité BASSE
1. **PWA avancé** : Offline mode
2. **Recherche sémantique** : Amélioration recherche
3. **Dark mode** : Optionnel

---

## 📈 Statistiques Actuelles

- **Sprints complétés** : 4/6 (Sprint 1, 2, 3, 4)
- **Sprint 6** : ~85% complété (manque Apple Music)
- **Sprint 5** : 0% (en attente)
- **Fonctionnalités principales** : ✅ Opérationnelles
- **Recommandations** : ✅ Fonctionnelles
- **Monétisation** : ⏸️ En attente

---

**Dernière mise à jour** : Décembre 2025

