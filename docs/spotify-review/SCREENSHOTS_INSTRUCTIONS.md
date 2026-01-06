# 📸 Instructions pour les Screenshots - Spotify Review

Ce document explique comment prendre les screenshots nécessaires pour la review Spotify.

---

## 📋 Liste des Screenshots Requis

### 1. Écran de Connexion Spotify

**Fichier à créer** : `docs/spotify-review/screenshots/01-connect-screen.png`

**Étapes** :
1. Aller sur https://pulse-event.ca/profil
2. Se connecter avec un compte utilisateur
3. Scroller jusqu'à la section "Connexion Spotify"
4. Prendre un screenshot de la section complète incluant :
   - Le titre "Connexion Spotify"
   - Le bouton "Connecter Spotify"
   - La boîte bleue avec les explications sur les données utilisées
   - Les informations sur l'utilisation des données

**Résolution recommandée** : 1920x1080 ou supérieure

---

### 2. Modal OAuth Spotify

**Fichier à créer** : `docs/spotify-review/screenshots/02-oauth-modal.png`

**Étapes** :
1. Sur la page `/profil`, cliquer sur "Connecter Spotify"
2. Attendre la redirection vers Spotify
3. Prendre un screenshot de la page d'autorisation Spotify montrant :
   - Le nom de l'application "Pulse"
   - Les permissions demandées : "Voir vos artistes les plus écoutés"
   - Le bouton "Autoriser" ou "Autoriser l'accès"

**Résolution recommandée** : 1920x1080 ou supérieure

**Note** : Si tu n'as pas accès à un compte Spotify de test, tu peux utiliser un compte personnel pour la capture.

---

### 3. Genres Détectés

**Fichier à créer** : `docs/spotify-review/screenshots/03-detected-genres.png`

**Étapes** :
1. Après avoir connecté Spotify, aller sur `/profil`
2. Cliquer sur "Synchroniser mes goûts"
3. Attendre que la synchronisation se termine
4. Prendre un screenshot de la section "Mes goûts & préférences" montrant :
   - La section "Détecté depuis Spotify" avec les genres affichés
   - Les badges verts avec les genres (ex: "reggae", "hip_hop", etc.)
   - Le badge "Connecté" en haut à droite
   - Les informations : Spotify user id, dernière sync

**Résolution recommandée** : 1920x1080 ou supérieure

---

### 4. Recommandations "Pour toi"

**Fichier à créer** : `docs/spotify-review/screenshots/04-for-you-recommendations.png`

**Étapes** :
1. Aller sur https://pulse-event.ca/pour-toi
2. Prendre un screenshot montrant :
   - Le titre "Pour toi" ou "Découvrez des événements faits pour vous"
   - Les événements recommandés avec leurs cartes
   - Les badges "Basé sur Spotify" ou "Recommandé pour vous" si visibles
   - Les explications de recommandation (ex: "Recommandé car vous aimez le reggae")

**Résolution recommandée** : 1920x1080 ou supérieure

**Note** : Si aucun événement n'est recommandé, prendre un screenshot de la page vide avec le message approprié.

---

### 5. Contrôles Privacy

**Fichier à créer** : `docs/spotify-review/screenshots/05-privacy-controls.png`

**Étapes** :
1. Aller sur `/profil`
2. Scroller jusqu'à la section "Mes goûts & préférences"
3. Prendre un screenshot montrant :
   - Le toggle "Recommandations personnalisées" (activé ou désactivé)
   - La section avec les explications sur les données Spotify
   - Le bouton "Déconnecter" visible
   - Les genres détectés (si disponibles)

**Résolution recommandée** : 1920x1080 ou supérieure

---

## 🛠️ Outils Recommandés

### Pour Prendre les Screenshots

- **macOS** : `Cmd + Shift + 4` (sélection de zone) ou `Cmd + Shift + 3` (écran complet)
- **Windows** : `Win + Shift + S` (Snipping Tool) ou `PrtScn`
- **Linux** : `Shift + PrtScn` ou outils comme Flameshot

### Pour Annoter (Optionnel)

- **macOS** : Preview (outils d'annotation intégrés)
- **Windows** : Paint 3D ou Snipping Tool
- **En ligne** : https://www.photopea.com/ ou https://www.canva.com/

### Pour Optimiser

- **Compression** : Utiliser des outils comme TinyPNG ou ImageOptim
- **Format** : PNG recommandé pour les screenshots
- **Taille** : Maximum 5MB par screenshot (requis par Spotify)

---

## ✅ Checklist Avant Soumission

- [ ] Tous les screenshots sont clairs et lisibles
- [ ] Les textes sont visibles (pas trop petits)
- [ ] Les fonctionnalités clés sont visibles
- [ ] Les screenshots montrent bien l'utilisation de Spotify
- [ ] Les fichiers sont nommés correctement (01-connect-screen.png, etc.)
- [ ] Les fichiers sont sauvegardés dans `docs/spotify-review/screenshots/`
- [ ] Taille des fichiers < 5MB chacun

---

## 📝 Notes

- **Privacité** : Si les screenshots contiennent des informations personnelles (emails, noms), les flouter si nécessaire
- **Qualité** : Prendre les screenshots en haute résolution pour une meilleure qualité
- **Cohérence** : Utiliser le même navigateur et la même taille de fenêtre pour tous les screenshots
- **Mise à jour** : Si l'UI change, mettre à jour les screenshots avant soumission

---

**Dernière mise à jour** : Janvier 2025

