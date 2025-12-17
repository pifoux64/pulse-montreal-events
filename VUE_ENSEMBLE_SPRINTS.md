# 📋 Vue d'Ensemble - Sprints Pulse Montréal

**Date de mise à jour** : Janvier 2025

---

## 🎯 Sprints du Plan d'Affaires

### 🟦 SPRINT 1 — INGESTION LÉGALE ET STABLE ✅
**Statut** : ✅ Complété  
**Objectif** : Conserver uniquement les sources légales, stabiliser l'ingestion, atteindre 300+ événements

**Livrables** :
- ✅ Sources non-API désactivées
- ✅ Ticketmaster stabilisé (pagination améliorée)
- ✅ Open Data Montréal connecteur créé
- ✅ Eventbrite limitations documentées
- ✅ 474 événements futurs ingérés (objectif 300+ atteint !)
- ✅ Dashboard admin `/admin/ingestion`
- ✅ Orchestrateur stable avec gestion d'erreurs

**Documentation** : `SPRINT1_PLAN_ACTION.md`, `SPRINT1_COMPLETE.md`

---

### 🟩 SPRINT 2 — CLASSIFICATION IA & TAGGING INTELLIGENT ✅
**Statut** : ✅ Complété  
**Objectif** : Taxonomie complète, IA classification automatique, tags affichés, filtres avancés

**Livrables** :
- ✅ Taxonomy complète (`src/lib/tagging/taxonomy.ts`)
- ✅ Classification IA (`src/lib/tagging/aiClassifier.ts`)
- ✅ Service d'enrichissement (`src/lib/tagging/eventTaggingService.ts`)
- ✅ Intégration dans l'ingestion (enrichissement automatique)
- ✅ Affichage tags EventCard (EventTagsDisplay créé)
- ✅ Affichage tags EventPage (EventTagsDisplay intégré)
- ✅ Filtres avancés sur `/carte` et `/` (complété)
- ✅ API supporte filtres `type`, `genre`, `ambiance`, `public`

**Résultats** :
- 78% des événements (368/474) ont des tags IA structurés
- Tags affichés dans EventCard et EventPage
- Filtres avancés disponibles sur page d'accueil et carte
- UI complète avec filtres par type, ambiance, public

**Documentation** : `SPRINT2_PLAN_ACTION.md`, `SPRINT2_AVANCEMENT.md`

---

### 🟨 SPRINT 3 — NOTIFICATIONS & FAVORIS AVANCÉS ✅
**Statut** : ✅ Complété  
**Objectif** : Notifications push, notifications email, rappels, préférences utilisateur

**Livrables** :
- ✅ Web Push (Service Worker, VAPID keys)
- ✅ Email notifications (Resend)
- ✅ Préférences utilisateur (`/settings/notifications`)
- ✅ Favoris avec animations et feedback
- ✅ Migration localStorage → DB
- ✅ CRON job rappels (toutes les heures)

**Documentation** : Voir code source dans `src/lib/notifications/`, `src/hooks/useNotificationSubscription.ts`

---

### 🟧 SPRINT 4 — PUBLISH ONCE → PUBLISH EVERYWHERE ✅
**Statut** : ✅ Complété  
**Objectif** : Système complet de publication multi-plateformes (Facebook, Eventbrite, RA, Bandsintown)

**Livrables** :
- ✅ Schéma d'événement universel
- ✅ Modules de publication (Facebook, Eventbrite, RA, Bandsintown)
- ✅ Modèles Prisma (PlatformConnection, PublicationLog)
- ✅ Page d'intégrations organisateur
- ✅ Callbacks OAuth Facebook et Eventbrite
- ✅ Bouton "Publier partout" dans l'UI
- ✅ Champs "Lineup" et "Description longue" dans le formulaire
- ✅ Orchestrateur de publication
- ✅ API endpoints complets

**Tâches principales** :

1. **Modèle d'événement universel (Event Universal Schema)**
   - Schéma unifié pour toutes les plateformes
   - Fichiers : `src/lib/publishing/universalEventSchema.ts`, `validators.ts`

2. **Mise à jour formulaire de création**
   - Ajouter champ "Lineup" (artistes)
   - Ajouter champ "Description longue"
   - Validation des champs requis pour publication

3. **Modules de publication**
   - `facebookPublisher.ts` : Graph API pour créer/mettre à jour Facebook Events
   - `eventbritePublisher.ts` : API Eventbrite avec création lieu
   - `residentAdvisorExporter.ts` : Export fichier RA-ready (JSON/CSV)
   - `bandsintownPublisher.ts` : API Bandsintown (si disponible)

4. **Page `/organisateur/integrations`**
   - Connexion Facebook Page (OAuth)
   - Connexion Eventbrite Organizer (OAuth)
   - Affichage statut des connexions
   - Gestion tokens OAuth

5. **Bouton "Publier partout"**
   - Validation des champs
   - Appel des publishers
   - Enregistrement PublicationLog dans la DB

6. **Synchronisation automatique**
   - Si événement Pulse change → synchroniser avec plateformes connectées
   - Gestion des conflits

7. **Gestion des erreurs**
   - Tokens expirés
   - Permissions manquantes
   - Champs obligatoires manquants
   - Rate limiting avec retry

8. **Documentation**
   - `docs/PUBLISHING.md` : Guide complet

**Modèles Prisma à créer** :
- `PlatformConnection` : Stockage tokens OAuth par plateforme
- `PublicationLog` : Logs de publication avec statuts

**Documentation** : `SPRINT4_PUBLISH_EVERYWHERE.md`

---

### 🟥 SPRINT 5 — MONÉTISATION (STRIPE + BOOSTS + NOTIFS PAYANTES) ⏸️
**Statut** : ⏸️ En attente (reporté)  
**Objectif** : Stripe Subscriptions, Payments one-shot, Boosts, Notifications payantes, Dashboard PRO

**Tâches principales** :
1. Stripe (produits, prix, webhooks, modèle Subscription)
2. Boosts événements (boostedUntil, boostedLevel)
3. Notifications ciblées (NotificationCredit, décrémenter crédits)
4. Dashboard PRO organisateur (statistiques, vues, clicks, favoris)

**Documentation** : À créer

---

### 🟪 SPRINT 6 — SOCIAL + RECOMMANDATIONS PERSONNALISÉES 📋
**Statut** : 📋 Planifié  
**Objectif** : Recommandations ultra-personnalisées basées sur Spotify/Apple Music + préférences utilisateur, feed événement, partage social

**Tâches principales** :
1. **Connexion Spotify & Apple Music** (OAuth, synchronisation automatique)
2. **Analyse des goûts musicaux** (extraction genres/styles depuis historique d'écoute)
3. **Page de profil avec préférences musicales** (genres, styles, types, ambiances)
4. **Moteur de recommandations personnalisées** (scoring basé sur goûts musicaux)
5. **Page "Pour toi"** (événements recommandés avec explications)
6. **Notifications personnalisées** (alertes pour nouveaux événements correspondant aux goûts)
7. Follow Organisateur (OrganizerFollow, notifications)
8. Feed événement (CRUD texte, images, vidéos)
9. QR code + partage

**Fonctionnalités clés** :
- ✅ Connexion Spotify/Apple Music en 2 clics
- ✅ Détection automatique des goûts musicaux (reggae, dancehall, etc.)
- ✅ Préférences manuelles dans le profil
- ✅ Recommandations basées sur l'écoute réelle
- ✅ Notifications ciblées par genre/style

**Documentation** : `SPRINT6_RECOMMANDATIONS_PERSONNALISEES.md`

---

## 📊 Résumé des Sprints

| Sprint | Statut | Priorité | Complexité |
|--------|--------|----------|------------|
| SPRINT 1 | ✅ Complété | - | - |
| SPRINT 2 | ✅ Complété | - | - |
| SPRINT 3 | ✅ Complété | - | - |
| SPRINT 4 | ✅ Complété | - | - |
| SPRINT 5 | ⏸️ En attente | - | - |
| SPRINT 6 | 📋 Planifié | Haute | Élevée |

---

## 🎯 Prochaines Étapes Recommandées

1. **✅ SPRINT 2 complété** : Tous les filtres avancés sont implémentés
2. **✅ SPRINT 4 complété** : Système de publication multi-plateformes opérationnel
3. **SPRINT 6** : Social et recommandations personnalisées (Spotify/Apple Music)
4. **SPRINT 5 (plus tard)** : Monétisation (Stripe, Boosts, Notifications payantes)

---

## 📝 Notes

- Les sprints doivent être réalisés **dans l'ordre**
- Chaque sprint doit être complété avant de passer au suivant
- Ne rien casser du code existant
- Utiliser uniquement des sources d'ingestion légales (pas de scraping HTML)

---

**Dernière mise à jour** : Janvier 2025

