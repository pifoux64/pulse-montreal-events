# 🎵 Configuration Application Spotify pour Pulse

Ce guide explique comment configurer l'application Spotify pour l'intégration avec Pulse Montréal.

---

## 1. Créer l'application dans Spotify Dashboard

### Étapes

1. **Aller sur Spotify Developer Dashboard**
   - URL : https://developer.spotify.com/dashboard
   - Se connecter avec ton compte Spotify (ou créer un compte si nécessaire)

2. **Créer une nouvelle application**
   - Cliquer sur **"Create App"** ou **"Create an App"**
   - Remplir le formulaire :
     - **App name** : `Pulse`
     - **App description** :
       ```
       Plateforme de découverte d'événements à Montréal avec recommandations 
       personnalisées basées sur les goûts musicaux Spotify.
       ```
     - **Website** : `https://pulse-event.ca`
     - **Redirect URIs** : Ajouter les deux URIs suivants :
       - `https://pulse-event.ca/api/integrations/spotify/callback` (production)
       - `http://localhost:3000/api/integrations/spotify/callback` (développement local)
     - **Privacy Policy URL** : `https://pulse-event.ca/politique-confidentialite`
     - **Terms of Service URL** : `https://pulse-event.ca/cgu`
   - Cliquer sur **"Save"**

3. **Récupérer les credentials**
   - Une fois l'app créée, tu verras :
     - **Client ID** : Copier cette valeur
     - **Client Secret** : Cliquer sur **"View client secret"** et copier

⚠️ **Important** : 
- Le **Client Secret** ne doit jamais être exposé publiquement
- Ne pas commiter le Client Secret dans le code source
- Utiliser des variables d'environnement

---

## 2. Configurer les Variables d'Environnement

### Dans Vercel

1. **Aller dans Vercel Dashboard**
   - URL : https://vercel.com/dashboard
   - Sélectionner le projet Pulse Montréal

2. **Aller dans Settings → Environment Variables**

3. **Ajouter les variables suivantes** :

```bash
SPOTIFY_CLIENT_ID=ton_client_id_ici
SPOTIFY_CLIENT_SECRET=ton_client_secret_ici
SPOTIFY_REDIRECT_URI=https://pulse-event.ca/api/integrations/spotify/callback
ENCRYPTION_KEY=une_clé_secrète_aléatoire_pour_chiffrer_les_tokens
```

**Important** :
- `SPOTIFY_REDIRECT_URI` doit correspondre **exactement** au Redirect URI dans Spotify Dashboard
- `ENCRYPTION_KEY` : Générer une clé aléatoire sécurisée (ex: `openssl rand -base64 32`)
- Configurer les variables pour **Production**, **Preview**, et **Development**

### En Local (Développement)

Créer ou mettre à jour `.env.local` :

```bash
SPOTIFY_CLIENT_ID=ton_client_id_ici
SPOTIFY_CLIENT_SECRET=ton_client_secret_ici
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/integrations/spotify/callback
ENCRYPTION_KEY=une_clé_secrète_aléatoire_pour_chiffrer_les_tokens
NEXTAUTH_URL=http://localhost:3000
```

---

## 3. Vérifier la Configuration

### Checklist

- [ ] Application "Pulse" créée dans Spotify Dashboard
- [ ] Redirect URIs configurés (production + localhost)
- [ ] Privacy Policy URL configurée
- [ ] Terms of Service URL configurée
- [ ] Client ID récupéré
- [ ] Client Secret récupéré
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Variables d'environnement configurées en local (`.env.local`)
- [ ] `ENCRYPTION_KEY` générée et configurée

### Test de la Configuration

1. **Lancer l'application en local** :
   ```bash
   npm run dev
   ```

2. **Aller sur** http://localhost:3000/profil

3. **Cliquer sur "Connecter Spotify"**

4. **Vérifier** :
   - Redirection vers Spotify OAuth
   - Scopes demandés : `user-top-read` uniquement
   - Après autorisation, redirection vers `/profil?success=spotify_connected`

---

## 4. Mode Development vs Production

### Mode Development (Actuel)

- ⚠️ **Limitation** : Seuls les utilisateurs ajoutés manuellement peuvent utiliser l'app
- **Limite** : 25 utilisateurs de test maximum
- **Pour ajouter un utilisateur** :
  1. Aller dans Spotify Dashboard → Ton app → "Edit Settings"
  2. Scroller jusqu'à "User Management" ou "Users"
  3. Cliquer sur "Add User" ou "Add Test User"
  4. Ajouter l'email Spotify de l'utilisateur
  5. Sauvegarder

### Mode Production (Recommandé)

- ✅ **Avantage** : Tous les utilisateurs peuvent utiliser l'app sans limite
- **Pour passer en Production** :
  1. Suivre le guide `SPOTIFY_PASSER_EN_PRODUCTION.md`
  2. Soumettre une demande de review Spotify
  3. Attendre l'approbation (2-4 semaines généralement)
  4. Une fois approuvé, changer le mode dans le dashboard

---

## 5. Scopes Utilisés

### Scope Actuel

- **`user-top-read`** : Permet de lire les top artists de l'utilisateur
  - **Utilisation** : Analyser les genres musicaux préférés
  - **Justification** : Nécessaire pour générer des recommandations personnalisées

### Scopes Non Utilisés (Retirés)

- ~~`user-read-email`~~ : Non nécessaire (on utilise `spotifyGetMe()` qui retourne `id` avec juste `user-top-read`)
- ~~`user-read-private`~~ : Non nécessaire pour notre use case

**Pourquoi scopes minimaux ?**
- Facilite l'approbation Spotify
- Respecte le principe de moindre privilège
- Améliore la confiance des utilisateurs

---

## 6. Sécurité

### Chiffrement des Tokens

Les tokens Spotify (`accessToken` et `refreshToken`) sont chiffrés avant stockage en base de données.

**Clé de chiffrement** :
- Stockée dans `ENCRYPTION_KEY` (variable d'environnement)
- Générer une clé sécurisée : `openssl rand -base64 32`
- Ne jamais commiter cette clé dans le code source

### Refresh Automatique

Les tokens sont automatiquement rafraîchis lorsqu'ils sont proches de l'expiration (< 5 minutes restantes).

---

## 7. Dépannage

### Erreur : "Invalid redirect URI"

**Cause** : Le Redirect URI dans le code ne correspond pas à celui dans Spotify Dashboard.

**Solution** :
1. Vérifier que `SPOTIFY_REDIRECT_URI` correspond exactement au Redirect URI dans Spotify Dashboard
2. Pas de trailing slash
3. Pas d'erreur de typo

### Erreur : "User not registered" (403)

**Cause** : L'utilisateur n'est pas ajouté dans les utilisateurs de test (mode Development).

**Solution** :
1. Ajouter l'utilisateur dans Spotify Dashboard → Users
2. Ou passer en mode Production (nécessite review)

### Erreur : "Configuration Spotify manquante"

**Cause** : Variables d'environnement non configurées.

**Solution** :
1. Vérifier que toutes les variables sont configurées dans Vercel
2. Redéployer après ajout des variables
3. Vérifier `.env.local` en local

---

## 8. Support

### Documentation Spotify

- **API Reference** : https://developer.spotify.com/documentation/web-api
- **Authorization Guide** : https://developer.spotify.com/documentation/web-api/concepts/authorization
- **Dashboard** : https://developer.spotify.com/dashboard

### Guides Pulse

- **Plan d'intégration** : `SPOTIFY_INTEGRATION_PLAN.md`
- **Passer en Production** : `SPOTIFY_PASSER_EN_PRODUCTION.md`
- **Correction erreurs** : `CORRECTION_SPOTIFY_403.md`, `CORRECTION_SPOTIFY_CALLBACK.md`

---

**Dernière mise à jour** : Janvier 2025

