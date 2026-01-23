# 🔧 Correction Google OAuth en local - redirect_uri_mismatch

## Problème
Erreur `redirect_uri_mismatch` lors de la connexion Google en local. Cela signifie que l'URI de redirection `http://localhost:3000/api/auth/callback/google` n'est pas configurée dans Google Cloud Console.

## Solution rapide

### 1. Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (celui qui contient vos credentials OAuth)
3. Allez dans **APIs & Services** > **Credentials**

### 2. Modifier votre OAuth 2.0 Client ID

1. Cliquez sur votre **OAuth 2.0 Client ID** (celui que vous utilisez pour Pulse)
2. Dans la section **"Authorized redirect URIs"**, vérifiez que vous avez :
   - ✅ `http://localhost:3000/api/auth/callback/google`
   
   Si cette ligne n'existe pas, **ajoutez-la** :
   - Cliquez sur **"+ ADD URI"**
   - Entrez exactement : `http://localhost:3000/api/auth/callback/google`
   - ⚠️ **Important** : 
     - Pas de trailing slash (`/` à la fin)
     - Pas de majuscules
     - Utilisez `http://` (pas `https://`) pour localhost

3. Dans la section **"Authorized JavaScript origins"**, vérifiez que vous avez :
   - ✅ `http://localhost:3000`
   
   Si cette ligne n'existe pas, **ajoutez-la** :
   - Cliquez sur **"+ ADD URI"**
   - Entrez exactement : `http://localhost:3000`
   - ⚠️ **Important** : Pas de trailing slash

4. Cliquez sur **"SAVE"** en bas de la page

### 3. Vérifier vos variables d'environnement locales

Dans votre fichier `.env.local`, vous devez avoir :

```bash
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_ici
```

⚠️ **Important** : `NEXTAUTH_URL` doit être `http://localhost:3000` (pas `https://`) pour le développement local.

### 4. Redémarrer le serveur de développement

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm run dev
```

### 5. Tester la connexion

1. Allez sur `http://localhost:3000/auth/signin`
2. Cliquez sur "Se connecter avec Google"
3. La connexion devrait maintenant fonctionner

## Vérification complète

### Dans Google Cloud Console, vous devriez avoir :

**Authorized JavaScript origins:**
- `http://localhost:3000`
- `https://pulse-event.ca` (ou votre domaine de production)

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback/google`
- `https://pulse-event.ca/api/auth/callback/google` (ou votre domaine de production)

### Dans votre `.env.local`, vous devriez avoir :

```bash
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_généré
```

## Si ça ne fonctionne toujours pas

1. **Vérifiez que vous utilisez le bon Client ID** :
   - Le Client ID dans `.env.local` doit correspondre à celui dans Google Cloud Console
   - Vérifiez qu'il n'y a pas d'espaces ou de caractères invisibles

2. **Vérifiez les URLs exactement** :
   - Pas de trailing slash
   - Pas de majuscules
   - `http://` pour localhost (pas `https://`)

3. **Videz le cache du navigateur** :
   - Essayez en navigation privée
   - Ou videz les cookies pour `localhost:3000`

4. **Vérifiez les logs du serveur** :
   - Regardez la console du serveur Next.js pour voir les erreurs
   - Regardez la console du navigateur (F12) pour voir les erreurs

## Note importante

Si vous avez plusieurs projets Google Cloud ou plusieurs OAuth Client IDs, assurez-vous d'utiliser celui qui a les bonnes URLs configurées. Vous pouvez créer un Client ID séparé pour le développement local si nécessaire.
