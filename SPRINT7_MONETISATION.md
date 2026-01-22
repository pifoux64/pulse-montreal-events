# 🟣 Sprint 7 – Monétisation

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Mettre en place un système de monétisation pour organisateurs et salles, avec des plans gratuits et payants, sans obligation de paiement pour exister.

## 📋 Fonctionnalités implémentées

### 1. Modèles de données

#### Extension du modèle `Subscription`
- Support pour organisateurs ET salles
- Champs ajoutés :
  - `venueId` (nullable) - Pour les abonnements de salles
  - `organizerId` (nullable) - Pour les abonnements d'organisateurs
  - `stripeSubscriptionId` - ID de l'abonnement Stripe
  - `stripeCustomerId` - ID du client Stripe
  - `currentPeriodStart` - Début de la période actuelle
  - `currentPeriodEnd` - Fin de la période actuelle
  - `cancelAtPeriodEnd` - Annulation à la fin de la période
  - `updatedAt` - Date de mise à jour

#### Extension de l'enum `SubscriptionPlan`
- `ORGANIZER_BASIC` - Plan gratuit pour organisateurs
- `ORGANIZER_PRO` - Plan payant pour organisateurs (29.99 CAD/mois)
- `VENUE_BASIC` - Plan gratuit pour salles
- `VENUE_PRO` - Plan payant pour salles (39.99 CAD/mois)

### 2. Plans de pricing

#### Plans organisateurs
- **ORGANIZER_PRO_MONTHLY** : 29.99 CAD/mois
  - Événements illimités
  - Statistiques avancées
  - Notifications ciblées
  - Mises en avant automatiques
  - Support prioritaire

#### Plans salles
- **VENUE_PRO_MONTHLY** : 39.99 CAD/mois
  - Demandes de réservation illimitées
  - Visibilité premium
  - Statistiques détaillées
  - Badge salle vérifiée
  - Support prioritaire

### 3. API Routes

#### GET `/api/subscriptions/plans?type=...`
- Récupère les plans disponibles selon le type (organizer ou venue)
- Filtre les plans de subscription uniquement

#### GET `/api/subscriptions/organizer`
- Récupère l'abonnement actuel de l'organisateur authentifié
- Retourne le plan actuel (ORGANIZER_BASIC par défaut)

#### POST `/api/subscriptions/organizer`
- Crée une session de checkout Stripe pour un abonnement organisateur
- Redirige vers Stripe Checkout

#### GET `/api/subscriptions/venue?venueId=...`
- Récupère l'abonnement actuel d'une salle
- Vérifie que l'utilisateur est propriétaire

#### POST `/api/subscriptions/venue`
- Crée une session de checkout Stripe pour un abonnement salle
- Inclut venueId dans les metadata
- Redirige vers Stripe Checkout

### 4. Webhooks Stripe

#### Mise à jour du webhook handler
- `handleCheckoutCompleted` : Crée l'abonnement dans la base de données après paiement
- `handleSubscriptionCreated` : Met à jour les périodes de facturation
- `handleSubscriptionUpdated` : Met à jour le statut et les périodes
- `handleSubscriptionDeleted` : Désactive l'abonnement

### 5. Composants UI

#### `SubscriptionManager`
**Fichier :** `src/components/subscription/SubscriptionManager.tsx`

- Composant réutilisable pour gérer les abonnements
- Affiche le plan actuel
- Liste les plans disponibles avec leurs fonctionnalités
- Bouton pour s'abonner (redirige vers Stripe Checkout)
- Indicateur visuel pour le plan actuel
- Badge "Pro" avec icône Crown pour les plans premium
- Message informatif : "Aucun paiement n'est obligatoire pour exister"

### 6. Intégrations

#### Dashboard Organisateur
- Section "Abonnement Organisateur" ajoutée
- Utilise le composant `SubscriptionManager` avec `type="organizer"`

#### Dashboard Salle
- Section "Abonnement Salle" ajoutée
- Utilise le composant `SubscriptionManager` avec `type="venue"` et `venueId`

### 7. Restrictions (à implémenter)

Les restrictions basées sur les abonnements peuvent être ajoutées dans :
- Limitation du nombre d'événements (BASIC : limité, PRO : illimité)
- Accès aux statistiques avancées (PRO uniquement)
- Notifications ciblées (PRO uniquement)
- Demandes de réservation (VENUE_BASIC : limité, VENUE_PRO : illimité)
- Visibilité premium (VENUE_PRO uniquement)

## 🎨 Design & UX

- Interface cohérente avec le reste de l'application
- Badges visuels pour distinguer les plans (gratuit vs pro)
- Icône Crown pour les plans premium
- Message clair : aucun paiement obligatoire
- Feedback visuel pour toutes les actions
- Redirection automatique vers Stripe Checkout

## 🔗 Intégration

- ✅ Utilise l'infrastructure Stripe existante
- ✅ Compatible avec le système d'authentification
- ✅ Webhooks configurés pour synchronisation automatique
- ✅ Support pour organisateurs et salles
- ✅ Plans flexibles et extensibles

## 📝 Notes techniques

- Les abonnements sont créés via Stripe Checkout
- Les webhooks mettent à jour automatiquement la base de données
- Les anciens abonnements sont désactivés lors de la création d'un nouveau
- Le plan par défaut est toujours BASIC (gratuit)
- Les restrictions peuvent être implémentées progressivement selon les besoins

## 🚀 Prochaines étapes possibles

- **Restrictions fonctionnelles** : Implémenter les limitations selon le plan
- **Gestion d'abonnement** : Portail client Stripe pour modifier/annuler
- **Essai gratuit** : Offrir un essai gratuit de 14 jours
- **Plans annuels** : Ajouter des options de facturation annuelle avec réduction
- **Statistiques d'abonnements** : Dashboard admin pour voir les abonnements actifs

## 🐛 Points d'attention

- Les webhooks Stripe doivent être configurés dans l'environnement de production
- Le `STRIPE_WEBHOOK_SECRET` doit être configuré pour valider les webhooks
- Les metadata doivent être correctement passées lors de la création des sessions
- Les restrictions doivent être implémentées de manière cohérente dans toute l'application
