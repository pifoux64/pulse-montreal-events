# 📋 Spotify App Review Package - Pulse

**Date de préparation** : Janvier 2025  
**App Name** : Pulse  
**Developer** : Pulse Montréal

---

## 📱 Informations de l'Application

- **App Name** : Pulse
- **Website** : https://pulse-event.ca
- **Privacy Policy URL** : https://pulse-event.ca/politique-confidentialite
- **Terms of Service URL** : https://pulse-event.ca/cgu
- **Redirect URIs** :
  - Production : `https://pulse-event.ca/api/integrations/spotify/callback`
  - Development : `http://localhost:3000/api/integrations/spotify/callback`

---

## 🎯 Use Case et Description

### Description de l'Application

Pulse Montréal est une plateforme web moderne dédiée à la découverte d'événements culturels, musicaux, sportifs et festifs à Montréal. 

En connectant leur compte Spotify, les utilisateurs peuvent obtenir des recommandations personnalisées d'événements basées sur l'analyse de leur historique d'écoute. L'application utilise l'API Spotify pour :

1. **Analyser les top artists** de l'utilisateur (via `user-top-read`)
2. **Détecter automatiquement** ses genres musicaux préférés
3. **Générer des recommandations** d'événements correspondant à ses goûts
4. **Améliorer l'expérience** de découverte d'événements

### Valeur pour l'Utilisateur

- **Découverte intelligente** : Trouver des événements qu'ils n'auraient pas découverts autrement
- **Recommandations pertinentes** : Basées sur leurs goûts musicaux réels, pas sur des préférences manuelles
- **Gain de temps** : Moins de recherche, plus de découverte
- **Expérience personnalisée** : Chaque utilisateur voit des événements adaptés à ses goûts

---

## 🔐 Scopes Demandés

### Scope : `user-top-read`

**Justification** :

Ce scope est nécessaire pour analyser les top artists de l'utilisateur et détecter automatiquement ses genres musicaux préférés. Ces informations sont utilisées exclusivement pour générer des recommandations personnalisées d'événements correspondant à ses goûts musicaux.

**Utilisation spécifique** :
- Récupération des top 50 artists de l'utilisateur (time range: medium_term)
- Extraction des genres musicaux associés à ces artists
- Mapping vers la taxonomie Pulse (genres musicaux structurés)
- Génération de recommandations d'événements correspondant à ces genres

**Pourquoi ce scope uniquement ?** :
- `user-top-read` est suffisant pour notre use case
- Nous n'avons pas besoin d'accéder à l'email (`user-read-email` non nécessaire)
- Nous n'avons pas besoin d'informations privées supplémentaires (`user-read-private` non nécessaire)
- Scopes minimaux facilitent l'approbation et respectent le principe de moindre privilège

---

## 📊 Utilisation des Données

### Données Collectées

- **Top artists** : Via l'endpoint `/v1/me/top/artists` (scope `user-top-read`)
  - Limite : 50 artists maximum
  - Time range : medium_term (derniers 6 mois)

### Données Dérivées

- **Genres musicaux** : Extraits automatiquement depuis les genres associés aux top artists
- **Styles musicaux** : Dérivés des genres pour une classification plus fine

### Utilisation des Données

Les données collectées sont utilisées **exclusivement** pour :

1. **Détecter les genres musicaux préférés** de l'utilisateur
2. **Générer des recommandations personnalisées** d'événements correspondant à ces genres
3. **Améliorer l'expérience de découverte** en montrant des événements pertinents

### Conservation

- **Durée** : Les données Spotify sont conservées tant que le compte Spotify est connecté à Pulse
- **Suppression** : L'utilisateur peut supprimer toutes les données à tout moment via :
  - Déconnexion de Spotify (option "Supprimer les données")
  - Suppression de son compte Pulse

### Partage

- **Aucun partage** : Les données Spotify ne sont **jamais** partagées avec des tiers
- **Utilisation interne uniquement** : Les données sont utilisées exclusivement dans le cadre de Pulse Montréal
- **Pas de vente de données** : Nous ne vendons jamais les données utilisateur

### Sécurité

- **Chiffrement** : Les tokens Spotify (`accessToken`, `refreshToken`) sont chiffrés avant stockage en base de données
- **Clé de chiffrement** : Stockée de manière sécurisée dans les variables d'environnement
- **Refresh automatique** : Les tokens sont automatiquement rafraîchis lorsqu'ils expirent
- **Pas d'exposition** : Les tokens ne sont jamais exposés dans les réponses API

---

## 🎨 Screenshots

### 1. Écran de Connexion Spotify

**Fichier** : `docs/spotify-review/screenshots/01-connect-screen.png`

**Description** :
- Page `/profil` avec section "Connexion Spotify"
- Bouton "Connecter Spotify" visible
- Explications sur les données utilisées et leur utilisation
- Informations de confidentialité affichées

**Instructions pour capture** :
1. Aller sur https://pulse-event.ca/profil (en étant connecté)
2. Scroller jusqu'à la section "Connexion Spotify"
3. Prendre un screenshot de la section complète avec les explications

### 2. Modal OAuth Spotify

**Fichier** : `docs/spotify-review/screenshots/02-oauth-modal.png`

**Description** :
- Modal OAuth Spotify affichant les scopes demandés
- Scope visible : `user-top-read`
- Bouton "Autoriser" visible

**Instructions pour capture** :
1. Cliquer sur "Connecter Spotify"
2. Attendre la redirection vers Spotify
3. Prendre un screenshot de la page d'autorisation Spotify montrant le scope `user-top-read`

### 3. Genres Détectés

**Fichier** : `docs/spotify-review/screenshots/03-detected-genres.png`

**Description** :
- Page `/profil` après connexion Spotify
- Section "Détecté depuis Spotify" avec genres affichés
- Badge "Connecté" visible
- Informations : Spotify user id, dernière sync

**Instructions pour capture** :
1. Après connexion Spotify, aller sur `/profil`
2. Cliquer sur "Synchroniser mes goûts"
3. Attendre la synchronisation
4. Prendre un screenshot de la section "Détecté depuis Spotify" avec les genres affichés

### 4. Recommandations "Pour toi"

**Fichier** : `docs/spotify-review/screenshots/04-for-you-recommendations.png`

**Description** :
- Page `/pour-toi` avec événements recommandés
- Badge "Basé sur Spotify" visible sur les événements
- Explications de recommandation (ex: "Recommandé car vous aimez le reggae")

**Instructions pour capture** :
1. Aller sur https://pulse-event.ca/pour-toi (après connexion et sync Spotify)
2. Prendre un screenshot montrant les événements recommandés avec les badges et explications

### 5. Contrôles Privacy

**Fichier** : `docs/spotify-review/screenshots/05-privacy-controls.png`

**Description** :
- Page `/profil` avec toggle "Recommandations personnalisées"
- Section avec explications sur les données Spotify
- Bouton "Déconnecter" visible

**Instructions pour capture** :
1. Aller sur `/profil`
2. Scroller jusqu'à la section "Mes goûts & préférences"
3. Prendre un screenshot montrant le toggle de personnalisation et les contrôles

---

## ✅ Checklist de Conformité

### Scopes
- [x] Scope minimal : `user-top-read` uniquement
- [x] Justification claire et détaillée
- [x] Pas de scopes inutiles

### Privacy Policy
- [x] Section Spotify complète dans `/politique-confidentialite`
- [x] Données collectées expliquées
- [x] Utilisation des données expliquée
- [x] Conservation expliquée
- [x] Partage expliqué (aucun partage)
- [x] Droits utilisateur expliqués
- [x] URL accessible : https://pulse-event.ca/politique-confidentialite

### Terms of Service
- [x] CGU à jour
- [x] URL accessible : https://pulse-event.ca/cgu

### Configuration Technique
- [x] Redirect URIs corrects dans Spotify Dashboard
- [x] Variables d'environnement configurées
- [x] Tokens chiffrés en base de données
- [x] Refresh automatique des tokens

### Fonctionnalités Utilisateur
- [x] Disconnect flow fonctionne
- [x] Delete data flow fonctionne
- [x] Toggle enable/disable personnalisation fonctionne
- [x] Explications claires pour utilisateurs

### Sécurité
- [x] Tokens chiffrés
- [x] Pas d'exposition de tokens dans les réponses
- [x] Refresh automatique
- [x] Gestion d'erreurs sécurisée

---

## 📝 Justification des Scopes (Texte pour Formulaire)

### Scope : `user-top-read`

```
Ce scope est nécessaire pour analyser les top artists de l'utilisateur et détecter automatiquement ses genres musicaux préférés. 

Utilisation spécifique :
- Récupération des top 50 artists de l'utilisateur (via endpoint /v1/me/top/artists)
- Extraction des genres musicaux associés à ces artists
- Mapping vers notre taxonomie de genres musicaux structurés
- Génération de recommandations personnalisées d'événements correspondant à ces genres

Ces données sont utilisées exclusivement pour améliorer l'expérience de découverte d'événements en montrant à l'utilisateur des événements qui correspondent réellement à ses goûts musicaux.

Les données Spotify ne sont jamais partagées avec des tiers et peuvent être supprimées à tout moment par l'utilisateur.
```

---

## 📄 Description de l'Application (Texte pour Formulaire)

```
Pulse Montréal est une plateforme web moderne dédiée à la découverte d'événements culturels, musicaux, sportifs et festifs à Montréal.

En connectant leur compte Spotify, les utilisateurs obtiennent des recommandations personnalisées d'événements basées sur l'analyse de leur historique d'écoute. L'application utilise l'API Spotify pour :

1. Analyser les top artists de l'utilisateur
2. Détecter automatiquement ses genres musicaux préférés
3. Générer des recommandations d'événements correspondant à ses goûts
4. Améliorer l'expérience de découverte d'événements

Les données Spotify sont utilisées uniquement pour améliorer les recommandations et ne sont jamais partagées avec des tiers. Les utilisateurs peuvent se déconnecter et supprimer leurs données à tout moment.
```

---

## 🚀 Étapes pour Soumettre la Review

### 1. Préparer les Screenshots

1. Prendre les 5 screenshots listés ci-dessus
2. Sauvegarder dans `docs/spotify-review/screenshots/`
3. Vérifier que les screenshots sont clairs et montrent bien les fonctionnalités

### 2. Aller sur Spotify Developer Dashboard

1. URL : https://developer.spotify.com/dashboard
2. Se connecter avec ton compte Spotify Developer
3. Sélectionner l'application "Pulse"

### 3. Accéder à App Review

1. Dans le dashboard, chercher la section **"App Review"** ou **"Request Extension"**
2. Cliquer sur **"Request Extension"** ou **"Submit for Review"**

### 4. Remplir le Formulaire

**App Information** :
- Vérifier que toutes les informations sont à jour
- Privacy Policy URL : https://pulse-event.ca/politique-confidentialite
- Terms of Service URL : https://pulse-event.ca/cgu

**Scopes** :
- Sélectionner `user-top-read`
- Justifier avec le texte fourni ci-dessus

**Description** :
- Utiliser le texte "Description de l'Application" fourni ci-dessus

**Screenshots** :
- Uploader les 5 screenshots préparés
- Ajouter des descriptions si nécessaire

**Additional Information** :
- Expliquer comment les données sont utilisées
- Mentionner que les données ne sont jamais partagées
- Expliquer les contrôles utilisateur (disconnect, delete data)

### 5. Soumettre

1. Vérifier toutes les informations
2. Cliquer sur **"Submit"** ou **"Send for Review"**
3. Noter la date de soumission
4. Attendre la réponse (généralement 2-4 semaines)

---

## 📧 Communication avec Spotify

Si Spotify demande des clarifications ou modifications :

1. **Répondre rapidement** (dans les 48h si possible)
2. **Être précis** dans les réponses
3. **Fournir des exemples** si nécessaire
4. **Respecter les guidelines** Spotify

---

## ✅ Après l'Approbation

Une fois la review approuvée :

1. **Aller dans Spotify Dashboard** → Ton app → "Edit Settings"
2. **Changer le mode** de "Development" à **"Production"**
3. **Sauvegarder**
4. **Tester** avec un utilisateur non-ajouté pour vérifier que ça fonctionne
5. **Communiquer** aux utilisateurs que l'intégration Spotify est maintenant disponible pour tous

---

## 📞 Support

Si tu as des questions ou besoin d'aide :

- **Documentation Spotify** : https://developer.spotify.com/documentation/web-api
- **Spotify Developer Support** : Via le dashboard ou la communauté
- **Guides Pulse** : 
  - `SPOTIFY_SETUP.md` : Configuration de base
  - `SPOTIFY_PASSER_EN_PRODUCTION.md` : Guide détaillé pour passer en production
  - `SPOTIFY_INTEGRATION_PLAN.md` : Plan d'intégration complet

---

**Dernière mise à jour** : Janvier 2025

