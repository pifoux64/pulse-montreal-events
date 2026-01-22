# 🟣 Sprint 5 – IA pour Salles

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Aider les salles à mieux se remplir avec des suggestions automatiques, du matching intelligent et des statistiques d'occupation.

## 📋 Fonctionnalités implémentées

### 1. API Routes

#### POST `/api/ai/venue-suggestions`
- Analyse les événements passés (6 derniers mois)
- Identifie les jours creux avec raisons et suggestions
- Détecte les types d'événements manquants avec potentiel
- Propose des recommandations générales
- Calcule des statistiques (événements/semaine, répartition par jour)
- Utilise GPT-4o-mini avec fallback sur calculs de base
- Cache 24h

#### POST `/api/ai/venue-matching`
- Trouve des organisateurs compatibles avec la venue
- Calcule un score de compatibilité (0-100)
- Identifie les raisons de compatibilité
- Trouve des concepts similaires performants
- Analyse basée sur :
  - Types d'événements
  - Capacité de salle
  - Historique des organisateurs
  - Performance des événements (favoris)
- Utilise GPT-4o-mini avec fallback sur calculs de base
- Cache 24h

#### GET `/api/venues/[id]/occupation-stats`
- Calcule le taux d'occupation :
  - Événements par semaine
  - Taux d'occupation (% de jours avec événements)
  - Total et à venir
- Analyse la répartition :
  - Par jour de la semaine
  - Par catégorie d'événement
- Calcule les tendances :
  - Comparaison 3 derniers mois vs 3 mois précédents
  - Évolution événements et favoris
- Performance par jour :
  - Nombre d'événements
  - Favoris moyens
- Top catégories

### 2. Composant UI

#### `VenueAITools`
**Fichier :** `src/components/ai/VenueAITools.tsx`

- Interface avec 3 onglets :
  1. **Suggestions** : Jours creux, types manquants, recommandations
  2. **Matching** : Organisateurs compatibles, concepts similaires
  3. **Stats** : Taux d'occupation, tendances, répartition

**Fonctionnalités :**
- Chargement à la demande (lazy loading)
- Affichage formaté et lisible
- Liens vers profils organisateurs et événements
- Graphiques de répartition
- Indicateurs de tendances (hausse/baisse)
- Scores de compatibilité visuels

### 3. Intégration dans le Dashboard Salle

**Fichier :** `src/app/venue/dashboard/page.tsx`

- Nouvelle section "Outils IA pour Salles"
- Positionnée avant les demandes de réservation
- Accessible uniquement pour les venues sélectionnées
- Interface cohérente avec le reste du dashboard

## 🎨 Design & UX

- Interface avec onglets pour navigation facile
- Badges colorés pour scores et statuts
- Graphiques de barres pour répartition
- Indicateurs de tendances (vert = hausse, rouge = baisse)
- Liens cliquables vers profils et événements
- Loading states et gestion d'erreurs
- Design cohérent avec le reste de l'application

## 🤖 Intelligence Artificielle

- **Modèle** : GPT-4o-mini (OpenAI)
- **Client** : Utilise `callOpenAI` du client centralisé
- **Cache** : 24h pour suggestions et matching
- **Fallback** : Calculs de base si l'IA échoue
- **Contextualisation** : Prompts adaptés à Montréal

## 📊 Statistiques

- **Taux d'occupation** : Calcul basé sur événements/semaine
- **Tendances** : Comparaison périodes (3 mois vs 3 mois précédents)
- **Performance** : Analyse par jour et par catégorie
- **Distribution** : Répartition temporelle et thématique

## 🔗 Intégration

- ✅ Utilise l'infrastructure IA existante
- ✅ Compatible avec le système d'authentification
- ✅ Intégré dans le dashboard salle
- ✅ Utilise les données réelles de la venue
- ✅ Liens vers profils organisateurs et événements

## 📝 Notes techniques

- Les suggestions sont basées sur les 6 derniers mois
- Le matching analyse jusqu'à 50 organisateurs (limite pour performance)
- Les stats d'occupation calculent sur 6 mois
- Les tendances comparent 3 derniers mois vs 3 mois précédents
- Le cache évite les recalculs fréquents

## 🚀 Prochaines étapes possibles

- **Notifications** : Alerter quand un jour creux est identifié
- **Actions automatiques** : Proposer directement de contacter un organisateur compatible
- **Historique** : Suivre l'évolution des suggestions dans le temps
- **Export** : Exporter les stats en PDF/CSV
- **Comparaison** : Comparer avec d'autres salles similaires

## 🐛 Points d'attention

- Nécessite `OPENAI_API_KEY` configurée
- Les calculs peuvent être lents avec beaucoup d'événements
- Le matching est limité à 50 organisateurs (pourrait être paginé)
- Les suggestions nécessitent au moins quelques événements passés
