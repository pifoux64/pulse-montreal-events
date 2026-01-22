# 🟣 Sprint 2 – Dashboard Salle

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Donner aux salles un outil simple pour exister et gérer leur programmation sur Pulse.

## 📋 Fonctionnalités implémentées

### 1. API Routes

#### GET `/api/venues/me`
- Récupère toutes les venues possédées par l'utilisateur connecté
- Inclut les compteurs d'événements et de demandes
- Inclut les 5 prochains événements pour chaque venue

#### POST `/api/venues`
- Crée une nouvelle venue
- Génère automatiquement un slug unique à partir du nom
- Valide les champs requis
- Associe la venue à l'utilisateur connecté (ownerUserId)

#### PATCH `/api/venues/[id]`
- Met à jour une venue existante
- Vérifie que la venue appartient à l'utilisateur
- Régénère le slug si le nom change
- Met à jour uniquement les champs fournis

#### GET `/api/venues/[id]/stats`
- Récupère les statistiques d'une venue
- Vérifie que la venue appartient à l'utilisateur
- Calcule :
  - Total d'événements
  - Événements à venir
  - Vues totales et des 30 derniers jours
  - Favoris totaux et des 30 derniers jours

#### GET `/api/geocode?address=...`
- Géocode une adresse en utilisant OpenStreetMap Nominatim
- Retourne les coordonnées lat/lon
- Utilisé pour remplir automatiquement les coordonnées dans le formulaire

### 2. Page Dashboard `/venue/dashboard`

**Fichier :** `src/app/venue/dashboard/page.tsx`

**Fonctionnalités :**

1. **Protection d'authentification**
   - Redirection vers `/auth/signin` si non authentifié
   - Vérification de session à chaque chargement

2. **Liste des venues**
   - Panneau latéral avec toutes les venues de l'utilisateur
   - Affichage du nombre d'événements par venue
   - Sélection d'une venue pour voir les détails

3. **Formulaire de création/édition**
   - Formulaire complet avec tous les champs :
     - Nom (requis, génère le slug)
     - Description
     - Capacité
     - Adresse complète (adresse, ville, code postal)
     - Coordonnées (lat/lon) avec bouton de géocodage automatique
     - Quartier
     - Téléphone
     - Site web
     - Email de contact
     - Types de salle (bar, club, salle, centre_culturel, etc.)
   - Validation des champs requis
   - Génération automatique du slug
   - Géocodage automatique de l'adresse

4. **Détails de la venue**
   - Affichage de toutes les informations
   - Lien vers la page publique (si slug existe)
   - Bouton pour modifier
   - Types de salle affichés en badges

5. **Statistiques**
   - Total d'événements
   - Événements à venir
   - Vues totales et des 30 derniers jours
   - Favoris totaux et des 30 derniers jours
   - Affichage en grille responsive

6. **Calendrier des événements**
   - Liste des événements à venir de la venue
   - Date formatée en français
   - Lien vers chaque événement
   - Message si aucun événement

7. **Onboarding en 3 étapes**
   - Modal d'accueil pour les nouveaux utilisateurs
   - 3 étapes :
     1. Introduction : "Créez votre première salle"
     2. Informations : "Remplissez les informations"
     3. Action : "C'est parti !" avec bouton pour créer
   - Peut être fermé ou ignoré
   - S'affiche automatiquement si l'utilisateur n'a pas de venues

### 3. Génération de slug

**Fonctionnalités :**
- Génération automatique à partir du nom
- Normalisation (suppression des accents, caractères spéciaux)
- Conversion en minuscules
- Remplacement des espaces par des tirets
- Vérification d'unicité (ajout d'un numéro si nécessaire)
- Limitation à 100 caractères

**Exemples :**
- "Le Belmont" → "le-belmont"
- "Café Cléopatra" → "cafe-cleopatra"
- "Le Belmont" (si existe déjà) → "le-belmont-1"

### 4. Géocodage automatique

- Utilise OpenStreetMap Nominatim (gratuit, pas de clé API requise)
- Bouton "Géocoder" dans le formulaire
- Remplit automatiquement les champs lat/lon
- Gère les erreurs gracieusement

## 🎨 Design & UX

- Design cohérent avec le reste de l'application (gradient sombre)
- Interface responsive (mobile, tablette, desktop)
- Feedback visuel pour les actions
- Messages d'erreur clairs
- Loading states appropriés
- Modal d'onboarding non-intrusive

## 🔒 Sécurité

- Vérification d'authentification sur toutes les routes
- Vérification de propriété avant modification
- Validation des données côté serveur
- Protection CSRF via NextAuth

## 📊 Performance

- Chargement optimisé avec `include` Prisma
- Limitation des événements chargés (5 pour la liste, 10 pour les détails)
- Requêtes parallèles pour les stats
- Cache côté client pour éviter les rechargements inutiles

## 🔗 Intégration

- ✅ Utilise le système d'authentification existant (NextAuth)
- ✅ Compatible avec le modèle Venue du Sprint 0
- ✅ Génère des slugs pour les pages publiques (Sprint 1)
- ✅ Prêt pour les demandes de réservation (Sprint 3)

## 📝 Notes techniques

- Le slug est généré automatiquement mais peut être modifié manuellement si nécessaire (via PATCH)
- Les coordonnées sont requises pour créer une venue (pour la carte)
- Le géocodage est optionnel mais recommandé
- Les types de salle sont stockés comme un tableau de strings
- Les stats sont calculées en temps réel (pas de cache)

## 🚀 Prochaines étapes

Le Sprint 2 est complété. Les prochaines étapes :

- **Sprint 3** : Demande de réservation salle (utilisera les venues créées ici)
- **Sprint 4** : IA pour organisateurs
- **Sprint 5** : IA pour salles

## 🐛 Points d'attention

- Le géocodage peut échouer pour certaines adresses (fallback manuel)
- Les stats peuvent être lentes si beaucoup d'événements (optimisation future possible)
- L'onboarding s'affiche à chaque visite si aucune venue (pourrait être mémorisé)
