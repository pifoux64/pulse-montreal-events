# 🔧 Correction : Erreur Spotify Callback (ERR_INVALID_RESPONSE)

## Problème

Lors de la connexion Spotify, l'erreur `ERR_INVALID_RESPONSE` apparaît sur l'URL :
```
https://pulse-event.ca/api/user/music-services/spotify/callback?code=...&state=...
```

## Causes possibles

1. **Variables d'environnement manquantes ou incorrectes**
2. **Redirect URI non configuré dans Spotify**
3. **Erreur non gérée dans le code** (maintenant corrigée)

## Solutions

### ✅ Solution 1 : Vérifier les variables d'environnement

Dans Vercel → **Settings** → **Environment Variables**, vérifie que ces variables sont présentes :

```bash
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
NEXTAUTH_URL=https://pulse-event.ca
```

**Important** :
- `NEXTAUTH_URL` doit être `https://pulse-event.ca` (pas `http://127.0.0.1:3000`)
- Les variables doivent être configurées pour **Production**, **Preview**, et **Development**

### ✅ Solution 2 : Vérifier le Redirect URI dans Spotify

Le Redirect URI dans Spotify doit correspondre exactement à :
```
https://pulse-event.ca/api/user/music-services/spotify/callback
```

**Étapes pour vérifier/corriger** :

1. **Va sur Spotify Developer Dashboard** : https://developer.spotify.com/dashboard
2. **Sélectionne ton app**
3. **Clique sur "Edit Settings"**
4. **Dans "Redirect URIs"**, vérifie que tu as :
   - `https://pulse-event.ca/api/user/music-services/spotify/callback` (production)
   - `http://localhost:3000/api/user/music-services/spotify/callback` (développement local, optionnel)
5. **Clique sur "Add"** puis **"Save"**

⚠️ **Important** : Le Redirect URI doit correspondre **exactement** (pas de trailing slash, pas d'erreur de typo)

### ✅ Solution 3 : Redéployer après correction

Après avoir corrigé les variables ou le Redirect URI :

1. **Dans Vercel** → **Deployments**
2. **Clique sur les trois points (⋯)** du dernier déploiement
3. **Sélectionne "Redeploy"**

## Vérification

### Test de la connexion

1. **Va sur** https://pulse-event.ca/profil
2. **Clique sur "Connecter Spotify"**
3. **Autorise l'application** dans Spotify
4. **Tu devrais être redirigé vers** `/profil?success=spotify_connected`

### Diagnostic avec les logs

J'ai ajouté du logging détaillé dans le code. Pour diagnostiquer :

1. **Va dans Vercel** → **Deployments** → Clique sur le dernier déploiement
2. **Va dans l'onglet "Functions"** ou **"Logs"**
3. **Filtre par** `/api/user/music-services/spotify/callback`
4. **Relance la connexion Spotify** et regarde les logs en temps réel

Tu devrais voir des logs comme :
```
[Spotify Callback] Début du callback
[Spotify Callback] Session trouvée pour user: ...
[Spotify Callback] Vérification du state...
[Spotify Callback] State valide, suppression...
[Spotify Callback] Échange du code contre tokens...
```

**Si les logs s'arrêtent à un endroit précis**, c'est là que le problème se situe.

### Causes possibles selon les logs

#### Si les logs s'arrêtent à "Vérification du state..."
- **Problème** : La base de données ne répond pas ou le state a expiré
- **Solution** : Vérifie la connexion à la base de données (DATABASE_URL)

#### Si les logs s'arrêtent à "Échange du code contre tokens..."
- **Problème** : L'API Spotify ne répond pas ou les credentials sont incorrects
- **Solution** : Vérifie SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET

#### Si les logs s'arrêtent à "Récupération des infos utilisateur Spotify..."
- **Problème** : L'API Spotify /me ne répond pas
- **Solution** : Vérifie les scopes demandés dans Spotify Dashboard

#### Si tu vois "ERR_INVALID_RESPONSE" sans logs
- **Problème** : La fonction timeout ou crash avant de logger
- **Solution** : Vérifie les limites de timeout Vercel (10s par défaut)

### Si l'erreur persiste

1. **Vérifie les logs Vercel** (voir ci-dessus)
2. **Vérifie la console du navigateur** :
   - Ouvre les DevTools (F12)
   - Regarde l'onglet **Console** et **Network**
   - Note les erreurs affichées

3. **Vérifie que le Redirect URI est correct** :
   - Dans Spotify Dashboard, le Redirect URI doit être **exactement** :
     ```
     https://pulse-event.ca/api/user/music-services/spotify/callback
     ```
   - Pas de trailing slash, pas d'erreur de typo

4. **Vérifie les timeouts Vercel** :
   - Les fonctions serverless ont un timeout de 10s par défaut
   - Si la connexion à la DB ou à Spotify prend trop de temps, ça peut timeout

## Corrections apportées au code

✅ **Gestion d'erreur ajoutée** : Le callback gère maintenant les erreurs et redirige vers une page d'erreur au lieu de causer `ERR_INVALID_RESPONSE`

✅ **Messages d'erreur plus clairs** : Les erreurs sont maintenant loggées et redirigées avec des messages explicites

## Checklist de vérification

- [ ] `SPOTIFY_CLIENT_ID` présent dans Vercel
- [ ] `SPOTIFY_CLIENT_SECRET` présent dans Vercel
- [ ] `NEXTAUTH_URL` = `https://pulse-event.ca` (pas `http://127.0.0.1:3000`)
- [ ] Redirect URI dans Spotify = `https://pulse-event.ca/api/user/music-services/spotify/callback`
- [ ] Variables configurées pour **Production**, **Preview**, et **Development**
- [ ] Redéploiement effectué après modifications
- [ ] Test de connexion effectué

## Résultat attendu

Après correction :
- ✅ La connexion Spotify fonctionne
- ✅ Redirection vers `/profil?success=spotify_connected`
- ✅ Plus d'erreur `ERR_INVALID_RESPONSE`

## Support

Si le problème persiste après avoir vérifié tout ce qui précède :
1. Vérifie les logs Vercel pour voir l'erreur exacte
2. Vérifie que le Redirect URI dans Spotify correspond exactement
3. Vérifie que `NEXTAUTH_URL` est bien `https://pulse-event.ca` (pas localhost)

