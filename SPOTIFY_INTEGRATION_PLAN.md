# 🎵 Plan d'Intégration Spotify - Production Ready

**Objectif** : Intégration Spotify complète et production-ready pour Pulse, permettant aux utilisateurs de connecter leur compte Spotify via OAuth pour obtenir des recommandations personnalisées d'événements basées sur leurs goûts musicaux.

**Contraintes** :
- Une seule app Spotify Developer : "Pulse"
- OAuth utilisateur (pas besoin de compte développeur pour les utilisateurs)
- Scopes minimaux
- Stockage sécurisé des tokens + refresh automatique
- Flux Disconnect + Delete data
- Conformité avec Spotify Developer Policy

---

## 📊 État Actuel de l'Existant

### ✅ Déjà Implémenté

1. **OAuth Routes** (chemins différents à aligner)
   - ✅ `POST /api/user/music-services/spotify/connect` → Génère authUrl
   - ✅ `GET /api/user/music-services/spotify/callback` → Échange code pour tokens
   - ⚠️ **À changer** : Chemins actuels vs spécifiés (`/api/integrations/spotify/...`)

2. **Base de Données**
   - ✅ `MusicServiceConnection` existe avec :
     - `userId`, `service`, `accessToken`, `refreshToken`, `expiresAt`, `externalUserId`, `lastSyncAt`
   - ⚠️ **Manque** : Chiffrement des tokens, champ `scopes`

3. **Token Refresh**
   - ✅ Fonction `refreshSpotifyToken()` existe dans `src/lib/music-services/spotify.ts`
   - ⚠️ **À améliorer** : Refresh automatique lors des appels API

4. **Taste Inference**
   - ✅ `POST /api/user/music-taste/sync` existe
   - ✅ Récupère top artists et dérive genres
   - ✅ Stocke dans `UserInterestTag` avec `source='spotify'`
   - ✅ Mapping vers taxonomie Pulse existe

5. **Recommandations**
   - ✅ `/api/recommendations` existe
   - ✅ Page "Pour toi" (`/pour-toi`) existe
   - ✅ Matching genres utilisateur → EventTag music tags

6. **UI**
   - ✅ Page profil (`/profil`) avec connexion Spotify
   - ✅ Bouton "Synchroniser mes goûts"
   - ⚠️ **Manque** : Bouton "Disconnect" complet, explications privacy

### ❌ À Implémenter / Améliorer

1. **Routes OAuth** : Aligner avec spécifications (`/api/integrations/spotify/...`)
2. **Chiffrement tokens** : Ajouter chiffrement pour `accessToken` et `refreshToken`
3. **Scopes** : Réduire à `user-top-read` uniquement (retirer `user-read-email`, `user-read-private`)
4. **Disconnect flow** : Endpoint DELETE + suppression données Spotify
5. **Privacy UX** : Explications, toggle enable/disable
6. **Admin logs** : Tracking sync success/failure
7. **Production readiness** : Pages légales, screenshots, review package

---

## 🚀 SPRINT 1 : OAuth + Token Storage + Basic Taste Inference

### Objectif
Mettre en place l'infrastructure OAuth complète avec stockage sécurisé des tokens et inférence de base des goûts musicaux.

### Tâches Détaillées

#### 1. Documentation Setup Spotify App

**Fichier** : `docs/SPOTIFY_SETUP.md` (créer)

**Contenu** :
```markdown
# Configuration Application Spotify pour Pulse

## 1. Créer l'application dans Spotify Dashboard

1. Aller sur https://developer.spotify.com/dashboard
2. Cliquer sur "Create App"
3. Remplir :
   - **App name** : Pulse
   - **App description** : Plateforme de découverte d'événements à Montréal avec recommandations personnalisées basées sur les goûts musicaux
   - **Website** : https://pulse-event.ca
   - **Redirect URIs** :
     - `https://pulse-event.ca/api/integrations/spotify/callback`
     - `http://localhost:3000/api/integrations/spotify/callback`
   - **Privacy Policy URL** : https://pulse-event.ca/politique-confidentialite
   - **Terms of Service URL** : https://pulse-event.ca/cgu
4. Cliquer sur "Save"

## 2. Variables d'environnement

Dans Vercel → Settings → Environment Variables, ajouter :

```bash
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=https://pulse-event.ca/api/integrations/spotify/callback
```

**Important** :
- `SPOTIFY_REDIRECT_URI` doit correspondre exactement au Redirect URI dans Spotify Dashboard
- Variables configurées pour **Production**, **Preview**, et **Development**
```

#### 2. Aligner Routes OAuth avec Spécifications

**Changements** :

1. **Créer nouvelles routes** :
   - `src/app/api/integrations/spotify/auth/route.ts` (GET)
   - `src/app/api/integrations/spotify/callback/route.ts` (GET)

2. **Garder anciennes routes** (pour compatibilité) ou **rediriger** vers nouvelles

3. **Mettre à jour** `src/lib/music-services/spotify.ts` :
   - Fonction `buildSpotifyRedirectUri()` pour utiliser `SPOTIFY_REDIRECT_URI` ou `NEXTAUTH_URL`
   - Fonction `buildSpotifyAuthorizeUrl()` pour utiliser le bon redirect URI

**Fichier** : `src/app/api/integrations/spotify/auth/route.ts`
```typescript
/**
 * GET /api/integrations/spotify/auth
 * Redirige vers Spotify authorize URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSpotifyAuthorizeUrl, generateOAuthState } from '@/lib/music-services/spotify';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/profil', request.url));
  }

  const state = generateOAuthState();

  // Stocker state temporaire (10 min)
  await prisma.verificationToken.create({
    data: {
      identifier: `spotify_oauth:${session.user.id}`,
      token: state,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const authUrl = buildSpotifyAuthorizeUrl(state);
  return NextResponse.redirect(authUrl);
}
```

**Fichier** : `src/app/api/integrations/spotify/callback/route.ts`
```typescript
/**
 * GET /api/integrations/spotify/callback?code=...&state=...
 * Échange le code OAuth contre tokens et sauvegarde la connexion
 */
// (Utiliser le code existant de /api/user/music-services/spotify/callback/route.ts)
```

#### 3. Réduire Scopes à Minimal

**Fichier** : `src/lib/music-services/spotify.ts`

**Changement** :
```typescript
// AVANT
const scopes = [
  'user-top-read',
  'user-read-email',
  'user-read-private',
].join(' ');

// APRÈS
const scopes = [
  'user-top-read', // Seul scope nécessaire pour top artists
].join(' ');
```

**Note** : `user-read-email` et `user-read-private` ne sont pas nécessaires. On peut identifier l'utilisateur via `spotifyGetMe()` qui retourne `id` avec juste `user-top-read`.

#### 4. Ajouter Chiffrement des Tokens

**Option 1 : Utiliser une librairie de chiffrement**
```bash
npm install crypto-js
```

**Fichier** : `src/lib/encryption.ts` (créer)
```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SPOTIFY_CLIENT_SECRET;

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not configured');
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not configured');
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Option 2 : Utiliser Vercel Edge Config ou Vault** (plus sécurisé mais plus complexe)

**Mise à jour** : `src/app/api/integrations/spotify/callback/route.ts`
- Chiffrer `accessToken` et `refreshToken` avant sauvegarde
- Déchiffrer lors de l'utilisation

**Mise à jour** : `src/lib/music-services/spotify.ts`
- Fonction helper pour récupérer et déchiffrer tokens

#### 5. Ajouter Champ `scopes` au Modèle

**Fichier** : `prisma/schema.prisma`

**Changement** :
```prisma
model MusicServiceConnection {
  // ... champs existants
  scopes       String?  // Scopes accordés lors de l'OAuth
  // ...
}
```

**Migration** :
```bash
npx prisma migrate dev --name add_scopes_to_music_service_connection
```

**Mise à jour** : Sauvegarder `scopes` lors du callback OAuth

#### 6. Améliorer Token Refresh Automatique

**Fichier** : `src/lib/music-services/spotify.ts`

**Ajouter fonction** :
```typescript
export async function getValidAccessToken(userId: string): Promise<string> {
  const conn = await prisma.musicServiceConnection.findUnique({
    where: { unique_user_music_service: { userId, service: 'spotify' } },
  });
  
  if (!conn) throw new Error('Spotify not connected');
  
  // Déchiffrer token
  const accessToken = decrypt(conn.accessToken);
  
  // Vérifier expiration (refresh si < 5 min restantes)
  if (conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    if (!conn.refreshToken) throw new Error('Refresh token missing');
    
    const refreshed = await refreshSpotifyToken(decrypt(conn.refreshToken));
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    
    // Chiffrer et sauvegarder
    await prisma.musicServiceConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encrypt(refreshed.access_token),
        refreshToken: refreshed.refresh_token ? encrypt(refreshed.refresh_token) : undefined,
        expiresAt: newExpiresAt,
      },
    });
    
    return refreshed.access_token;
  }
  
  return accessToken;
}
```

#### 7. Taste Inference v1 (Améliorer Existant)

**Fichier** : `src/app/api/user/music-taste/sync/route.ts`

**Améliorations** :
- Utiliser `getValidAccessToken()` pour refresh automatique
- Améliorer mapping genres → taxonomie Pulse
- Stocker dans `UserInterestTag` avec `source='spotify'` (déjà fait)
- Optionnel : Créer/updater `UserTasteProfile` avec `topGenres`

#### 8. UI Settings Page (Améliorer Existant)

**Fichier** : `src/app/profil/profil-client.tsx`

**Améliorations** :
- Afficher genres détectés après sync
- Afficher preview "Pour toi" (lien vers `/pour-toi`)
- Améliorer messages d'erreur
- Ajouter explications sur ce qui est lu et pourquoi

### Definition of Done (DoD)

- [ ] Documentation setup Spotify app créée
- [ ] Routes OAuth alignées (`/api/integrations/spotify/...`)
- [ ] Scopes réduits à `user-top-read` uniquement
- [ ] Tokens chiffrés en base de données
- [ ] Refresh automatique des tokens fonctionne
- [ ] Taste inference fonctionne et sauvegarde genres
- [ ] UI profil améliorée avec explications
- [ ] Tests : Utilisateur peut connecter Spotify (en dev mode, limité aux test users)

---

## 🎯 SPRINT 2 : Recommendations + Safeguards

### Objectif
Améliorer les recommandations basées sur le profil de goûts et ajouter les contrôles de confidentialité.

### Tâches Détaillées

#### 1. Améliorer Endpoint Recommendations

**Fichier** : `src/app/api/recommendations/route.ts` (existe déjà)

**Améliorations** :
- Utiliser `UserInterestTag` avec `source='spotify'` pour matching
- Matching précis : genres utilisateur → EventTag music tags
- Scoring amélioré : poids selon `score` dans `UserInterestTag`
- Support `scope=today|weekend` (vérifier si déjà implémenté)

#### 2. Event Matching Amélioré

**Fichier** : `src/lib/recommendations/recommendationEngine.ts` (existe déjà)

**Améliorations** :
- Matching genres/subgenres utilisateur → EventTag music tags
- Utiliser taxonomie Pulse existante
- Poids selon fréquence d'écoute (score dans UserInterestTag)

#### 3. Privacy + Compliance UX

**Fichier** : `src/app/profil/profil-client.tsx`

**Ajouter** :

1. **Section "Données Spotify"** :
   - Explication : "Pulse lit vos top artists pour détecter vos genres musicaux préférés et vous recommander des événements pertinents."
   - Liste des données lues : "Top artists, genres musicaux"
   - But : "Recommandations personnalisées d'événements"

2. **Toggle "Activer les recommandations personnalisées"** :
   - Si désactivé : Ne pas utiliser les données Spotify pour recommandations
   - Stocker préférence dans `UserPreferences` ou nouveau champ

3. **Bouton "Disconnect" amélioré** :
   - Modal de confirmation
   - Options :
     - "Déconnecter uniquement" (garde les genres détectés)
     - "Déconnecter et supprimer les données" (supprime tout)

#### 4. Disconnect Flow Complet

**Fichier** : `src/app/api/integrations/spotify/disconnect/route.ts` (créer)

```typescript
/**
 * DELETE /api/integrations/spotify/disconnect
 * Body: { deleteData?: boolean }
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const deleteData = body.deleteData === true;

  // Supprimer connexion
  await prisma.musicServiceConnection.deleteMany({
    where: { userId: session.user.id, service: 'spotify' },
  });

  // Si deleteData, supprimer aussi les tags Spotify
  if (deleteData) {
    await prisma.userInterestTag.deleteMany({
      where: { userId: session.user.id, source: 'spotify' },
    });
    
    // Optionnel : Supprimer UserTasteProfile si uniquement basé sur Spotify
  }

  return NextResponse.json({ success: true });
}
```

**Mise à jour** : `src/app/profil/profil-client.tsx`
- Appeler `/api/integrations/spotify/disconnect` avec option `deleteData`

#### 5. Admin Logs

**Fichier** : `prisma/schema.prisma`

**Ajouter modèle** (optionnel, ou utiliser table existante) :
```prisma
model SpotifySyncLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  status    String   // 'success' | 'failure'
  error     String?  @db.Text
  genresCount Int?   @map("genres_count")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("spotify_sync_logs")
}
```

**Mise à jour** : `src/app/api/user/music-taste/sync/route.ts`
- Logger succès/échec avec diagnostics minimaux

### Definition of Done (DoD)

- [ ] Recommandations utilisent profil de goûts Spotify
- [ ] Matching genres → EventTag fonctionne précisément
- [ ] Toggle enable/disable personnalisation fonctionne
- [ ] Bouton Disconnect avec options (disconnect only / delete data)
- [ ] Admin logs trackent sync success/failure
- [ ] Tests : Recommandations améliorées, contrôles privacy fonctionnent

---

## 📋 SPRINT 3 : Production Readiness + Spotify Review Package

### Objectif
Préparer l'application pour la production et soumettre la demande de review Spotify.

### Tâches Détaillées

#### 1. Pages Légales Complètes

**Fichier** : `src/app/politique-confidentialite/page.tsx` (existe déjà)

**Ajouter section Spotify** :
```markdown
## Intégration Spotify

### Données collectées
Lorsque vous connectez votre compte Spotify, Pulse collecte :
- Vos top artists (via API Spotify)
- Les genres musicaux dérivés de vos top artists

### Utilisation des données
Ces données sont utilisées exclusivement pour :
- Détecter vos genres musicaux préférés
- Générer des recommandations personnalisées d'événements
- Améliorer votre expérience de découverte

### Conservation
- Les données Spotify sont conservées tant que votre compte Spotify est connecté
- Vous pouvez supprimer ces données à tout moment en vous déconnectant et en choisissant "Supprimer les données"

### Partage
- Les données Spotify ne sont **jamais** partagées avec des tiers
- Elles sont utilisées uniquement dans le cadre de Pulse Montréal

### Vos droits
- Vous pouvez vous déconnecter de Spotify à tout moment
- Vous pouvez supprimer toutes les données Spotify dérivées
- Vous pouvez désactiver les recommandations personnalisées
```

**Fichier** : `src/app/cgu/page.tsx` (existe déjà)

**Ajouter section** (si nécessaire) sur l'utilisation de Spotify.

#### 2. Screenshots pour Review

**Créer dossier** : `docs/spotify-review/`

**Screenshots à prendre** :

1. **Spotify Connect Screen** :
   - Page `/profil` avec bouton "Connecter Spotify"
   - Modal OAuth Spotify avec scopes demandés

2. **Detected Genres** :
   - Page `/profil` après connexion
   - Section "Détecté depuis Spotify" avec genres affichés

3. **"For you" Recommendations** :
   - Page `/pour-toi` avec événements recommandés
   - Badge "Basé sur Spotify" visible

**Instructions** :
- Prendre screenshots en haute résolution
- Annoter si nécessaire (flèches, encadrés)
- Sauvegarder dans `docs/spotify-review/screenshots/`

#### 3. Préparer Review Package

**Fichier** : `docs/spotify-review/REVIEW_PACKAGE.md` (créer)

**Contenu** :
```markdown
# Spotify App Review Package - Pulse

## App Information
- **App Name** : Pulse
- **Website** : https://pulse-event.ca
- **Privacy Policy** : https://pulse-event.ca/politique-confidentialite
- **Terms of Service** : https://pulse-event.ca/cgu

## Scopes Requested
- `user-top-read` : Pour analyser les top artists de l'utilisateur et détecter ses genres musicaux préférés, utilisés pour générer des recommandations personnalisées d'événements.

## Use Case
Pulse Montréal est une plateforme de découverte d'événements culturels, musicaux et festifs à Montréal. En connectant leur compte Spotify, les utilisateurs obtiennent des recommandations personnalisées d'événements basées sur l'analyse de leurs top artists et genres musicaux préférés.

## Data Usage
- **Collected** : Top artists (via `user-top-read`)
- **Derived** : Genres musicaux préférés
- **Used for** : Recommandations personnalisées d'événements
- **Retention** : Tant que le compte Spotify est connecté
- **Sharing** : Aucun partage avec des tiers

## Screenshots
[Inclure les 3 screenshots préparés]
```

#### 4. Vérifier Conformité

**Checklist** :
- [ ] Scopes minimaux (uniquement `user-top-read`)
- [ ] Privacy Policy complète avec section Spotify
- [ ] Terms of Service à jour
- [ ] Redirect URIs corrects dans Spotify Dashboard
- [ ] Variables d'environnement configurées
- [ ] Tokens chiffrés
- [ ] Disconnect flow fonctionne
- [ ] Delete data flow fonctionne
- [ ] Explications claires pour utilisateurs

#### 5. Soumettre Review

**Étapes** :
1. Aller sur https://developer.spotify.com/dashboard
2. Sélectionner l'app "Pulse"
3. Aller dans "App Review" ou "Request Extension"
4. Remplir le formulaire avec :
   - Description de l'utilisation
   - Justification des scopes
   - Screenshots
   - Privacy Policy URL
   - Terms of Service URL
5. Soumettre

### Definition of Done (DoD)

- [ ] Pages légales complètes avec section Spotify
- [ ] Screenshots préparés (3 minimum)
- [ ] Review package documenté
- [ ] Checklist conformité complétée
- [ ] Demande de review soumise à Spotify
- [ ] Application prête pour mode Production

---

## 📝 Notes Importantes

### Utilisateurs et Developer Accounts
- **Les utilisateurs n'ont PAS besoin de comptes Spotify Developer**
- Seul le développeur (toi) a besoin d'un compte Spotify Developer
- En mode Development : Limité aux utilisateurs de test (25 max)
- En mode Production : Tous les utilisateurs peuvent utiliser l'app

### Passage en Production
- Nécessite une review Spotify (2-4 semaines généralement)
- Une fois approuvé, passer l'app en mode Production dans le dashboard
- Tous les utilisateurs pourront alors se connecter sans limite

### Sécurité
- Tokens doivent être chiffrés en base de données
- Utiliser `ENCRYPTION_KEY` dans variables d'environnement
- Ne jamais exposer tokens dans les réponses API
- Refresh automatique des tokens expirés

### Conformité
- Scopes minimaux pour faciliter l'approbation
- Privacy Policy claire et accessible
- Explications claires pour utilisateurs
- Contrôles utilisateur (disconnect, delete data)

---

## 🗂️ Structure des Fichiers

### Nouveaux Fichiers à Créer
```
docs/
  SPOTIFY_SETUP.md
  spotify-review/
    REVIEW_PACKAGE.md
    screenshots/
      connect-screen.png
      detected-genres.png
      for-you-recommendations.png

src/
  app/api/integrations/spotify/
    auth/route.ts
    callback/route.ts
    disconnect/route.ts
  lib/
    encryption.ts
```

### Fichiers à Modifier
```
src/lib/music-services/spotify.ts
src/app/api/user/music-taste/sync/route.ts
src/app/profil/profil-client.tsx
src/app/api/recommendations/route.ts
src/lib/recommendations/recommendationEngine.ts
src/app/politique-confidentialite/page.tsx
src/app/cgu/page.tsx
prisma/schema.prisma
```

---

## ✅ Checklist Globale

### Sprint 1
- [ ] Documentation setup
- [ ] Routes OAuth alignées
- [ ] Scopes réduits
- [ ] Chiffrement tokens
- [ ] Refresh automatique
- [ ] Taste inference
- [ ] UI améliorée

### Sprint 2
- [ ] Recommendations améliorées
- [ ] Event matching précis
- [ ] Privacy UX
- [ ] Disconnect flow
- [ ] Admin logs

### Sprint 3
- [ ] Pages légales
- [ ] Screenshots
- [ ] Review package
- [ ] Conformité vérifiée
- [ ] Review soumise

---

**Dernière mise à jour** : Janvier 2025

