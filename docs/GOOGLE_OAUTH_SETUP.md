# 🔐 Configuration Google OAuth pour NextAuth

Ce guide vous explique comment configurer Google OAuth pour permettre aux utilisateurs de se connecter avec leur compte Google.

## 📋 Prérequis

- Un compte Google (Gmail)
- Accès à [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Étapes de configuration

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur le sélecteur de projet en haut
3. Cliquez sur **"Nouveau projet"**
4. Donnez un nom à votre projet (ex: "Pulse Montreal Events")
5. Cliquez sur **"Créer"**

### 2. Activer les APIs Google nécessaires

**⚠️ Note importante**: Pour Google OAuth avec NextAuth, vous n'avez **pas besoin** d'activer une API spécifique dans la bibliothèque. Vous pouvez passer directement à l'étape 3 (Configuration de l'écran de consentement OAuth).

Si vous souhaitez quand même activer une API (optionnel):
1. Dans le menu latéral, allez dans **"APIs & Services"** > **"Library"**
2. Recherchez **"Google+ API"** (ancienne API, mais toujours fonctionnelle pour OAuth)
3. Cliquez sur **"Enable"** si vous la trouvez
4. **Note**: Cette étape n'est pas obligatoire - vous pouvez créer les credentials OAuth directement sans activer d'API

### 3. Configurer l'écran de consentement OAuth

**⚠️ Important**: L'écran de consentement OAuth n'est **pas** dans la bibliothèque d'API. C'est une section de configuration dans le menu latéral.

1. Dans le menu latéral gauche de Google Cloud Console, cliquez sur **"APIs & Services"** (ou **"APIs et services"** en français)
2. Dans le sous-menu qui apparaît, cliquez sur **"OAuth consent screen"** (ou **"Écran de consentement OAuth"**)
   - Si vous ne voyez pas ce menu, cliquez sur le menu hamburger (☰) en haut à gauche pour ouvrir le menu latéral
3. Choisissez **"External"** (pour le développement/public) ou **"Internal"** (si vous avez un compte Google Workspace)
4. Remplissez les informations:
   - **App name**: Pulse Montreal Events
   - **User support email**: Votre email
   - **Developer contact information**: Votre email
5. Cliquez sur **"Save and Continue"** (Enregistrer et continuer)
6. Sur la page **"Scopes"**, cliquez sur **"Save and Continue"** (les scopes par défaut suffisent)
7. Sur la page **"Test users"** (si External), vous pouvez ajouter des emails de test, puis **"Save and Continue"**
8. Sur la page **"Summary"**, cliquez sur **"Back to Dashboard"** (Retour au tableau de bord)

### 4. Créer les credentials OAuth

1. Allez dans **"APIs & Services"** > **"Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Si c'est la première fois, configurez l'écran de consentement (voir étape 3)
4. Choisissez **"Web application"** comme type d'application
5. Donnez un nom (ex: "Pulse Web Client")
6. Dans **"Authorized JavaScript origins"**, ajoutez:
   - `http://localhost:3000` (pour le développement local)
   - `https://votre-domaine.com` (pour la production)
7. Dans **"Authorized redirect URIs"**, ajoutez:
   - `http://localhost:3000/api/auth/callback/google` (pour le développement)
   - `https://votre-domaine.com/api/auth/callback/google` (pour la production)
8. Cliquez sur **"Create"**
9. **IMPORTANT**: Copiez le **Client ID** et le **Client Secret** qui s'affichent (vous ne pourrez plus voir le secret après)

### 5. Ajouter les variables d'environnement

Ajoutez ces lignes à votre fichier `.env.local`:

```bash
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
```

**Exemple:**
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 6. Redémarrer le serveur de développement

```bash
npm run dev
```

## ✅ Vérification

1. Allez sur `http://localhost:3000/auth/signin`
2. Vous devriez voir un bouton "Se connecter avec Google"
3. Cliquez dessus et testez la connexion

## 🔧 Pour la production (Vercel avec pulse-event.ca)

Quand vous déployez sur Vercel avec le domaine `pulse-event.ca`:

### 1. Configurer les variables d'environnement dans Vercel

1. Allez dans votre projet Vercel > **Settings** > **Environment Variables**
2. Ajoutez ou modifiez ces variables:
   - `GOOGLE_CLIENT_ID` = votre client ID Google
   - `GOOGLE_CLIENT_SECRET` = votre client secret Google
   - `NEXTAUTH_URL` = `https://pulse-event.ca` (⚠️ **IMPORTANT**: doit correspondre à votre domaine)
   - `NEXTAUTH_SECRET` = votre secret NextAuth (généré avec `openssl rand -base64 32`)

### 2. Configurer les URLs dans Google Cloud Console

**⚠️ CRITIQUE**: Les URLs doivent correspondre EXACTEMENT à votre domaine.

1. Allez dans [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. Cliquez sur votre OAuth 2.0 Client ID
4. Dans **"Authorized JavaScript origins"**, ajoutez:
   - `https://pulse-event.ca`
   - `https://www.pulse-event.ca` (si vous utilisez www)
   - `http://localhost:3000` (pour le développement local)
5. Dans **"Authorized redirect URIs"**, ajoutez:
   - `https://pulse-event.ca/api/auth/callback/google`
   - `https://www.pulse-event.ca/api/auth/callback/google` (si vous utilisez www)
   - `http://localhost:3000/api/auth/callback/google` (pour le développement local)
6. Cliquez sur **"Save"**

### 3. Redéployer sur Vercel

Après avoir modifié les variables d'environnement:
1. Allez dans **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**

## 🐛 Dépannage

### Erreur "error=undefined" ou "Erreur d'authentification"

Cette erreur survient généralement quand:

1. **Les variables d'environnement ne sont pas configurées dans Vercel**
   - Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont bien définies dans Vercel
   - Vérifiez que `NEXTAUTH_URL` est défini sur `https://pulse-event.ca` (pas sur l'ancien domaine)
   - Redéployez après avoir modifié les variables

2. **Les URLs de redirection ne correspondent pas**
   - Vérifiez dans Google Cloud Console que l'URL de redirection est exactement: `https://pulse-event.ca/api/auth/callback/google`
   - Vérifiez que l'origine JavaScript autorisée est: `https://pulse-event.ca`
   - Les URLs sont sensibles à la casse et aux trailing slashes

3. **NEXTAUTH_URL incorrect**
   - Dans Vercel, `NEXTAUTH_URL` doit être `https://pulse-event.ca` (sans trailing slash)
   - Si vous avez changé de domaine, mettez à jour cette variable et redéployez

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URL de redirection dans Google Cloud Console correspond **exactement** à celle utilisée par NextAuth
- Pour le développement: `http://localhost:3000/api/auth/callback/google`
- Pour la production: `https://pulse-event.ca/api/auth/callback/google`
- ⚠️ **Important**: Pas de trailing slash, pas de majuscules, exactement comme indiqué

### Erreur "access_denied"

- Vérifiez que l'écran de consentement OAuth est bien configuré
- Si vous êtes en mode "External", assurez-vous que l'utilisateur est dans la liste des test users (ou publiez l'app)
- Vérifiez que l'API "Google Identity Services" est activée

### Le bouton Google n'apparaît pas

- Vérifiez que les variables `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont bien définies
- En local: vérifiez dans `.env.local`
- En production: vérifiez dans Vercel > Settings > Environment Variables
- Redémarrez le serveur de développement après avoir ajouté les variables
- Redéployez sur Vercel après avoir modifié les variables

### Vérification rapide

Pour vérifier que tout est bien configuré:

1. **Dans Vercel**:
   - ✅ `GOOGLE_CLIENT_ID` est défini
   - ✅ `GOOGLE_CLIENT_SECRET` est défini
   - ✅ `NEXTAUTH_URL` = `https://pulse-event.ca`
   - ✅ `NEXTAUTH_SECRET` est défini

2. **Dans Google Cloud Console**:
   - ✅ Authorized JavaScript origins contient: `https://pulse-event.ca`
   - ✅ Authorized redirect URIs contient: `https://pulse-event.ca/api/auth/callback/google`

## 📚 Ressources

- [Documentation NextAuth - Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

