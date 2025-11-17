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

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"Library"**
2. Recherchez **"Google Identity Services"** et cliquez sur **"Enable"**
3. (Optionnel) Si vous voyez encore l'ancienne fiche **"Google+ API"**, ignorez-la : elle est dépréciée. L'activation de **"Google Identity Services"** suffit pour l'authentification OAuth moderne.

### 3. Configurer l'écran de consentement OAuth

1. Allez dans **"APIs & Services"** > **"OAuth consent screen"**
2. Choisissez **"External"** (pour le développement) ou **"Internal"** (si vous avez un compte Google Workspace)
3. Remplissez les informations:
   - **App name**: Pulse Montreal Events
   - **User support email**: Votre email
   - **Developer contact information**: Votre email
4. Cliquez sur **"Save and Continue"**
5. Sur la page **"Scopes"**, cliquez sur **"Save and Continue"** (les scopes par défaut suffisent)
6. Sur la page **"Test users"** (si External), vous pouvez ajouter des emails de test, puis **"Save and Continue"**
7. Sur la page **"Summary"**, cliquez sur **"Back to Dashboard"**

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

## 🔧 Pour la production (Vercel)

Quand vous déployez sur Vercel:

1. Allez dans votre projet Vercel > **Settings** > **Environment Variables**
2. Ajoutez:
   - `GOOGLE_CLIENT_ID` = votre client ID
   - `GOOGLE_CLIENT_SECRET` = votre client secret
3. **Important**: Dans Google Cloud Console, ajoutez aussi votre URL de production dans:
   - **Authorized JavaScript origins**: `https://votre-domaine.vercel.app`
   - **Authorized redirect URIs**: `https://votre-domaine.vercel.app/api/auth/callback/google`

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de redirection dans Google Cloud Console correspond exactement à celle utilisée par NextAuth
- Pour le développement: `http://localhost:3000/api/auth/callback/google`
- Pour la production: `https://votre-domaine.com/api/auth/callback/google`

### Erreur "access_denied"
- Vérifiez que l'écran de consentement OAuth est bien configuré
- Si vous êtes en mode "External", assurez-vous que l'utilisateur est dans la liste des test users (ou publiez l'app)

### Le bouton Google n'apparaît pas
- Vérifiez que les variables `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont bien définies dans `.env.local`
- Redémarrez le serveur de développement après avoir ajouté les variables

## 📚 Ressources

- [Documentation NextAuth - Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

