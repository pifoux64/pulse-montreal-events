# 🟣 Sprint 4 – IA pour Organisateurs

## ✅ Statut : COMPLÉTÉ

## 🎯 Objectif

Simplifier radicalement la création d'événements avec des outils IA qui génèrent descriptions, tags, contenu marketing et calculs budgétaires.

## 📋 Fonctionnalités implémentées

### 1. API Routes

#### POST `/api/ai/event-assistant`
- Génère automatiquement à partir d'une description simple :
  - Titre accrocheur
  - Description complète (200-500 mots)
  - Description courte (100-150 caractères)
  - Tags pertinents (5-10)
  - Genres musicaux (si applicable)
  - Type d'événement
  - Ambiance recherchée
  - Public cible
  - Prix suggéré
- Utilise GPT-4o-mini avec température 0.7 (créatif)
- Cache 1h pour éviter les appels redondants
- Contextualisé pour Montréal (bilingue, quartiers, scène culturelle)

#### POST `/api/ai/content-generator`
- Génère un plan de communication complet :
  - Timeline (J-14 à Jour J)
  - Actions par plateforme
  - Conseils pour maximiser la visibilité
- Génère des posts Facebook :
  - Texte avec emojis et hashtags
  - Suggestions d'images
- Génère des légendes Instagram :
  - Caption avec hashtags
  - Hashtags pertinents (10-15)
  - Suggestions d'images
- Utilise GPT-4o-mini avec température 0.8 (très créatif)
- Cache 2h

#### POST `/api/ai/budget-calculator`
- Calcule le budget prévisionnel :
  - Coûts détaillés (salle, artistes, son, éclairage, promotion, personnel, autres)
  - Total des coûts
- Calcule le seuil de rentabilité :
  - Prix de billet nécessaire
  - Nombre de personnes nécessaires
  - Revenus au seuil
- Propose des stratégies de tarification :
  - Gratuit (si viable)
  - Prix bas, moyen, élevé avec public cible
- Recommandations pour optimiser le budget
- Utilise des calculs côté serveur + IA pour recommandations contextuelles
- Estimations automatiques si coûts non fournis

### 2. Composants UI

#### `EventAssistant`
**Fichier :** `src/components/ai/EventAssistant.tsx`

- Formulaire simple : description + type d'événement optionnel
- Génération avec bouton "Générer avec l'IA"
- Affichage des résultats :
  - Titre, descriptions (courte et complète)
  - Tags et genres musicaux en badges
  - Métadonnées (type, ambiance, public, prix)
- Boutons de copie pour chaque champ
- Callback `onResult` pour intégration avec formulaire d'événement

#### `ContentGenerator`
**Fichier :** `src/components/ai/ContentGenerator.tsx`

- Accepte les props d'événement (titre, description, date, lieu, URL)
- Génération du plan de communication
- Interface avec onglets :
  - Plan : Timeline et conseils
  - Facebook : Post complet avec bouton copie
  - Instagram : Légende + hashtags avec bouton copie
- Affichage formaté et prêt à utiliser

#### `BudgetCalculator`
**Fichier :** `src/components/ai/BudgetCalculator.tsx`

- Formulaire complet pour saisir les coûts :
  - Type d'événement
  - Personnes attendues / Capacité salle
  - Coûts (salle, artistes, promotion, autres)
  - Options (son, éclairage)
- Calcul automatique avec estimations si non fournies
- Affichage des résultats :
  - Coûts détaillés avec total
  - Seuil de rentabilité
  - Suggestions de tarification (gratuit, bas, moyen, élevé)
  - Recommandations IA

### 3. Intégration dans le Dashboard Organisateur

**Fichier :** `src/app/organisateur/dashboard/page.tsx`

- Nouvelle section "Outils IA pour Organisateurs"
- Interface avec onglets pour les 3 outils
- Section pliable/dépliable
- Accessible à tous les organisateurs (pas de restriction PRO pour l'instant)

## 🎨 Design & UX

- Design cohérent avec le reste de l'application
- Interface intuitive avec onglets
- Feedback visuel (loading, erreurs, succès)
- Boutons de copie pour faciliter l'utilisation
- Badges colorés pour tags et genres
- Affichage formaté et lisible

## 🤖 Intelligence Artificielle

- **Modèle** : GPT-4o-mini (OpenAI)
- **Client** : Utilise `callOpenAI` du client centralisé existant
- **Cache** : Cache en mémoire pour éviter les appels redondants
- **Retry** : Gestion automatique des erreurs et retry
- **Validation** : Schémas Zod pour validation des réponses
- **Contextualisation** : Prompts adaptés à Montréal (bilingue, culture locale)

## 🔗 Intégration

- ✅ Utilise l'infrastructure IA existante (`src/lib/ai/client.ts`)
- ✅ Compatible avec le système d'authentification
- ✅ Intégré dans le dashboard organisateur
- ✅ Prêt pour intégration avec le formulaire de création d'événement

## 📝 Notes techniques

- Les coûts sont stockés en dollars CAD
- Le budget est calculé en temps réel (pas de cache pour les calculs)
- Les recommandations IA sont optionnelles (fallback sur calculs de base)
- Le cache IA évite les appels redondants pour des inputs similaires
- Les prompts sont optimisés pour le contexte montréalais

## 🚀 Prochaines étapes possibles

- **Intégration directe** : Pré-remplir le formulaire de création d'événement avec les résultats de l'assistant
- **Historique** : Sauvegarder les générations pour référence
- **Templates** : Proposer des templates selon le type d'événement
- **Export** : Exporter le plan de communication en PDF
- **Notifications** : Rappels automatiques selon le plan de communication

## 🐛 Points d'attention

- Nécessite `OPENAI_API_KEY` configurée
- Les coûts d'API peuvent s'accumuler avec beaucoup d'utilisateurs
- Le cache est en mémoire (à migrer vers Redis/DB pour production)
- Les estimations de coûts sont basiques (pourraient être améliorées avec plus de données)
