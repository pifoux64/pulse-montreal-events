# 📘 Configuration de l'import Facebook Events

## Problème actuel

Facebook bloque activement le scraping HTML automatique (erreur HTTP 400). Pour importer des événements Facebook, vous devez utiliser l'**API Graph de Facebook** avec un token d'accès.

## Solution : Utiliser l'API Graph de Facebook

### 1. Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur **"My Apps"** > **"Create App"**
3. Choisissez **"Business"** comme type d'application
4. Remplissez les informations :
   - **App Name**: Pulse Montreal Events (ou votre nom)
   - **Contact Email**: Votre email
5. Cliquez sur **"Create App"**

### 2. Configurer l'application

1. Dans le tableau de bord de votre application, allez dans **"Settings"** > **"Basic"**
2. Notez votre **App ID** et **App Secret**

### 3. Obtenir un token d'accès

#### Option A : Token d'accès utilisateur (pour tester)

1. Allez dans **"Tools"** > **"Graph API Explorer"**
2. Sélectionnez votre application dans le menu déroulant
3. Cliquez sur **"Generate Access Token"**
4. Sélectionnez les permissions nécessaires :
   - `events.read`
   - `public_profile`
5. Copiez le token généré

#### Option B : Token d'accès de page (recommandé pour la production)

1. Allez dans **"Tools"** > **"Graph API Explorer"**
2. Sélectionnez votre application
3. Dans **"User or Page"**, sélectionnez la page Facebook qui gère les événements
4. Cliquez sur **"Generate Access Token"**
5. Sélectionnez les permissions :
   - `events.read`
   - `pages_read_engagement`
6. Copiez le token généré

⚠️ **Note** : Les tokens d'accès utilisateur expirent après quelques heures. Pour la production, utilisez un **token de page de longue durée**.

### 4. Obtenir un token de longue durée (pour la production)

1. Utilisez le Graph API Explorer pour obtenir un token de courte durée
2. Utilisez cette URL pour l'échanger contre un token de longue durée :
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
3. Remplacez :
   - `{APP_ID}` par votre App ID
   - `{APP_SECRET}` par votre App Secret
   - `{SHORT_LIVED_TOKEN}` par le token de courte durée
4. Le token retourné sera valide pour 60 jours

### 5. Configurer dans Pulse

Ajoutez le token dans votre fichier `.env.local` :

```bash
FACEBOOK_ACCESS_TOKEN=votre_token_ici
```

### 6. Redémarrer le serveur

```bash
npm run dev
```

## Vérification

1. Allez sur la page de création d'événement
2. Collez une URL d'événement Facebook public
3. Cliquez sur "Importer"
4. Les données devraient être importées automatiquement

## Limitations

- L'événement doit être **public** pour être accessible via l'API
- Le token doit avoir les permissions `events.read`
- Les tokens utilisateur expirent rapidement (utilisez des tokens de page pour la production)

## Dépannage

### Erreur "Invalid OAuth access token"

- Vérifiez que le token n'a pas expiré
- Régénérez un nouveau token
- Vérifiez que le token a les bonnes permissions

### Erreur "Event not found"

- Vérifiez que l'événement est public
- Vérifiez que l'URL est correcte
- Vérifiez que le token a accès à la page qui a créé l'événement

### Le scraping HTML ne fonctionne toujours pas

C'est normal. Facebook bloque activement le scraping HTML. Vous **devez** utiliser l'API Graph avec un token d'accès.

## Ressources

- [Documentation Facebook Graph API - Events](https://developers.facebook.com/docs/graph-api/reference/event)
- [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Gestion des tokens d'accès](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
