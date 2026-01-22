# 🗺️ Guide d'Accès Rapide - Tous les Sprints

## 🚀 Démarrage

```bash
# Lancer le serveur
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000
```

---

## 📍 Routes Principales par Sprint

### 🟢 SPRINT 0 - Fondations Structurelles

**Modèles de données créés** (visibles via Prisma Studio) :
```bash
npx prisma studio
# Ouvrir les tables : venues, venue_requests
```

---

### 🟣 SPRINT 1 - Fiche Salle Publique

**Route :** `/salle/[slug]`

**Comment y accéder :**
1. Créer une salle via `/venue/dashboard` (Sprint 2)
2. La salle aura un slug généré automatiquement
3. Visiter `/salle/[slug]` (ex: `/salle/bar-le-foufounes-electriques`)

**Fonctionnalités visibles :**
- Description de la salle
- Informations pratiques (capacité, types, contact)
- Carte interactive
- Événements à venir
- Événements ce week-end
- Événements passés

**Lien depuis événement :**
- Sur chaque page d'événement (`/evenement/[id]`), si l'événement a une salle avec slug, un lien vers `/salle/[slug]` apparaît

---

### 🟣 SPRINT 2 - Dashboard Salle

**Route :** `/venue/dashboard`

**Comment y accéder :**
1. Se connecter avec un compte utilisateur
2. Aller sur `/venue/dashboard`
3. Si première visite, onboarding en 3 étapes

**Fonctionnalités :**
- **Créer une salle** : Formulaire avec géocodage automatique
- **Modifier une salle** : Édition des informations
- **Statistiques** : Vues, favoris (total et 30 derniers jours)
- **Calendrier** : Événements à venir de la salle
- **Génération automatique de slug** : SEO-friendly

**Exemple de création :**
- Nom : "Bar Le Foufounes Électriques"
- Adresse : "87 Rue Sainte-Catherine E, Montréal"
- Le slug sera généré automatiquement : `bar-le-foufounes-electriques`

---

### 🟣 SPRINT 3 - Demande de Réservation Salle

**Côté Organisateur :**
1. Aller sur une page de salle publique : `/salle/[slug]`
2. Cliquer sur le bouton **"Demander cette salle"**
3. Remplir le formulaire :
   - Concept de l'événement
   - Dates (début et fin optionnelle)
   - Nombre de personnes attendues
   - Budget

**Côté Propriétaire de salle :**
1. Aller sur `/venue/dashboard`
2. Sélectionner une salle
3. Section **"Demandes de réservation"**
4. Voir les demandes reçues
5. Accepter ou refuser avec commentaires

**API Routes :**
- `POST /api/venue-requests` - Créer une demande
- `GET /api/venue-requests?venueId=...` - Liste pour salle
- `GET /api/venue-requests?organizerId=...` - Liste pour organisateur
- `PATCH /api/venue-requests/[id]` - Accepter/refuser

---

### 🟣 SPRINT 4 - IA pour Organisateurs

**Route :** `/organisateur/dashboard`

**Comment y accéder :**
1. Se connecter avec un compte organisateur
2. Aller sur `/organisateur/dashboard`
3. Section **"Outils IA pour Organisateurs"**

**3 Outils disponibles :**

#### 1. Assistant Événement
- **Onglet :** "Assistant"
- **Fonction :** Génère titre, description, tags, genres à partir d'une idée
- **Exemple :** "Concert rock dans un bar" → Suggestions complètes

#### 2. Générateur de Contenu
- **Onglet :** "Contenu"
- **Fonction :** Génère plan de communication, posts Facebook/Instagram
- **Entrée :** Détails de l'événement
- **Sortie :** Contenu prêt à publier

#### 3. Calculateur de Budget
- **Onglet :** "Budget"
- **Fonction :** Calcule coûts, seuil de rentabilité, suggestion de prix
- **Entrée :** Coûts (location, artistes, promotion, etc.) + capacité
- **Sortie :** Analyse financière complète

**API Routes :**
- `POST /api/ai/event-assistant`
- `POST /api/ai/content-generator`
- `POST /api/ai/budget-calculator`

---

### 🟣 SPRINT 5 - IA pour Salles

**Route :** `/venue/dashboard`

**Comment y accéder :**
1. Se connecter comme propriétaire de salle
2. Aller sur `/venue/dashboard`
3. Sélectionner une salle
4. Section **"Outils IA"**

**3 Outils disponibles :**

#### 1. Suggestions
- **Onglet :** "Suggestions"
- **Fonction :** Identifie les jours creux et types d'événements manquants
- **Basé sur :** Historique des événements de la salle

#### 2. Matching
- **Onglet :** "Matching"
- **Fonction :** Trouve des organisateurs compatibles et concepts performants
- **Basé sur :** Types d'événements, capacité, performance

#### 3. Statistiques d'occupation
- **Onglet :** "Stats"
- **Fonction :** Affiche événements par semaine, distribution par jour/catégorie, tendances
- **Données :** Événements par semaine, distribution, tendances 3 mois

**API Routes :**
- `POST /api/ai/venue-suggestions`
- `POST /api/ai/venue-matching`
- `GET /api/venues/[id]/occupation-stats`

---

### 🟣 SPRINT 6 - Social & Viralité

#### 1. Suivre des amis

**Comment :**
- Actuellement via API uniquement
- `POST /api/users/follow` avec `{ userId: "..." }`
- `DELETE /api/users/follow?userId=...` pour défollow

**Note :** Une interface UI pour suivre des utilisateurs peut être ajoutée si nécessaire.

#### 2. Événements des amis

**Route :** `/social`

**Comment y accéder :**
1. Se connecter
2. Aller sur `/social`
3. Onglet **"Mes amis"**

**Fonctionnalités :**
- Affiche les événements favorisés par vos amis
- Badge indiquant combien d'amis ont favorisé chaque événement
- Filtre les événements à venir uniquement

#### 3. Événements tendance

**Route :** `/social`

**Comment y accéder :**
1. Se connecter
2. Aller sur `/social`
3. Onglet **"Tendance"**

**Fonctionnalités :**
- Filtres : Aujourd'hui, Week-end, Semaine
- Badge "Trending" sur les événements populaires
- Basé sur favoritesToday et viewsToday

#### 4. Invitations

**Envoyer une invitation :**
1. Aller sur un événement : `/evenement/[id]`
2. Cliquer sur **"Inviter des amis"**
3. Sélectionner des amis (utilisateurs suivis)
4. Ajouter un message personnalisé
5. Envoyer

**Recevoir une invitation :**
1. Aller sur `/social`
2. Onglet **"Invitations"**
3. Voir les invitations reçues
4. Accepter ou refuser
5. Si acceptée, l'événement est ajouté aux favoris automatiquement

**API Routes :**
- `POST /api/events/invitations` - Envoyer
- `GET /api/events/invitations?type=received` - Reçues
- `GET /api/events/invitations?type=sent` - Envoyées
- `PATCH /api/events/invitations/[id]` - Répondre

#### 5. Pages éditoriales (Top 5)

**Route :** `/top-5`

**Comment y accéder :**
1. Aller sur `/top-5`
2. Voir la liste des Top 5 publiés
3. Cliquer sur un Top 5 pour voir les détails

**Exemples de Top 5 :**
- `/top-5/top-5-rock-week-2025-01-20`
- `/top-5/top-5-famille-weekend-2025-01-18`

**Génération automatique :**
- Route admin : `POST /api/editorial/auto-generate`
- Génère les Top 5 pour la semaine/week-end
- Thèmes : rock, famille, gratuit, hip_hop, techno, etc.

**API Routes :**
- `GET /api/editorial/pulse-picks/public` - Liste publique
- `GET /api/editorial/pulse-picks/genre/[genre]` - Top 5 par genre
- `POST /api/editorial/auto-generate` - Générer (admin)

---

### 🟣 SPRINT 7 - Monétisation

#### Plans d'abonnement Organisateur

**Route :** `/organisateur/dashboard`

**Comment y accéder :**
1. Se connecter comme organisateur
2. Aller sur `/organisateur/dashboard`
3. Section **"Abonnement Organisateur"**

**Plans disponibles :**
- **ORGANIZER_BASIC** : Gratuit (par défaut)
- **ORGANIZER_PRO** : 29.99 CAD/mois
  - Événements illimités
  - Statistiques avancées
  - Notifications ciblées
  - Mises en avant automatiques
  - Support prioritaire

**S'abonner :**
1. Cliquer sur "S'abonner" pour ORGANIZER_PRO
2. Redirection vers Stripe Checkout
3. Utiliser carte de test : `4242 4242 4242 4242`
4. Après paiement, retour au dashboard avec plan PRO

#### Plans d'abonnement Salle

**Route :** `/venue/dashboard`

**Comment y accéder :**
1. Se connecter comme propriétaire de salle
2. Aller sur `/venue/dashboard`
3. Sélectionner une salle
4. Section **"Abonnement Salle"**

**Plans disponibles :**
- **VENUE_BASIC** : Gratuit (par défaut)
- **VENUE_PRO** : 39.99 CAD/mois
  - Demandes de réservation illimitées
  - Visibilité premium
  - Statistiques détaillées
  - Badge salle vérifiée
  - Support prioritaire

**S'abonner :**
1. Cliquer sur "S'abonner" pour VENUE_PRO
2. Redirection vers Stripe Checkout
3. Utiliser carte de test : `4242 4242 4242 4242`
4. Après paiement, retour au dashboard avec plan PRO

**API Routes :**
- `GET /api/subscriptions/plans?type=organizer` - Plans organisateur
- `GET /api/subscriptions/plans?type=venue` - Plans salle
- `GET /api/subscriptions/organizer` - Abonnement actuel organisateur
- `POST /api/subscriptions/organizer` - Créer abonnement organisateur
- `GET /api/subscriptions/venue?venueId=...` - Abonnement actuel salle
- `POST /api/subscriptions/venue` - Créer abonnement salle

---

## 🗂️ Structure des Fichiers par Sprint

### Sprint 0
- `prisma/schema.prisma` - Modèles Venue, VenueRequest

### Sprint 1
- `src/app/salle/[slug]/page.tsx` - Page publique salle
- `src/app/api/venues/slug/[slug]/route.ts` - API salle par slug
- `src/components/VenueEventCard.tsx` - Carte événement pour salle
- `src/lib/seo.ts` - JSON-LD pour SEO

### Sprint 2
- `src/app/venue/dashboard/page.tsx` - Dashboard salle
- `src/app/api/venues/me/route.ts` - Mes salles
- `src/app/api/venues/route.ts` - Créer/modifier salle
- `src/app/api/venues/[id]/stats/route.ts` - Statistiques salle
- `src/app/api/geocode/route.ts` - Géocodage

### Sprint 3
- `src/app/api/venue-requests/route.ts` - API demandes
- `src/app/api/venue-requests/[id]/route.ts` - Gérer demande
- `src/components/VenueRequestForm.tsx` - Formulaire demande
- `src/components/VenueRequestButton.tsx` - Bouton "Demander cette salle"
- `src/components/VenueRequestsList.tsx` - Liste demandes

### Sprint 4
- `src/app/api/ai/event-assistant/route.ts` - Assistant IA
- `src/app/api/ai/content-generator/route.ts` - Générateur contenu
- `src/app/api/ai/budget-calculator/route.ts` - Calculateur budget
- `src/components/ai/EventAssistant.tsx` - UI Assistant
- `src/components/ai/ContentGenerator.tsx` - UI Générateur
- `src/components/ai/BudgetCalculator.tsx` - UI Calculateur

### Sprint 5
- `src/app/api/ai/venue-suggestions/route.ts` - Suggestions salle
- `src/app/api/ai/venue-matching/route.ts` - Matching salle
- `src/app/api/venues/[id]/occupation-stats/route.ts` - Stats occupation
- `src/components/ai/VenueAITools.tsx` - UI Outils IA salle

### Sprint 6
- `src/app/social/page.tsx` - Page sociale
- `src/app/api/users/follow/route.ts` - Suivre/défollow
- `src/app/api/users/friends/events/route.ts` - Événements amis
- `src/app/api/events/invitations/route.ts` - Invitations
- `src/app/api/events/invitations/[id]/route.ts` - Répondre invitation
- `src/app/api/editorial/auto-generate/route.ts` - Générer Top 5
- `src/components/social/FriendsEvents.tsx` - UI Événements amis
- `src/components/social/TrendingEvents.tsx` - UI Événements tendance
- `src/components/social/EventInvitations.tsx` - UI Invitations
- `src/components/social/InviteFriendButton.tsx` - Bouton inviter

### Sprint 7
- `src/app/api/subscriptions/plans/route.ts` - Plans disponibles
- `src/app/api/subscriptions/organizer/route.ts` - Abonnement organisateur
- `src/app/api/subscriptions/venue/route.ts` - Abonnement salle
- `src/components/subscription/SubscriptionManager.tsx` - UI Gestion abonnement
- `src/app/api/stripe/webhook/route.ts` - Webhooks Stripe (mis à jour)

---

## 🧪 Tests Rapides

### Test complet en 10 minutes

1. **Créer un compte organisateur**
   - Aller sur `/organisateur/mon-profil`
   - Créer le profil

2. **Créer une salle**
   - Aller sur `/venue/dashboard`
   - Créer une salle
   - Vérifier la page publique `/salle/[slug]`

3. **Tester les outils IA**
   - `/organisateur/dashboard` → Outils IA
   - Tester chaque onglet

4. **Tester le social**
   - Créer un 2e compte
   - Suivre le 1er compte (via API ou UI si disponible)
   - Aller sur `/social` → Voir les événements des amis

5. **Tester la monétisation**
   - `/organisateur/dashboard` → Section abonnement
   - Voir les plans disponibles

---

## 📚 Documentation par Sprint

- `SPRINT0_FONDATIONS_STRUCTURELLES.md`
- `SPRINT1_FICHE_SALLE_PUBLIQUE.md`
- `SPRINT2_DASHBOARD_SALLE.md`
- `SPRINT3_DEMANDE_RESERVATION_SALLE.md`
- `SPRINT4_IA_ORGANISATEURS.md`
- `SPRINT5_IA_SALLES.md`
- `SPRINT6_SOCIAL_VIRALITE.md`
- `SPRINT7_MONETISATION.md`

---

## 🔍 Outils de Développement

### Prisma Studio
```bash
npx prisma studio
```
- Inspecter les données
- Voir les relations
- Tester les requêtes

### React Query DevTools
- Disponible en développement
- Bouton en bas à droite de l'écran
- Voir les requêtes en cache

### Stripe Dashboard (mode test)
- https://dashboard.stripe.com/test
- Voir les paiements
- Tester les webhooks

---

## 💡 Astuces

1. **Créer des données de test** :
   - Utiliser Prisma Studio pour créer des événements, salles, etc.
   - Ou utiliser les scripts dans `/scripts/`

2. **Tester avec plusieurs comptes** :
   - Utiliser la navigation privée pour un 2e compte
   - Ou créer plusieurs comptes avec des emails différents

3. **Vérifier les logs** :
   - Console du serveur (`npm run dev`)
   - Console du navigateur (F12)
   - Network tab pour voir les requêtes API

4. **Tester les erreurs** :
   - Désactiver temporairement la base de données
   - Vérifier les messages d'erreur utilisateur

---

## 🚨 Problèmes Courants

### "Failed to fetch"
- Vérifier que le serveur est lancé (`npm run dev`)
- Vérifier la base de données (Supabase)

### Erreur d'hydratation
- Normal avec certaines extensions de navigateur (Keeper, etc.)
- Les erreurs sont supprimées automatiquement en développement

### Routes API 401/403
- Vérifier que vous êtes connecté
- Vérifier les permissions (organisateur, propriétaire de salle)

---

## 📞 Support

En cas de problème :
1. Consulter `TROUBLESHOOTING.md`
2. Consulter `PLAN_TEST_COMPLET.md`
3. Vérifier les logs (serveur + navigateur)
4. Utiliser Prisma Studio pour inspecter la base de données
