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

### 🟩 SPRINT 2 — CLASSIFICATION IA & TAGGING INTELLIGENT 🔄
**Statut** : 🔄 En cours  
**Objectif** : Taxonomie complète, IA classification automatique, tags affichés, filtres avancés

**Livrables** :
- ✅ Taxonomy complète (`src/lib/tagging/taxonomy.ts`)
- ✅ Classification IA (`src/lib/tagging/aiClassifier.ts`)
- ✅ Service d'enrichissement (`src/lib/tagging/eventTaggingService.ts`)
- ✅ Intégration dans l'ingestion (enrichissement automatique)
- ✅ Affichage tags EventCard (EventTagsDisplay créé)
- ✅ Affichage tags EventPage (EventTagsDisplay intégré)
- 🔄 Filtres avancés sur `/carte` et `/` (en cours)
- ✅ API supporte filtres `type`, `genre`, `ambiance`, `public`

**Résultats** :
- 78% des événements (368/474) ont des tags IA structurés
- Tags affichés dans EventCard et EventPage
- Filtres API prêts, UI en cours

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

### 🟧 SPRINT 4 — PUBLISH ONCE → PUBLISH EVERYWHERE 📋
**Statut** : 📋 Planifié  
**Objectif** : Système complet de publication multi-plateformes (Facebook, Eventbrite, RA, Bandsintown)

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

### 🟥 SPRINT 5 — MONÉTISATION (STRIPE + BOOSTS + NOTIFS PAYANTES) 📋
**Statut** : 📋 Planifié  
**Objectif** : Stripe Subscriptions, Payments one-shot, Boosts, Notifications payantes, Dashboard PRO

**Tâches principales** :
1. Stripe (produits, prix, webhooks, modèle Subscription)
2. Boosts événements (boostedUntil, boostedLevel)
3. Notifications ciblées (NotificationCredit, décrémenter crédits)
4. Dashboard PRO organisateur (statistiques, vues, clicks, favoris)

**Documentation** : À créer

---

### 🟪 SPRINT 6 — SOCIAL + RECOMMANDATIONS 📋
**Statut** : 📋 Planifié  
**Objectif** : Suivre organisateurs, feed événement, recommandations IA, partage social + QR code

**Tâches principales** :
1. Follow Organisateur (OrganizerFollow, notifications)
2. Feed événement (CRUD texte, images, vidéos)
3. Recommandations IA (basé sur favoris, historique, genres)
4. Page "Pour toi" personnalisée
5. QR code + partage

**Documentation** : À créer

---

## 📊 Résumé des Sprints

| Sprint | Statut | Priorité | Complexité |
|--------|--------|----------|------------|
| SPRINT 1 | ✅ Complété | - | - |
| SPRINT 2 | 🔄 En cours | Haute | Moyenne |
| SPRINT 3 | ✅ Complété | - | - |
| SPRINT 4 | 📋 Planifié | Haute | Élevée |
| SPRINT 5 | 📋 Planifié | Moyenne | Élevée |
| SPRINT 6 | 📋 Planifié | Basse | Moyenne |

---

## 🎯 Prochaines Étapes Recommandées

1. **Terminer SPRINT 2** : Compléter les filtres avancés sur `/carte` et `/`
2. **Commencer SPRINT 4** : Système de publication multi-plateformes
3. **SPRINT 5** : Monétisation (après SPRINT 4)
4. **SPRINT 6** : Social et recommandations (après SPRINT 5)

---

## 📝 Notes

- Les sprints doivent être réalisés **dans l'ordre**
- Chaque sprint doit être complété avant de passer au suivant
- Ne rien casser du code existant
- Utiliser uniquement des sources d'ingestion légales (pas de scraping HTML)

---

**Dernière mise à jour** : Janvier 2025

