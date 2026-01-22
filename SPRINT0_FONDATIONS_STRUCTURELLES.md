# 🧱 Sprint 0 – Fondations Structurelles

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Préparer la base de données pour les fonctionnalités salles, mise en relation organisateur ↔ salle, et monétisation future.

## 📋 Modifications apportées

### 1. Modèle Venue enrichi

Le modèle `Venue` existant a été enrichi avec les champs suivants :

- **`slug`** (String?, unique) : Slug pour URL SEO-friendly (optionnel pour migration rétrocompatible)
- **`description`** (String?) : Description de la salle
- **`capacity`** (Int?) : Capacité maximale de la salle
- **`types`** (String[]) : Types de salle (ex: ["bar", "club", "salle", "centre_culturel"])
- **`tags`** (String[]) : Tags pour recherche et filtrage
- **`contactEmail`** (String?) : Email de contact de la salle
- **`ownerUserId`** (String?, UUID) : Propriétaire de la salle (relation avec User)

**Relations ajoutées :**
- `Venue.owner` → `User` (relation "VenueOwner")
- `Venue.requests` → `VenueRequest[]`

**Index ajoutés :**
- `idx_venue_slug` : Pour recherche rapide par slug
- `idx_venue_owner` : Pour filtrage par propriétaire
- `idx_venue_types` : Pour recherche par types de salle

### 2. Nouveau modèle VenueRequest

Création du modèle `VenueRequest` pour gérer les demandes de réservation :

**Champs :**
- `id` (UUID)
- `venueId` (UUID) : Salle concernée
- `organizerId` (UUID) : Organisateur qui fait la demande
- `concept` (Text) : Description du concept d'événement
- `dateStart` (DateTime) : Date de début souhaitée
- `dateEnd` (DateTime?) : Date de fin (optionnel)
- `expectedAttendance` (Int?) : Nombre de personnes attendues
- `budget` (Int?) : Budget en cents (CAD)
- `status` (VenueRequestStatus) : `PENDING` | `ACCEPTED` | `DECLINED`
- `comments` (Text?) : Commentaires de la salle ou de l'organisateur
- `createdAt`, `updatedAt`

**Relations :**
- `VenueRequest.venue` → `Venue`
- `VenueRequest.organizer` → `Organizer`

**Index :**
- `idx_venue_request_venue` : Pour lister les demandes d'une salle
- `idx_venue_request_organizer` : Pour lister les demandes d'un organisateur
- `idx_venue_request_status` : Pour filtrer par statut
- `idx_venue_request_date_start` : Pour trier par date

### 3. Nouvel enum VenueRequestStatus

```prisma
enum VenueRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

### 4. Relations mises à jour

**User :**
- Ajout de `ownedVenues Venue[]` (relation "VenueOwner")

**Organizer :**
- Ajout de `venueRequests VenueRequest[]`

## 🔄 Migration

La migration a été appliquée avec `prisma db push` pour :
- Ajouter les nouveaux champs au modèle `Venue` existant
- Créer la nouvelle table `venue_requests`
- Créer l'enum `VenueRequestStatus`
- Ajouter les index nécessaires

**Note :** Le champ `slug` a été rendu optionnel pour permettre la migration sans perte de données sur les 51 venues existantes.

## 📊 État de la base de données

- ✅ Modèle `Venue` enrichi et prêt pour les sprints suivants
- ✅ Modèle `VenueRequest` créé
- ✅ Relations User ↔ Venue établies
- ✅ Relations Organizer ↔ VenueRequest établies
- ✅ Index créés pour performance

## 🚀 Prochaines étapes

Le Sprint 0 est complété. Les sprints suivants peuvent maintenant utiliser ces fondations :

- **Sprint 1** : Fiche salle publique (`/salle/[slug]`)
- **Sprint 2** : Dashboard salle (`/venue/dashboard`)
- **Sprint 3** : Demande de réservation salle (utilise `VenueRequest`)

## 📝 Notes techniques

- Le `slug` est optionnel pour l'instant, mais devra être rempli lors de la création/modification de salles dans les sprints suivants
- Les types de salle (`types`) sont stockés comme un tableau de strings pour flexibilité
- Le budget est stocké en cents (comme pour les prix d'événements) pour éviter les problèmes de précision décimale
