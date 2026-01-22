# 🟣 Sprint 3 – Demande de Réservation Salle

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Créer la mise en relation directe organisateur ↔ salle pour permettre aux organisateurs de demander une réservation et aux salles de gérer ces demandes.

## 📋 Fonctionnalités implémentées

### 1. API Routes

#### POST `/api/venue-requests`
- Crée une demande de réservation
- Vérifie que l'utilisateur est organisateur
- Valide les champs requis (venueId, concept, dateStart)
- Convertit le budget en cents (CAD)
- Retourne la demande créée avec les relations (venue, organizer)

#### GET `/api/venue-requests`
- Récupère les demandes selon les filtres :
  - `venueId` : Toutes les demandes d'une venue (vérifie que l'utilisateur possède la venue)
  - `organizerId` : Toutes les demandes d'un organisateur (vérifie que c'est l'organisateur connecté)
- Inclut les relations (venue, organizer avec user)
- Tri par date de création décroissante

#### GET `/api/venue-requests/[id]`
- Récupère une demande spécifique
- Vérifie les permissions (propriétaire de la venue OU organisateur qui a fait la demande)
- Inclut toutes les informations nécessaires

#### PATCH `/api/venue-requests/[id]`
- Met à jour le statut d'une demande (ACCEPTED ou DECLINED)
- Vérifie que l'utilisateur possède la venue
- Permet d'ajouter des commentaires
- Retourne la demande mise à jour

### 2. Composants côté organisateur

#### `VenueRequestButton`
**Fichier :** `src/components/VenueRequestButton.tsx`

- Bouton "Demander cette salle" affiché sur la fiche salle publique
- Vérifie l'authentification
- Vérifie que l'utilisateur est organisateur
- Ouvre le formulaire de demande

#### `VenueRequestForm`
**Fichier :** `src/components/VenueRequestForm.tsx`

- Formulaire modal pour créer une demande
- Champs :
  - Concept de l'événement (requis, textarea)
  - Date de début (requis, datetime-local)
  - Date de fin (optionnel, datetime-local)
  - Nombre de personnes attendues (optionnel, number)
  - Budget en CAD (optionnel, number)
- Validation côté client
- Message de succès après envoi
- Redirection vers login si non authentifié

### 3. Composants côté salle

#### `VenueRequestsList`
**Fichier :** `src/components/VenueRequestsList.tsx`

- Affiche toutes les demandes d'une venue
- Statistiques en haut :
  - Nombre de demandes en attente
  - Nombre de demandes acceptées
  - Nombre de demandes refusées
- Liste des demandes avec :
  - Informations de l'organisateur (nom, email)
  - Statut (badge coloré)
  - Concept de l'événement
  - Dates (début et fin si disponible)
  - Nombre de personnes attendues
  - Budget
  - Commentaires de la salle (si présents)
  - Date de création
- Actions pour les demandes en attente :
  - Bouton "Accepter" (vert)
  - Bouton "Refuser" (rouge)
- Modal pour accepter/refuser :
  - Champ de commentaires optionnel
  - Confirmation avant action
  - Mise à jour en temps réel après action

### 4. Intégration dans les pages

#### Page publique `/salle/[slug]`
- Ajout du bouton "Demander cette salle"
- Positionné à côté du lien Google Maps
- Visible par tous (redirige vers login si non authentifié)

#### Dashboard salle `/venue/dashboard`
- Nouvelle section "Demandés de réservation"
- Affiche le nombre de demandes en badge
- Utilise le composant `VenueRequestsList`
- Visible uniquement pour les venues sélectionnées

## 🔒 Sécurité

- ✅ Vérification d'authentification sur toutes les routes
- ✅ Vérification de rôle (organisateur pour créer, propriétaire pour gérer)
- ✅ Vérification de propriété avant modification
- ✅ Validation des données côté serveur
- ✅ Protection CSRF via NextAuth

## 🎨 Design & UX

- Design cohérent avec le reste de l'application
- Modals pour les formulaires (non-intrusifs)
- Feedback visuel pour les actions
- Badges colorés pour les statuts :
  - Jaune : En attente
  - Vert : Acceptée
  - Rouge : Refusée
- Messages de succès/erreur clairs
- Loading states appropriés

## 📊 Workflow

### Côté organisateur
1. Visite la fiche salle publique
2. Clique sur "Demander cette salle"
3. Remplit le formulaire (concept, dates, budget, etc.)
4. Envoie la demande
5. Reçoit une confirmation

### Côté salle
1. Se connecte au dashboard salle
2. Sélectionne une venue
3. Voit la section "Demandes de réservation"
4. Consulte les demandes en attente
5. Accepte ou refuse avec commentaires optionnels
6. Les demandes sont mises à jour en temps réel

## 🔗 Intégration

- ✅ Utilise le modèle `VenueRequest` du Sprint 0
- ✅ Compatible avec le système d'authentification existant
- ✅ S'intègre dans la fiche salle publique (Sprint 1)
- ✅ S'intègre dans le dashboard salle (Sprint 2)
- ✅ Prêt pour les notifications (futur)

## 📝 Notes techniques

- Le budget est stocké en cents (comme pour les prix d'événements)
- Les dates sont stockées en UTC dans la base de données
- Les commentaires sont optionnels mais recommandés pour le refus
- Les demandes sont triées par date de création décroissante
- Le statut par défaut est `PENDING`

## 🚀 Prochaines étapes possibles

- **Notifications** : Notifier l'organisateur quand sa demande est acceptée/refusée
- **Email** : Envoyer un email de confirmation à l'organisateur
- **Historique** : Page dédiée pour voir toutes les demandes d'un organisateur
- **Recherche/Filtres** : Filtrer les demandes par statut, date, etc.
- **Export** : Exporter les demandes acceptées pour planification

## 🐛 Points d'attention

- Les demandes ne génèrent pas automatiquement d'événement (à faire manuellement pour l'instant)
- Pas de système de notification automatique (à implémenter)
- Les commentaires ne sont pas visibles par l'organisateur pour l'instant (à ajouter)
