# 🧪 Plan de Test Complet - Tous les Sprints

## 📋 Vue d'ensemble

Ce document fournit un plan de test systématique pour valider toutes les fonctionnalités implémentées dans les sprints 0 à 7.

## 🎯 Prérequis

1. **Environnement de développement local**
   - Base de données Supabase accessible
   - Variables d'environnement configurées (`.env`)
   - Stripe configuré (clés de test)

2. **Comptes de test**
   - Au moins 2 utilisateurs (pour tester le social)
   - 1 utilisateur avec rôle ORGANIZER
   - 1 utilisateur avec rôle USER (pour tester les salles)

3. **Outils**
   - Navigateur (Chrome/Firefox recommandé)
   - DevTools ouvert (Console, Network)
   - Accès à Stripe Dashboard (mode test)

---

## 🟢 SPRINT 0 - Fondations Structurelles

### ✅ Tests à effectuer

#### 1. Modèle Venue
- [ ] Vérifier que le modèle `Venue` a tous les champs nécessaires
- [ ] Vérifier que `slug` est unique et optionnel
- [ ] Vérifier les relations : `User.ownedVenues`, `Venue.requests`

#### 2. Modèle VenueRequest
- [ ] Vérifier que le modèle existe avec tous les champs
- [ ] Vérifier les relations : `Venue.requests`, `Organizer.venueRequests`
- [ ] Vérifier l'enum `VenueRequestStatus` (PENDING, ACCEPTED, DECLINED)

**Comment tester :**
```bash
# Vérifier le schéma Prisma
npx prisma studio
# Ouvrir les tables venues et venue_requests
```

---

## 🟣 SPRINT 1 - Fiche Salle Publique

### ✅ Tests à effectuer

#### 1. Route `/salle/[slug]`
- [ ] Créer une salle avec un slug
- [ ] Accéder à `/salle/[slug]` (sans être connecté)
- [ ] Vérifier que la page s'affiche correctement
- [ ] Vérifier les sections :
  - [ ] Hero avec description
  - [ ] Informations pratiques (capacité, types, contact)
  - [ ] Carte interactive
  - [ ] Événements à venir
  - [ ] Événements ce week-end
  - [ ] Événements passés

#### 2. SEO
- [ ] Vérifier les meta tags (title, description)
- [ ] Vérifier le JSON-LD Schema.org pour Venue
- [ ] Tester avec un outil SEO (Google Rich Results Test)

#### 3. Lien depuis événement
- [ ] Créer un événement lié à une salle avec slug
- [ ] Vérifier que le lien vers `/salle/[slug]` apparaît sur la page événement

**Scénario de test :**
1. Se connecter comme organisateur
2. Créer une salle via `/venue/dashboard`
3. Créer un événement lié à cette salle
4. Visiter `/salle/[slug]` en navigation privée
5. Vérifier toutes les sections

---

## 🟣 SPRINT 2 - Dashboard Salle

### ✅ Tests à effectuer

#### 1. Accès au dashboard
- [ ] Accéder à `/venue/dashboard` (doit rediriger si non connecté)
- [ ] Vérifier l'authentification requise

#### 2. Création de salle
- [ ] Créer une nouvelle salle
- [ ] Vérifier la génération automatique du slug
- [ ] Vérifier le géocodage automatique (adresse → lat/lng)
- [ ] Vérifier l'unicité du slug

#### 3. Modification de salle
- [ ] Modifier les informations d'une salle
- [ ] Vérifier que le slug se régénère si le nom change
- [ ] Vérifier que les coordonnées se mettent à jour si l'adresse change

#### 4. Statistiques
- [ ] Vérifier l'affichage des stats (vues, favoris)
- [ ] Vérifier les stats des 30 derniers jours

#### 5. Calendrier des événements
- [ ] Vérifier l'affichage des événements à venir
- [ ] Vérifier le tri par date

#### 6. Onboarding
- [ ] Vérifier l'affichage de l'onboarding pour un nouvel utilisateur
- [ ] Compléter les 3 étapes
- [ ] Vérifier que l'onboarding disparaît après complétion

**Scénario de test :**
1. Se connecter avec un compte utilisateur
2. Aller sur `/venue/dashboard`
3. Créer une salle (nom, adresse, description, capacité, types)
4. Vérifier que le slug est généré
5. Modifier la salle
6. Vérifier les stats (devraient être à 0 au début)
7. Créer un événement lié à cette salle
8. Vérifier que l'événement apparaît dans le calendrier

---

## 🟣 SPRINT 3 - Demande de Réservation Salle

### ✅ Tests à effectuer

#### 1. Côté Organisateur
- [ ] Vérifier le bouton "Demander cette salle" sur `/salle/[slug]`
- [ ] Cliquer sur le bouton (doit rediriger si non connecté)
- [ ] Remplir le formulaire de demande :
  - [ ] Concept
  - [ ] Dates (début et fin optionnelle)
  - [ ] Nombre de personnes attendues
  - [ ] Budget
- [ ] Soumettre la demande
- [ ] Vérifier le message de confirmation

#### 2. Côté Salle
- [ ] Se connecter comme propriétaire de salle
- [ ] Aller sur `/venue/dashboard`
- [ ] Sélectionner une salle
- [ ] Vérifier la section "Demandes de réservation"
- [ ] Voir la demande reçue
- [ ] Accepter une demande
- [ ] Vérifier que le statut passe à ACCEPTED
- [ ] Refuser une demande
- [ ] Vérifier que le statut passe à DECLINED
- [ ] Ajouter un commentaire

#### 3. API Routes
- [ ] Tester `POST /api/venue-requests` (créer demande)
- [ ] Tester `GET /api/venue-requests?venueId=...` (liste pour salle)
- [ ] Tester `GET /api/venue-requests?organizerId=...` (liste pour organisateur)
- [ ] Tester `PATCH /api/venue-requests/[id]` (accepter/refuser)

**Scénario de test :**
1. **Compte 1 (Organisateur)** : Se connecter, aller sur `/salle/[slug]`, cliquer "Demander cette salle", remplir le formulaire, soumettre
2. **Compte 2 (Propriétaire salle)** : Se connecter, aller sur `/venue/dashboard`, voir la demande, accepter/refuser

---

## 🟣 SPRINT 4 - IA pour Organisateurs

### ✅ Tests à effectuer

#### 1. Assistant Événement
- [ ] Aller sur `/organisateur/dashboard`
- [ ] Ouvrir la section "Outils IA"
- [ ] Cliquer sur l'onglet "Assistant"
- [ ] Entrer une idée d'événement (ex: "Concert rock dans un bar")
- [ ] Cliquer sur "Générer"
- [ ] Vérifier que les suggestions apparaissent :
  - [ ] Titre
  - [ ] Description
  - [ ] Tags
  - [ ] Genres musicaux
- [ ] Tester le bouton "Copier"

#### 2. Générateur de Contenu
- [ ] Cliquer sur l'onglet "Contenu"
- [ ] Remplir les informations d'un événement
- [ ] Générer :
  - [ ] Plan de communication
  - [ ] Post Facebook
  - [ ] Caption Instagram
- [ ] Vérifier que le contenu est pertinent
- [ ] Tester les boutons "Copier"

#### 3. Calculateur de Budget
- [ ] Cliquer sur l'onglet "Budget"
- [ ] Remplir les champs :
  - [ ] Coût location
  - [ ] Coût artistes
  - [ ] Coût promotion
  - [ ] Autres coûts
  - [ ] Capacité attendue
- [ ] Cliquer sur "Calculer"
- [ ] Vérifier les résultats :
  - [ ] Coût total
  - [ ] Seuil de rentabilité
  - [ ] Suggestion de prix
  - [ ] Recommandations

#### 4. API Routes
- [ ] Tester `POST /api/ai/event-assistant`
- [ ] Tester `POST /api/ai/content-generator`
- [ ] Tester `POST /api/ai/budget-calculator`
- [ ] Vérifier les erreurs (champs manquants, etc.)

**Scénario de test :**
1. Se connecter comme organisateur
2. Aller sur `/organisateur/dashboard`
3. Tester chaque outil IA
4. Vérifier que les réponses sont cohérentes
5. Vérifier les cas d'erreur (champs vides, etc.)

---

## 🟣 SPRINT 5 - IA pour Salles

### ✅ Tests à effectuer

#### 1. Suggestions
- [ ] Aller sur `/venue/dashboard`
- [ ] Sélectionner une salle
- [ ] Ouvrir la section "Outils IA"
- [ ] Cliquer sur l'onglet "Suggestions"
- [ ] Cliquer sur "Générer des suggestions"
- [ ] Vérifier les suggestions :
  - [ ] Jours creux identifiés
  - [ ] Types d'événements manquants
  - [ ] Recommandations générales

#### 2. Matching
- [ ] Cliquer sur l'onglet "Matching"
- [ ] Cliquer sur "Trouver des organisateurs"
- [ ] Vérifier les résultats :
  - [ ] Organisateurs compatibles
  - [ ] Concepts similaires performants

#### 3. Statistiques d'occupation
- [ ] Cliquer sur l'onglet "Stats"
- [ ] Vérifier l'affichage :
  - [ ] Événements par semaine
  - [ ] Distribution par jour
  - [ ] Distribution par catégorie
  - [ ] Tendances sur 3 mois

#### 4. API Routes
- [ ] Tester `POST /api/ai/venue-suggestions`
- [ ] Tester `POST /api/ai/venue-matching`
- [ ] Tester `GET /api/venues/[id]/occupation-stats`

**Scénario de test :**
1. Se connecter comme propriétaire de salle
2. Créer plusieurs événements pour cette salle (différents jours, catégories)
3. Aller sur `/venue/dashboard`
4. Tester chaque onglet des outils IA
5. Vérifier que les suggestions sont pertinentes

---

## 🟣 SPRINT 6 - Social & Viralité

### ✅ Tests à effectuer

#### 1. Suivre des amis
- [ ] Se connecter avec 2 comptes différents
- [ ] **Compte 1** : Aller sur le profil d'un autre utilisateur
- [ ] Cliquer sur "Suivre" (si bouton existe)
- [ ] **Compte 2** : Vérifier qu'il a un nouveau follower

#### 2. Événements des amis
- [ ] **Compte 1** : Favoriser quelques événements
- [ ] **Compte 2** : Aller sur `/social`
- [ ] Cliquer sur l'onglet "Mes amis"
- [ ] Vérifier que les événements favorisés par Compte 1 apparaissent
- [ ] Vérifier le badge indiquant combien d'amis ont favorisé

#### 3. Événements tendance
- [ ] Aller sur `/social`
- [ ] Cliquer sur l'onglet "Tendance"
- [ ] Vérifier les filtres (Aujourd'hui, Week-end, Semaine)
- [ ] Vérifier que les événements s'affichent
- [ ] Vérifier le badge "Trending" sur certains événements

#### 4. Invitations
- [ ] **Compte 1** : Aller sur un événement
- [ ] Cliquer sur "Inviter des amis"
- [ ] Sélectionner des amis (utilisateurs suivis)
- [ ] Ajouter un message personnalisé
- [ ] Envoyer les invitations
- [ ] **Compte 2** : Aller sur `/social`
- [ ] Cliquer sur l'onglet "Invitations"
- [ ] Vérifier que l'invitation apparaît
- [ ] Accepter l'invitation
- [ ] Vérifier que l'événement est ajouté aux favoris automatiquement
- [ ] Refuser une invitation

#### 5. Pages éditoriales
- [ ] Aller sur `/top-5`
- [ ] Vérifier la liste des Top 5 publiés
- [ ] Cliquer sur un Top 5 (ex: "Top 5 Rock cette semaine")
- [ ] Vérifier l'affichage des 5 événements
- [ ] Vérifier le SEO (meta tags, JSON-LD)

#### 6. API Routes
- [ ] Tester `POST /api/users/follow`
- [ ] Tester `DELETE /api/users/follow`
- [ ] Tester `GET /api/users/friends/events`
- [ ] Tester `POST /api/events/invitations`
- [ ] Tester `GET /api/events/invitations`
- [ ] Tester `PATCH /api/events/invitations/[id]`

**Scénario de test :**
1. Créer 2 comptes utilisateurs
2. **Compte 1** : Suivre **Compte 2**
3. **Compte 2** : Favoriser quelques événements
4. **Compte 1** : Aller sur `/social` → "Mes amis", vérifier les événements
5. **Compte 1** : Aller sur un événement, inviter **Compte 2**
6. **Compte 2** : Aller sur `/social` → "Invitations", accepter
7. Vérifier que l'événement est dans les favoris de **Compte 2**

---

## 🟣 SPRINT 7 - Monétisation

### ✅ Tests à effectuer

#### 1. Plans d'abonnement
- [ ] Aller sur `/organisateur/dashboard`
- [ ] Vérifier la section "Abonnement Organisateur"
- [ ] Vérifier l'affichage du plan actuel (BASIC par défaut)
- [ ] Vérifier la liste des plans disponibles
- [ ] Vérifier les fonctionnalités de chaque plan

#### 2. Souscription Organisateur
- [ ] Cliquer sur "S'abonner" pour ORGANIZER_PRO
- [ ] Vérifier la redirection vers Stripe Checkout
- [ ] Utiliser une carte de test Stripe :
  - [ ] Carte valide : `4242 4242 4242 4242`
  - [ ] Date : n'importe quelle date future
  - [ ] CVC : n'importe quel 3 chiffres
- [ ] Compléter le paiement
- [ ] Vérifier la redirection vers le dashboard avec `?subscription=success`
- [ ] Vérifier que le plan est maintenant PRO
- [ ] Vérifier dans Stripe Dashboard que l'abonnement est créé

#### 3. Souscription Salle
- [ ] Aller sur `/venue/dashboard`
- [ ] Sélectionner une salle
- [ ] Vérifier la section "Abonnement Salle"
- [ ] Cliquer sur "S'abonner" pour VENUE_PRO
- [ ] Compléter le paiement Stripe
- [ ] Vérifier que l'abonnement est actif

#### 4. Webhooks Stripe
- [ ] Vérifier dans Stripe Dashboard que les webhooks sont configurés
- [ ] Tester manuellement un webhook :
  - [ ] Aller dans Stripe Dashboard → Webhooks
  - [ ] Envoyer un événement de test
  - [ ] Vérifier que la base de données est mise à jour

#### 5. API Routes
- [ ] Tester `GET /api/subscriptions/plans?type=organizer`
- [ ] Tester `GET /api/subscriptions/plans?type=venue`
- [ ] Tester `GET /api/subscriptions/organizer`
- [ ] Tester `POST /api/subscriptions/organizer`
- [ ] Tester `GET /api/subscriptions/venue?venueId=...`
- [ ] Tester `POST /api/subscriptions/venue`

**Scénario de test :**
1. Se connecter comme organisateur
2. Aller sur `/organisateur/dashboard`
3. Voir la section abonnement (plan BASIC)
4. Cliquer sur "S'abonner" pour PRO
5. Compléter le paiement avec carte de test Stripe
6. Vérifier que le plan est maintenant PRO
7. Vérifier dans la base de données que l'abonnement est créé

---

## 🔍 Tests Transversaux

### Performance
- [ ] Vérifier les temps de chargement des pages
- [ ] Vérifier que les requêtes API sont optimisées
- [ ] Vérifier l'utilisation de la base de données (éviter les N+1 queries)

### Sécurité
- [ ] Vérifier que les routes API sont protégées (authentification)
- [ ] Vérifier que les utilisateurs ne peuvent accéder qu'à leurs propres données
- [ ] Vérifier la validation des inputs (Zod, etc.)

### Responsive
- [ ] Tester sur mobile (iPhone, Android)
- [ ] Tester sur tablette
- [ ] Tester sur desktop (différentes tailles d'écran)

### Accessibilité
- [ ] Vérifier la navigation au clavier
- [ ] Vérifier les contrastes de couleurs
- [ ] Vérifier les labels des formulaires

---

## 🐛 Points d'attention spécifiques

### Sprint 0-1
- Vérifier que les slugs sont bien générés et uniques
- Vérifier que le géocodage fonctionne pour différentes adresses

### Sprint 2-3
- Vérifier que seuls les propriétaires peuvent modifier leurs salles
- Vérifier que les organisateurs ne peuvent demander que des salles existantes

### Sprint 4-5
- Vérifier que les appels OpenAI fonctionnent (clé API configurée)
- Vérifier les timeouts et erreurs réseau

### Sprint 6
- Vérifier que les utilisateurs ne peuvent pas se suivre eux-mêmes
- Vérifier que les invitations ne peuvent pas être envoyées plusieurs fois

### Sprint 7
- Vérifier que les webhooks Stripe sont bien configurés
- Vérifier que les abonnements sont bien synchronisés avec Stripe

---

## 📝 Checklist finale

- [ ] Tous les sprints testés individuellement
- [ ] Tests transversaux effectués
- [ ] Erreurs identifiées et documentées
- [ ] Performance vérifiée
- [ ] Sécurité vérifiée
- [ ] Responsive vérifié
- [ ] Documentation à jour

---

## 🚀 Commandes utiles

```bash
# Ouvrir Prisma Studio pour inspecter la base de données
npx prisma studio

# Vérifier les migrations
npx prisma migrate status

# Générer le client Prisma
npx prisma generate

# Lancer le serveur de développement
npm run dev

# Vérifier les types TypeScript
npm run type-check

# Lancer les tests (si disponibles)
npm test
```

---

## 📞 Support

En cas de problème lors des tests :
1. Vérifier les logs du serveur (console)
2. Vérifier les logs du navigateur (DevTools)
3. Vérifier la base de données (Prisma Studio)
4. Vérifier les variables d'environnement
5. Vérifier la configuration Stripe
