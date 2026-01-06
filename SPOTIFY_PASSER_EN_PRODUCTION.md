# 🚀 Passer l'Application Spotify en Mode Production

## Objectif

Passer l'application Spotify de **Development** à **Production** pour que **tous les utilisateurs** puissent utiliser l'intégration Spotify sans être ajoutés manuellement dans le dashboard.

## Pourquoi passer en Production ?

### Mode Development (actuel)
- ❌ Seuls les utilisateurs ajoutés manuellement peuvent utiliser l'app
- ❌ Limité à 25 utilisateurs de test
- ❌ Nécessite d'ajouter chaque utilisateur un par un

### Mode Production
- ✅ Tous les utilisateurs peuvent utiliser l'app
- ✅ Pas de limite d'utilisateurs
- ✅ Pas besoin d'ajouter les utilisateurs manuellement
- ✅ Application publique et accessible à tous

## Étapes pour passer en Production

### Étape 1 : Préparer les informations requises

Avant de soumettre la demande, tu dois avoir :

1. **Description complète de l'application**
   - Nom : Pulse Montréal
   - Description : Plateforme de découverte d'événements à Montréal avec recommandations personnalisées basées sur les goûts musicaux Spotify
   - Site web : https://pulse-event.ca
   - Politique de confidentialité : https://pulse-event.ca/politique-confidentialite
   - Conditions d'utilisation : https://pulse-event.ca/cgu

2. **Justification des scopes demandés**
   - `user-top-read` : Pour analyser les top artists de l'utilisateur et détecter ses genres musicaux préférés
   - `user-read-email` : Pour identifier l'utilisateur de manière unique
   - `user-read-private` : Pour accéder aux informations de profil de base

3. **Screenshots de l'application**
   - Page de connexion Spotify
   - Page de profil avec les genres détectés
   - Page "Pour toi" avec les recommandations

### Étape 2 : Accéder au Dashboard Spotify

1. **Va sur** https://developer.spotify.com/dashboard
2. **Connecte-toi** avec ton compte Spotify Developer
3. **Sélectionne l'application** Pulse Montréal

### Étape 3 : Remplir les informations de l'application

1. **Clique sur "Edit Settings"**
2. **Remplis les champs suivants** :

   **App Information** :
   - **App name** : Pulse Montréal
   - **App description** :
     ```
     Pulse Montréal est une plateforme de découverte d'événements culturels, musicaux et festifs à Montréal. 
     En connectant leur compte Spotify, les utilisateurs obtiennent des recommandations personnalisées 
     d'événements basées sur leurs goûts musicaux réels.
     ```
   - **Website** : https://pulse-event.ca
   - **Redirect URIs** :
     - `https://pulse-event.ca/api/user/music-services/spotify/callback`
     - `http://localhost:3000/api/user/music-services/spotify/callback` (pour développement local)

   **Privacy Policy & Terms** :
   - **Privacy Policy URL** : https://pulse-event.ca/politique-confidentialite
   - **Terms of Service URL** : https://pulse-event.ca/cgu

   **App Icon** :
   - Upload une icône pour l'application (optionnel mais recommandé)

### Étape 4 : Justifier les scopes

Dans la section **"Scopes"** ou **"Permissions"**, justifie chaque scope :

1. **`user-top-read`** :
   ```
   Ce scope est nécessaire pour analyser les top artists de l'utilisateur et détecter 
   automatiquement ses genres musicaux préférés. Ces informations sont utilisées pour 
   générer des recommandations personnalisées d'événements correspondant à ses goûts.
   ```

2. **`user-read-email`** :
   ```
   Ce scope est utilisé pour identifier de manière unique l'utilisateur et associer 
   son compte Spotify à son profil Pulse Montréal.
   ```

3. **`user-read-private`** :
   ```
   Ce scope permet d'accéder aux informations de profil de base de l'utilisateur 
   (nom d'utilisateur, ID) pour personnaliser son expérience sur Pulse Montréal.
   ```

### Étape 5 : Soumettre la demande de review

1. **Dans le dashboard**, cherche la section **"App Review"** ou **"Request Extension"**
2. **Clique sur "Request Extension"** ou **"Submit for Review"**
3. **Remplis le formulaire** avec :
   - Description détaillée de l'utilisation de l'API
   - Justification de chaque scope
   - Screenshots de l'application (si demandé)
4. **Soumet la demande**

### Étape 6 : Attendre l'approbation

- ⏱️ **Délai** : Généralement 2-4 semaines (peut varier)
- 📧 **Notification** : Tu recevras un email quand la demande est approuvée ou si des modifications sont nécessaires

### Étape 7 : Activer le mode Production

Une fois approuvé :

1. **Retourne dans le dashboard**
2. **Va dans "Edit Settings"**
3. **Change le mode de "Development" à "Production"**
4. **Sauvegarde**

## Informations à préparer pour la review

### Description de l'application (exemple)

```
Pulse Montréal est une plateforme web moderne dédiée à la découverte d'événements 
culturels, musicaux, sportifs et festifs à Montréal. 

En connectant leur compte Spotify, les utilisateurs peuvent obtenir des recommandations 
personnalisées d'événements basées sur l'analyse de leur historique d'écoute. L'application 
utilise l'API Spotify pour :

1. Analyser les top artists de l'utilisateur
2. Détecter automatiquement ses genres musicaux préférés
3. Générer des recommandations d'événements correspondant à ses goûts
4. Améliorer l'expérience de découverte d'événements

Les données Spotify sont utilisées uniquement pour améliorer les recommandations 
et ne sont jamais partagées avec des tiers.
```

### Justification des scopes (exemple)

**`user-top-read`** :
```
Nécessaire pour analyser les top artists de l'utilisateur et détecter automatiquement 
ses genres musicaux préférés. Ces informations sont utilisées exclusivement pour générer 
des recommandations personnalisées d'événements correspondant à ses goûts musicaux.
```

**`user-read-email`** :
```
Utilisé pour identifier de manière unique l'utilisateur et associer son compte Spotify 
à son profil Pulse Montréal. L'email n'est pas affiché publiquement et est utilisé 
uniquement pour l'authentification.
```

**`user-read-private`** :
```
Permet d'accéder aux informations de profil de base (nom d'utilisateur, ID) pour 
personnaliser l'expérience utilisateur sur Pulse Montréal.
```

## Checklist avant soumission

- [ ] Description complète de l'application rédigée
- [ ] Politique de confidentialité accessible (https://pulse-event.ca/politique-confidentialite)
- [ ] Conditions d'utilisation accessibles (https://pulse-event.ca/cgu)
- [ ] Justification de chaque scope rédigée
- [ ] Screenshots de l'application préparés (si demandé)
- [ ] Redirect URIs correctement configurés
- [ ] Informations de contact à jour dans le dashboard

## Après l'approbation

Une fois que l'application est en mode Production :

1. ✅ **Tous les utilisateurs** pourront se connecter sans être ajoutés manuellement
2. ✅ **Plus d'erreur 403** pour les nouveaux utilisateurs
3. ✅ **Pas de limite** sur le nombre d'utilisateurs
4. ✅ **Application publique** et accessible à tous

## Alternative temporaire (en attendant l'approbation)

En attendant que la demande soit approuvée, tu peux :

1. **Ajouter les utilisateurs manuellement** dans le dashboard (limite de 25)
2. **Demander aux utilisateurs de patienter** jusqu'à l'approbation
3. **Utiliser une version de test** avec un nombre limité d'utilisateurs

## Support

Si tu as des questions ou besoin d'aide :

- **Documentation Spotify** : https://developer.spotify.com/documentation/web-api
- **Support Spotify Developer** : Via le dashboard ou la communauté

---

**Dernière mise à jour** : Janvier 2025

