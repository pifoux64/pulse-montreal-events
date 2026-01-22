# 🟣 Sprint 6 – Social & Viralité

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Rendre Pulse indispensable et partageable avec des fonctionnalités sociales et des pages éditoriales automatiques.

## 📋 Fonctionnalités implémentées

### 1. Modèles de données

#### `UserFollow`
- Modèle pour suivre des amis (User → User)
- Champs : followerId, followingId, createdAt
- Contrainte unique sur (followerId, followingId)
- Index pour performance

#### `EventInvitation`
- Modèle pour les invitations Pulse → Pulse
- Champs : eventId, senderId, receiverId, message, status, createdAt, respondedAt
- Statuts : PENDING, ACCEPTED, DECLINED
- Contrainte unique sur (eventId, senderId, receiverId)
- Relations avec Event, User (sender et receiver)

### 2. API Routes

#### POST `/api/users/follow`
- Suivre un utilisateur
- Vérifie que l'utilisateur existe
- Empêche de se suivre soi-même
- Vérifie qu'on ne suit pas déjà

#### DELETE `/api/users/follow?userId=...`
- Défollow un utilisateur
- Suppression simple

#### GET `/api/users/following`
- Liste des utilisateurs que je suis
- Inclut nom et image

#### GET `/api/users/friends/events`
- Récupère les événements favoris de mes amis
- Filtre les événements à venir
- Déduplique par événement
- Regroupe par ami qui a favorisé
- Limite configurable

#### GET `/api/trending` (existant, amélioré)
- Récupère les événements tendance
- Scopes : today, weekend, week
- Utilise le trendingEngine existant

#### POST `/api/events/invitations`
- Envoyer une invitation à un ami
- Vérifie que l'événement et le receiver existent
- Empêche de s'inviter soi-même
- Vérifie qu'on n'a pas déjà invité

#### GET `/api/events/invitations?type=...`
- Récupère mes invitations
- Type : 'sent' (envoyées) ou 'received' (reçues)
- Inclut toutes les informations nécessaires

#### PATCH `/api/events/invitations/[id]`
- Répondre à une invitation (ACCEPTED ou DECLINED)
- Si acceptée, ajoute automatiquement aux favoris
- Met à jour respondedAt

#### POST `/api/editorial/auto-generate`
- Génère automatiquement les pages éditoriales (Top 5)
- Thèmes configurables (par défaut : rock, famille, gratuit, hip_hop, techno)
- Période : week ou weekend
- Publie automatiquement les posts générés
- Accessible uniquement aux admins

### 3. Composants UI

#### `FriendsEvents`
**Fichier :** `src/components/social/FriendsEvents.tsx`

- Affiche les événements favoris de mes amis
- Badge indiquant combien d'amis ont favorisé chaque événement
- Message si aucun ami ou aucun événement
- Utilise VenueEventCard pour affichage

#### `TrendingEvents`
**Fichier :** `src/components/social/TrendingEvents.tsx`

- Affiche les événements tendance
- Filtres par scope (aujourd'hui, week-end, semaine)
- Badge "Trending" sur les événements
- Utilise le système de trending existant

#### `EventInvitations`
**Fichier :** `src/components/social/EventInvitations.tsx`

- Interface avec onglets (reçues / envoyées)
- Liste des invitations avec statut
- Actions pour accepter/refuser (pour les reçues)
- Affichage du message personnalisé
- Lien vers l'événement

#### `InviteFriendButton`
**Fichier :** `src/components/social/InviteFriendButton.tsx`

- Bouton pour inviter des amis à un événement
- Modal avec liste des amis (utilisateurs suivis)
- Sélection multiple
- Message personnalisé optionnel
- Envoi en batch

### 4. Pages

#### `/social`
**Fichier :** `src/app/social/page.tsx`

- Page centrale pour les fonctionnalités sociales
- 3 onglets :
  1. Mes amis : Où vont mes amis
  2. Tendance : Événements tendance
  3. Invitations : Mes invitations
- Protection d'authentification

### 5. Intégrations

#### Page événement
- Ajout du bouton "Inviter des amis" sur chaque page d'événement
- Positionné à côté des actions (partage, favoris)

#### Pages éditoriales
- Les pages Top 5 existantes sont déjà fonctionnelles
- L'API auto-generate permet de générer automatiquement les Top 5
- Format : `/top-5/[slug]`

## 🎨 Design & UX

- Interface cohérente avec le reste de l'application
- Onglets pour navigation facile
- Badges pour indicateurs visuels (trending, nombre d'amis)
- Modals pour actions (invitations)
- Feedback visuel pour toutes les actions
- Messages clairs si aucune donnée

## 🔗 Intégration

- ✅ Utilise les modèles existants (Event, User, Favorite)
- ✅ Compatible avec le système d'authentification
- ✅ Réutilise les composants existants (VenueEventCard)
- ✅ Utilise le trendingEngine existant
- ✅ Utilise le système éditorial existant (EditorialPost)

## 📝 Notes techniques

- Les invitations acceptées ajoutent automatiquement l'événement aux favoris
- Les événements des amis sont dédupliqués (un événement peut être favorisé par plusieurs amis)
- Le système de trending utilise favoritesToday et viewsToday
- Les pages éditoriales sont générées avec un slug déterministe
- La génération automatique est limitée aux admins pour sécurité

## 🚀 Prochaines étapes possibles

- **Notifications** : Notifier quand un ami favorise un événement ou envoie une invitation
- **Suggestions d'amis** : Proposer des utilisateurs à suivre basés sur les goûts similaires
- **Groupes** : Créer des groupes d'amis pour organiser des sorties
- **Feed social** : Fil d'actualité avec activités des amis
- **Partage externe** : Améliorer le partage vers réseaux sociaux

## 🐛 Points d'attention

- Les invitations nécessitent que les utilisateurs se suivent (pour l'instant)
- La génération automatique des Top 5 nécessite des événements avec tags structurés
- Le système de trending nécessite des données (favoris, vues) pour fonctionner
