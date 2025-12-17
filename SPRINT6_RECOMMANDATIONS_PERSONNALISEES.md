# 🟪 SPRINT 6 — SOCIAL + RECOMMANDATIONS PERSONNALISÉES

**Date** : Janvier 2025  
**Statut** : 📋 Planifié  
**Objectif** : Système complet de recommandations personnalisées basées sur les goûts musicaux (Spotify, Apple Music) et préférences utilisateur

---

## 🎯 Vision

Permettre aux utilisateurs d'avoir des recommandations d'événements ultra-personnalisées basées sur :
1. **Analyse automatique** de leur historique d'écoute Spotify/Apple Music
2. **Préférences manuelles** renseignées dans leur profil
3. **Historique d'interactions** (favoris, événements consultés, participations)

**Principe** : "Plus on connaît les goûts musicaux de l'utilisateur, plus les recommandations sont pertinentes"

---

## 📋 Tâches Détaillées

### 1. 🆕 Connexion Spotify & Apple Music

#### 1.1 Modèle de données pour les connexions musicales

**Fichier** : `prisma/schema.prisma`

**Nouveau modèle** : `MusicServiceConnection`
```prisma
model MusicServiceConnection {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @map("user_id") @db.Uuid
  service           String   // 'spotify' | 'apple_music'
  accessToken       String   @map("access_token") @db.Text
  refreshToken      String?  @map("refresh_token") @db.Text
  expiresAt         DateTime @map("expires_at")
  externalUserId    String   @map("external_user_id") // ID utilisateur sur le service
  lastSyncAt        DateTime? @map("last_sync_at") // Dernière synchronisation
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, service])
  @@map("music_service_connections")
}
```

**Ajout au modèle User** :
```prisma
model User {
  // ... champs existants
  musicServiceConnections MusicServiceConnection[]
  interestTags            UserInterestTag[] // Relation à ajouter si elle n'existe pas
}
```

#### 1.2 OAuth Spotify

**Fichier** : `src/lib/music-services/spotify.ts`

**Fonctionnalités** :
- `initiateSpotifyAuth()` : Générer l'URL d'autorisation Spotify
- `handleSpotifyCallback(code)` : Échanger le code contre un access token
- `refreshSpotifyToken(refreshToken)` : Rafraîchir le token expiré
- `getUserTopTracks(accessToken, timeRange)` : Récupérer les top tracks (short_term, medium_term, long_term)
- `getUserTopArtists(accessToken, timeRange)` : Récupérer les top artists
- `getUserRecentlyPlayed(accessToken)` : Récupérer l'historique récent
- `analyzeMusicTaste(tracks, artists)` : Analyser les goûts musicaux et extraire les genres/styles

**API Spotify** :
- Scopes requis : `user-top-read`, `user-read-recently-played`, `user-read-private`
- Endpoints :
  - `GET https://api.spotify.com/v1/me/top/tracks`
  - `GET https://api.spotify.com/v1/me/top/artists`
  - `GET https://api.spotify.com/v1/me/player/recently-played`

**Référence** : https://developer.spotify.com/documentation/web-api

#### 1.3 OAuth Apple Music

**Fichier** : `src/lib/music-services/apple-music.ts`

**Fonctionnalités** :
- `initiateAppleMusicAuth()` : Générer l'URL d'autorisation Apple Music
- `handleAppleMusicCallback(code)` : Échanger le code contre un access token
- `refreshAppleMusicToken(refreshToken)` : Rafraîchir le token expiré
- `getUserHeavyRotation(accessToken)` : Récupérer la rotation lourde (musiques écoutées souvent)
- `getUserRecentlyPlayed(accessToken)` : Récupérer l'historique récent
- `getUserTopCharts(accessToken)` : Récupérer les charts personnalisés
- `analyzeMusicTaste(tracks, artists)` : Analyser les goûts musicaux

**API Apple Music** :
- Scopes requis : `user-library-read`, `user-top-read`
- Endpoints :
  - `GET https://api.music.apple.com/v1/me/history/heavy-rotation`
  - `GET https://api.music.apple.com/v1/me/recent/played/tracks`
  - `GET https://api.music.apple.com/v1/me/charts`

**Référence** : https://developer.apple.com/documentation/applemusicapi

#### 1.4 Service d'analyse des goûts musicaux

**Fichier** : `src/lib/music-services/tasteAnalyzer.ts`

**Fonctionnalités** :
- `extractGenresFromTracks(tracks)` : Extraire les genres depuis les tracks Spotify/Apple Music
- `extractStylesFromArtists(artists)` : Extraire les styles musicaux depuis les artists
- `mapToEventGenres(spotifyGenres)` : Mapper les genres Spotify vers la taxonomie Pulse (ex: "reggae" → "REGGAE", "dancehall" → "DANCEHALL")
- `calculateGenreWeights(genres)` : Calculer les poids de préférence par genre (fréquence d'écoute)
- `generateUserMusicProfile(tracks, artists)` : Générer un profil musical complet

**Mapping des genres** :
- Créer un fichier `src/lib/music-services/genreMapping.ts` avec le mapping :
  - Spotify genres → Pulse genres
  - Apple Music genres → Pulse genres
  - Gérer les cas spéciaux (ex: "reggae fusion" → "REGGAE", "dancehall" → "DANCEHALL")

---

### 2. 🆕 Page de profil utilisateur avec préférences musicales

#### 2.1 Modèle de données pour les préférences musicales

**Fichier** : `prisma/schema.prisma`

**Mise à jour du modèle** : `UserPreferences`
```prisma
model UserPreferences {
  // ... champs existants
  
  // Nouvelles préférences musicales
  favoriteGenres           String[] @default([]) @map("favorite_genres") // Genres musicaux préférés
  favoriteStyles           String[] @default([]) @map("favorite_styles") // Styles musicaux préférés
  favoriteEventTypes       String[] @default([]) @map("favorite_event_types") // Types d'événements préférés (concert, dj_set, etc.)
  favoriteAmbiances        String[] @default([]) @map("favorite_ambiances") // Ambiances préférées
  notificationGenres       String[] @default([]) @map("notification_genres") // Genres pour lesquels recevoir des notifications
  notificationStyles       String[] @default([]) @map("notification_styles") // Styles pour lesquels recevoir des notifications
  musicTasteAutoSync        Boolean  @default(true) @map("music_taste_auto_sync") // Synchroniser automatiquement depuis Spotify/Apple Music
  lastMusicTasteSyncAt     DateTime? @map("last_music_taste_sync_at") // Dernière synchronisation automatique
}
```

**Mise à jour du modèle** : `UserInterestTag` (déjà existant, à compléter)

**État actuel** :
```prisma
model UserInterestTag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  category  String
  value     String
  score     Float    @default(0)
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId, category, value], name: "unique_user_tag_interest")
  @@map("user_interest_tags")
}
```

**Champs à ajouter** :
```prisma
model UserInterestTag {
  // ... champs existants
  source    String   @default('manual') // 'manual' | 'spotify' | 'apple_music' | 'auto'
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migration nécessaire** : Ajouter les champs `source` et `createdAt` au modèle existant.

#### 2.2 Page de profil utilisateur

**Fichier** : `src/app/profil/page.tsx` (nouveau)

**Fonctionnalités** :
1. **Section "Connexions musicales"** :
   - Bouton "Connecter Spotify" (si non connecté)
   - Bouton "Connecter Apple Music" (si non connecté)
   - Afficher les services connectés avec option de déconnexion
   - Afficher la date de dernière synchronisation
   - Bouton "Synchroniser maintenant" pour forcer une sync

2. **Section "Mes goûts musicaux"** :
   - Liste des genres musicaux détectés depuis Spotify/Apple Music (si connecté)
   - Liste des styles musicaux détectés
   - Badge "Détecté depuis Spotify" / "Détecté depuis Apple Music" pour chaque tag
   - Possibilité de supprimer des tags détectés automatiquement
   - Possibilité d'ajouter manuellement des genres/styles

3. **Section "Préférences d'événements"** :
   - Sélecteur multi-choix pour les genres musicaux (utiliser la taxonomie)
   - Sélecteur multi-choix pour les styles musicaux (par genre)
   - Sélecteur multi-choix pour les types d'événements (concert, dj_set, festival, etc.)
   - Sélecteur multi-choix pour les ambiances (salle_de_concert, warehouse, exterieur, etc.)

4. **Section "Notifications personnalisées"** :
   - Checkbox "Recevoir des notifications pour mes genres préférés"
   - Sélecteur multi-choix pour les genres de notifications
   - Sélecteur multi-choix pour les styles de notifications
   - Options : "Nouveaux événements", "Rappels 24h avant", "Rappels 1h avant"

**Design** :
- Utiliser le même style que `/organisateur/mon-profil`
- Sections collapsibles
- Badges colorés pour les tags
- Icônes Spotify/Apple Music

#### 2.3 API pour gérer les préférences

**Fichier** : `src/app/api/user/preferences/route.ts` (nouveau)

**Endpoints** :
- `GET /api/user/preferences` : Récupérer les préférences de l'utilisateur connecté
- `PATCH /api/user/preferences` : Mettre à jour les préférences
- `POST /api/user/preferences/music-taste/sync` : Forcer une synchronisation depuis Spotify/Apple Music

**Fichier** : `src/app/api/user/music-services/route.ts` (nouveau)

**Endpoints** :
- `GET /api/user/music-services` : Récupérer les connexions musicales
- `POST /api/user/music-services/spotify/connect` : Initier la connexion Spotify
- `POST /api/user/music-services/spotify/callback` : Callback OAuth Spotify
- `POST /api/user/music-services/apple-music/connect` : Initier la connexion Apple Music
- `POST /api/user/music-services/apple-music/callback` : Callback OAuth Apple Music
- `DELETE /api/user/music-services/:service` : Déconnecter un service

---

### 3. 🆕 Système de recommandations personnalisées

#### 3.1 Service de recommandations

**Fichier** : `src/lib/recommendations/recommendationEngine.ts`

**Fonctionnalités** :
- `getPersonalizedRecommendations(userId, limit)` : Générer des recommandations personnalisées
- `calculateEventScore(event, userProfile)` : Calculer un score de pertinence pour un événement
- `getRecommendationsByGenre(userId, genre, limit)` : Recommandations par genre spécifique
- `getRecommendationsByStyle(userId, style, limit)` : Recommandations par style spécifique

**Algorithme de scoring** :
1. **Score de genre** (40%) : Correspondance avec les genres préférés
2. **Score de style** (30%) : Correspondance avec les styles préférés
3. **Score d'historique** (20%) : Basé sur les favoris et événements consultés
4. **Score de popularité** (10%) : Nombre de favoris, vues, etc.

**Fichier** : `src/lib/recommendations/userProfileBuilder.ts`

**Fonctionnalités** :
- `buildUserMusicProfile(userId)` : Construire le profil musical complet
- `mergeMusicTasteSources(userId)` : Fusionner les sources (Spotify, Apple Music, manuel)
- `calculateGenreWeights(userId)` : Calculer les poids de préférence par genre

#### 3.2 Page "Pour toi" personnalisée

**Fichier** : `src/app/pour-toi/page.tsx` (nouveau)

**Fonctionnalités** :
- Afficher les événements recommandés basés sur les goûts musicaux
- Section "Basé sur vos goûts Spotify" (si connecté)
- Section "Basé sur vos préférences" (genres/styles manuels)
- Section "Événements similaires à vos favoris"
- Filtres : "Aujourd'hui", "Cette semaine", "Ce mois"
- Explication de chaque recommandation : "Recommandé car vous aimez le reggae"

**Design** :
- Hero section : "Découvrez des événements faits pour vous"
- Cartes d'événements avec badge "Recommandé pour vous"
- Badge "Basé sur Spotify" / "Basé sur vos préférences"

#### 3.3 API de recommandations

**Fichier** : `src/app/api/recommendations/route.ts` (nouveau)

**Endpoints** :
- `GET /api/recommendations` : Récupérer les recommandations personnalisées
  - Query params : `limit`, `genre`, `style`, `scope` (today/weekend/all)
- `GET /api/recommendations/explain/:eventId` : Expliquer pourquoi un événement est recommandé

---

### 4. 🔄 Notifications personnalisées basées sur les goûts

#### 4.1 Service de notifications personnalisées

**Fichier** : `src/lib/notifications/personalizedNotifications.ts`

**Fonctionnalités** :
- `checkAndSendGenreNotifications()` : Vérifier et envoyer des notifications pour les nouveaux événements correspondant aux genres préférés
- `shouldNotifyUser(event, userId)` : Déterminer si un utilisateur doit être notifié pour un événement
- `createPersonalizedNotification(userId, event, reason)` : Créer une notification avec explication

**Logique** :
- Si un nouvel événement correspond à un genre/style dans `notificationGenres` ou `notificationStyles`
- Envoyer une notification : "Nouvel événement reggae qui pourrait vous plaire : [Titre]"

#### 4.2 CRON job pour notifications personnalisées

**Fichier** : `src/app/api/cron/personalized-notifications/route.ts` (nouveau)

**Fonctionnalités** :
- S'exécuter toutes les heures
- Vérifier les nouveaux événements créés dans la dernière heure
- Pour chaque événement, trouver les utilisateurs qui devraient être notifiés
- Envoyer les notifications (push + email si activé)

---

### 5. 🔄 Mise à jour du modèle UserInterestTag existant

**Vérifier** : Le modèle `UserInterestTag` existe déjà dans le schéma. S'assurer qu'il supporte :
- Les sources multiples (manual, spotify, apple_music, auto)
- Les poids de préférence
- Les catégories (genre, style, type, ambiance)

**Migration** : Si nécessaire, créer une migration pour ajouter les champs manquants.

---

## 📊 Structure des données

### Flux de synchronisation Spotify/Apple Music

1. **Utilisateur clique "Connecter Spotify"**
   - Redirection vers OAuth Spotify
   - Callback avec code
   - Échange code → access token + refresh token
   - Stockage dans `MusicServiceConnection`

2. **Synchronisation automatique** (toutes les 24h ou manuelle)
   - Récupération des top tracks/artists depuis Spotify/Apple Music
   - Analyse des genres/styles
   - Mapping vers la taxonomie Pulse
   - Création/mise à jour des `UserInterestTag` avec `source='spotify'` ou `source='apple_music'`

3. **Fusion avec préférences manuelles**
   - Les tags manuels (`source='manual'`) ont priorité
   - Les tags automatiques peuvent être supprimés par l'utilisateur
   - Calcul des poids finaux pour les recommandations

---

## 🎯 Résultats attendus

### Pour l'utilisateur
- ✅ Connexion Spotify/Apple Music en 2 clics
- ✅ Découverte automatique de ses goûts musicaux
- ✅ Recommandations ultra-pertinentes basées sur l'écoute réelle
- ✅ Notifications pour les événements qui correspondent vraiment à ses goûts
- ✅ Contrôle total sur les préférences (ajout/suppression manuelle)

### Pour Pulse
- ✅ Différenciation forte : recommandations basées sur l'écoute réelle
- ✅ Engagement accru : utilisateurs voient des événements vraiment pertinents
- ✅ Rétention améliorée : notifications ciblées = moins de désabonnements
- ✅ Données précieuses : comprendre les goûts musicaux des utilisateurs

---

## 📝 Notes techniques

### Sécurité
- Stocker les tokens de manière sécurisée (chiffrement)
- Ne jamais exposer les tokens dans les réponses API
- Rafraîchir automatiquement les tokens expirés
- Gérer les erreurs de déconnexion (utilisateur révoque l'accès)

### Performance
- Cache des recommandations (TTL 1h)
- Synchronisation asynchrone (queue jobs)
- Index sur `UserInterestTag(userId, category, value)`

### Privacy
- Option "Ne pas synchroniser automatiquement"
- Possibilité de supprimer tous les tags détectés
- Explication claire de l'utilisation des données

---

## 🚀 Ordre d'implémentation recommandé

1. **Phase 1** : Modèles de données + OAuth Spotify
2. **Phase 2** : Page de profil + préférences manuelles
3. **Phase 3** : Analyse des goûts musicaux + synchronisation
4. **Phase 4** : Moteur de recommandations
5. **Phase 5** : Page "Pour toi" + notifications personnalisées
6. **Phase 6** : OAuth Apple Music (après validation Spotify)

---

**Dernière mise à jour** : Janvier 2025

