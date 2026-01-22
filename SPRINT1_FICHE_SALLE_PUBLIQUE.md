# 🟣 Sprint 1 – Fiche Salle Publique

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Créer une page publique par salle, visible par tous, avec toutes les informations nécessaires pour découvrir une salle et ses événements.

## 📋 Fonctionnalités implémentées

### 1. API Route pour récupération par slug

**Fichier :** `src/app/api/venues/slug/[slug]/route.ts`

- Route : `GET /api/venues/slug/[slug]`
- Récupère une venue par son slug (SEO-friendly)
- Inclut :
  - Informations de la salle (description, capacité, types, tags, etc.)
  - Propriétaire (sans email)
  - Événements à venir
  - Événements du week-end
  - Événements passés (limité à 10)
  - Compteurs

### 2. Page publique `/salle/[slug]`

**Fichier :** `src/app/salle/[slug]/page.tsx`

**Sections implémentées :**

1. **Hero Section**
   - Nom de la salle
   - Quartier et ville
   - Types de salle (badges)
   - Description complète

2. **Informations pratiques**
   - Adresse complète
   - Capacité (si disponible)
   - Téléphone (si disponible, avec lien `tel:`)
   - Site web (si disponible, avec lien externe)
   - Carte interactive (MapLibre)
   - Lien vers Google Maps

3. **Événements à venir**
   - Liste des événements futurs
   - Affichage en grille responsive
   - Utilise le composant `VenueEventCard`

4. **Ce week-end dans cette salle**
   - Événements du week-end actuel
   - Section dédiée pour mise en avant

5. **Événements passés**
   - Historique des 10 derniers événements
   - Triés par date décroissante

6. **Message si aucun événement**
   - Affichage d'un message informatif si la salle n'a pas encore d'événements

### 3. JSON-LD Schema.org pour SEO local

**Fichier :** `src/lib/seo.ts`

- Nouvelle fonction `buildVenueJsonLd()`
- Génère le JSON-LD Schema.org de type `Place`
- Inclut :
  - Nom, description
  - Adresse complète (PostalAddress)
  - Coordonnées géographiques (GeoCoordinates)
  - Téléphone, site web
  - Types de salle (additionalType)
  - Capacité maximale

**Avantages SEO :**
- Meilleure indexation par Google
- Affichage dans les résultats de recherche locaux
- Rich snippets dans les résultats

### 4. Composant VenueEventCard

**Fichier :** `src/components/VenueEventCard.tsx`

- Wrapper client pour afficher les événements d'une salle
- Convertit les données Prisma au format `Event` attendu par `EventCard`
- Intègre le système de favoris via `useFavorites`
- Réutilise le composant `EventCard` existant

### 5. Liens depuis les pages d'événements

**Fichier :** `src/app/evenement/[id]/page.tsx`

- Ajout d'un lien cliquable vers la fiche salle si le venue a un slug
- Le nom de la salle devient un lien vers `/salle/[slug]`
- Lien supplémentaire "Voir la fiche de la salle →" sous l'adresse

## 🎨 Design & UX

- Design cohérent avec le reste de l'application
- Responsive (mobile, tablette, desktop)
- Carte interactive pour visualiser l'emplacement
- Badges pour les types de salle
- Sections clairement séparées
- Navigation intuitive

## 🔍 SEO

- ✅ URL SEO-friendly avec slug
- ✅ Métadonnées Open Graph et Twitter Cards
- ✅ JSON-LD Schema.org pour Place
- ✅ Description optimisée
- ✅ Mots-clés pertinents (nom, quartier, types, tags)
- ✅ URL canonique

## 📊 Performance

- Revalidation : 10 minutes (`revalidate = 600`)
- Requêtes optimisées avec `include` Prisma
- Pagination des événements passés (limite à 10)
- Images lazy-loaded via `EventCard`

## 🔗 Intégration

- ✅ Lien automatique depuis chaque événement (si venue a un slug)
- ✅ Utilise les composants existants (`EventDetailMap`, `EventCard`)
- ✅ Compatible avec le système de favoris existant
- ✅ Respecte la structure de routing Next.js 15

## 📝 Notes techniques

- Le slug est optionnel dans le modèle Venue (pour migration rétrocompatible)
- Les salles sans slug ne peuvent pas encore avoir de page publique
- Le Sprint 2 (Dashboard salle) permettra de générer/éditer les slugs
- Les événements sont filtrés par statut `SCHEDULED` et date future
- Le calcul du "week-end" se base sur le dimanche de la semaine en cours

## 🚀 Prochaines étapes

Le Sprint 1 est complété. Les prochaines étapes :

- **Sprint 2** : Dashboard salle (permettra de créer/éditer les slugs)
- **Sprint 3** : Demande de réservation salle

## 🐛 Points d'attention

- Les salles existantes sans slug ne sont pas encore accessibles via cette route
- Il faudra générer des slugs pour les venues existantes (script de migration possible)
- La génération de slug devra être implémentée dans le Sprint 2
