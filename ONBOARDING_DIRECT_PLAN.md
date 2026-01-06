# 🎯 Plan d'Implémentation - Onboarding Direct (Sans Spotify)

**Décision Produit** : Suppression complète de l'intégration Spotify, remplacement par un onboarding direct pour capturer les préférences utilisateur.

---

## 📋 Objectifs

1. **Onboarding rapide** (30-60s) pour capturer les goûts musicaux et préférences
2. **Recommandations basées sur préférences directes** (pas de dépendance tierce)
3. **Service éditorial AI** pour générer du contenu (Top 5 par genre/catégorie/vibe)

---

## 🗄️ 1. Schéma Base de Données

### Modifier `UserPreferences` dans `prisma/schema.prisma`

Ajouter les champs :
- `musicPreferences String[]` - Genres musicaux sélectionnés
- `categoryPreferences String[]` - Catégories d'événements sélectionnées
- `vibePreferences String[]` - Ambiances/vibes sélectionnées
- `preferredDays String[]` - Jours préférés (weekday/weekend)
- `preferredTimes String[]` - Horaires préférés (day/evening/night)
- `preferredNeighborhoods String[]` - Quartiers préférés
- `onboardingCompleted Boolean` - Si l'onboarding a été complété

---

## 🎨 2. Onboarding Flow

### Étapes

**Step 1 - Genres Musicaux** (multi-select) :
- Rock
- Indie
- Hip-hop
- Reggae / Dub
- Electronic
- Techno
- Jazz
- Afro / Caribbean
- Pop
- Metal
- Latin
- Funk / Soul

**Step 2 - Catégories d'Événements** (multi-select) :
- Culture
- Family
- Sport
- Nightlife
- Festivals
- Community
- Wellness
- Talks / Conferences

**Step 3 - Ambiances / Vibes** (multi-select) :
- Chill
- Dancing
- Underground
- Festive
- Intimate
- Political / Engaged
- Alternative
- Mainstream

**Step 4 (Optionnel)** :
- Preferred days (weekday / weekend)
- Preferred time (day / evening / night)
- Preferred neighborhoods

### Fichiers à créer

- `src/app/onboarding/page.tsx` - Page d'onboarding complète
- `src/app/onboarding/onboarding-client.tsx` - Composant client avec étapes
- `src/app/api/user/preferences/onboarding/route.ts` - API pour sauvegarder les préférences

---

## 🔍 3. Moteur de Recommandations

### Modifier `src/lib/recommendations/userProfileBuilder.ts`

- Utiliser `UserPreferences.musicPreferences` au lieu de Spotify
- Utiliser `UserPreferences.categoryPreferences` pour filtrer
- Utiliser `UserPreferences.vibePreferences` pour scoring

### Modifier `src/lib/recommendations/recommendationEngine.ts`

- Scoring basé sur :
  - Match avec `musicPreferences` (40%)
  - Match avec `categoryPreferences` (30%)
  - Match avec `vibePreferences` (20%)
  - Proximité géographique (5%)
  - Pertinence temporelle (5%)

---

## 🧹 4. Suppression Spotify

### Fichiers à supprimer/modifier

**Supprimer** :
- `src/app/api/integrations/spotify/**`
- `src/app/api/user/music-services/spotify/**`
- `src/app/api/user/music-taste/sync/route.ts`
- `src/lib/music-services/spotify.ts`
- `src/lib/music-services/genreMapping.ts`
- `src/lib/encryption.ts` (si uniquement utilisé pour Spotify)
- `docs/SPOTIFY_SETUP.md`
- `docs/spotify-review/**`
- `SPOTIFY_INTEGRATION_PLAN.md`
- `SPOTIFY_PASSER_EN_PRODUCTION.md`
- `CORRECTION_SPOTIFY_403.md`
- `CORRECTION_SPOTIFY_CALLBACK.md`

**Modifier** :
- `src/app/profil/profil-client.tsx` - Supprimer toute la section Spotify
- `src/app/politique-confidentialite/page.tsx` - Supprimer section Spotify
- `src/lib/recommendations/userProfileBuilder.ts` - Retirer références Spotify
- `prisma/schema.prisma` - Supprimer `MusicServiceConnection` (optionnel, peut être gardé pour futur)

---

## 📝 5. Service Éditorial AI

### Créer `src/lib/editorial/editorialService.ts`

Fonctionnalités :
- `generateTop5ByGenre(genre: string, period: 'week' | 'weekend')` - Top 5 par genre
- `generateTop5ByCategory(category: string, period: 'week' | 'weekend')` - Top 5 par catégorie
- `generateTop5ByVibe(vibe: string, period: 'week' | 'weekend')` - Top 5 par vibe

### API Routes

- `src/app/api/editorial/top5/genre/[genre]/route.ts`
- `src/app/api/editorial/top5/category/[category]/route.ts`
- `src/app/api/editorial/top5/vibe/[vibe]/route.ts`

### Utilisation

- Homepage sections
- Push notifications (futur)
- Social media posts (futur)

---

## 🎨 6. UI Modifications

### Page "Pour toi"

- `src/app/pour-toi/page.tsx` - Utiliser les préférences directes
- Afficher "Basé sur vos préférences" au lieu de "Basé sur Spotify"

### Page Profil

- `src/app/profil/profil-client.tsx` :
  - Supprimer section Spotify
  - Ajouter "Modifier mes préférences" qui redirige vers onboarding
  - Afficher les préférences sélectionnées

### Navigation

- Ajouter un middleware pour rediriger les nouveaux utilisateurs vers `/onboarding` si `onboardingCompleted === false`

---

## ✅ Checklist d'Implémentation

### Phase 1 : Base de Données
- [ ] Modifier `UserPreferences` dans schema.prisma
- [ ] Créer migration Prisma
- [ ] Tester migration

### Phase 2 : Onboarding
- [ ] Créer page `/onboarding`
- [ ] Créer composant client avec étapes
- [ ] Créer API route pour sauvegarder
- [ ] Tester flow complet

### Phase 3 : Recommandations
- [ ] Modifier `userProfileBuilder.ts`
- [ ] Modifier `recommendationEngine.ts`
- [ ] Tester recommandations basées sur préférences

### Phase 4 : Suppression Spotify
- [ ] Supprimer fichiers Spotify
- [ ] Modifier UI pour retirer références
- [ ] Modifier politique de confidentialité
- [ ] Tester que tout fonctionne sans Spotify

### Phase 5 : Service Éditorial
- [ ] Créer `editorialService.ts`
- [ ] Créer API routes
- [ ] Tester génération Top 5

### Phase 6 : Finalisation
- [ ] Tests end-to-end
- [ ] Vérifier que l'onboarding est skippable
- [ ] Vérifier redirection nouveaux utilisateurs
- [ ] Documentation

---

**Dernière mise à jour** : Janvier 2025

