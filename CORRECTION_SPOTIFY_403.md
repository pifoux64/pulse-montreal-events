# 🔧 Correction : Erreur 403 Spotify (User Not Registered)

## Problème

Lors de la synchronisation des goûts Spotify, l'erreur suivante apparaît :
```
Erreur lors de la récupération des artistes Spotify: Spotify top artists failed: 403
Check settings on developer.spotify.com/dashboard, the user may not be registered.
```

## Cause

L'erreur **403 Forbidden** indique que l'utilisateur Spotify (`orel_paco` dans ce cas) n'est **pas enregistré** dans le dashboard Spotify Developer comme utilisateur de test de l'application.

**Important** : Pour les applications Spotify en mode développement, seuls les utilisateurs ajoutés manuellement dans le dashboard peuvent utiliser l'application.

## Solution

### Étape 1 : Ajouter l'utilisateur dans Spotify Developer Dashboard

1. **Va sur Spotify Developer Dashboard** : https://developer.spotify.com/dashboard
2. **Sélectionne ton application** (celle utilisée pour Pulse)
3. **Clique sur "Edit Settings"**
4. **Scrolle jusqu'à la section "User Management"** ou **"Users"**
5. **Clique sur "Add User"** ou **"Add Test User"**
6. **Ajoute l'email Spotify de l'utilisateur** (`orel_paco` correspond probablement à un email Spotify)
   - Tu peux aussi ajouter l'ID Spotify si tu le connais
7. **Clique sur "Add"** puis **"Save"**

### Étape 2 : Vérifier le mode de l'application

Si tu veux que **tous les utilisateurs** puissent utiliser l'application (pas seulement les utilisateurs de test) :

1. **Dans Spotify Developer Dashboard** → **Edit Settings**
2. **Trouve la section "App Settings"** ou **"Application Type"**
3. **Change le mode de "Development" à "Production"** (si disponible)
   - ⚠️ **Note** : Le passage en production nécessite une review Spotify et peut prendre du temps

### Étape 3 : Vérifier les scopes

Assure-toi que les scopes suivants sont bien demandés et accordés :

- ✅ `user-top-read` (requis pour récupérer les top artists)
- ✅ `user-read-email` (optionnel mais recommandé)
- ✅ `user-read-private` (optionnel mais recommandé)

**Où vérifier** :
1. Dans le code : `src/lib/music-services/spotify.ts` (ligne 59-65)
2. Dans Spotify Dashboard → **Edit Settings** → **Scopes**

### Étape 4 : Demander à l'utilisateur de reconnecter

Après avoir ajouté l'utilisateur :

1. **L'utilisateur doit se déconnecter** de Spotify dans son profil Pulse
2. **Puis se reconnecter** pour que les nouvelles permissions soient prises en compte

## Vérification

### Test de la synchronisation

1. **L'utilisateur va sur** https://pulse-event.ca/profil
2. **Vérifie que Spotify est connecté** (badge "Connecté")
3. **Clique sur "Synchroniser mes goûts"**
4. **La synchronisation devrait fonctionner** sans erreur 403

### Diagnostic avec les logs

Si l'erreur persiste après avoir ajouté l'utilisateur :

1. **Va dans Vercel** → **Deployments** → Clique sur le dernier déploiement
2. **Va dans l'onglet "Functions"** ou **"Logs"**
3. **Filtre par** `/api/user/music-taste/sync`
4. **Relance la synchronisation** et regarde les logs

Tu devrais voir :
```
[Spotify Sync] Erreur lors de la récupération des top artists: ...
```

## Messages d'erreur améliorés

J'ai amélioré les messages d'erreur pour être plus clairs :

- **403** : Message explicite indiquant que l'utilisateur doit être ajouté dans le dashboard
- **401** : Message indiquant que le token est invalide et qu'il faut reconnecter
- **Autres** : Messages avec détails de l'erreur Spotify

## Solution alternative : Mode Production

Si tu veux éviter d'ajouter chaque utilisateur manuellement :

### Passer en mode Production (recommandé pour la production)

1. **Dans Spotify Developer Dashboard** → **Edit Settings**
2. **Change le mode en "Production"**
3. **Soumet une demande de review Spotify** (peut prendre plusieurs jours/semaines)
4. **Une fois approuvé**, tous les utilisateurs pourront utiliser l'application

⚠️ **Note** : Le passage en production nécessite :
- Une description complète de l'application
- Une politique de confidentialité
- Une justification de l'utilisation des scopes
- Une review par Spotify (peut prendre du temps)

## Checklist de vérification

- [ ] Utilisateur ajouté dans Spotify Developer Dashboard → Users/Test Users
- [ ] Scopes vérifiés (`user-top-read` présent)
- [ ] Utilisateur déconnecté puis reconnecté après ajout
- [ ] Test de synchronisation effectué
- [ ] Logs Vercel vérifiés si erreur persiste

## Résultat attendu

Après correction :
- ✅ La synchronisation Spotify fonctionne
- ✅ Les genres musicaux sont détectés et affichés
- ✅ Plus d'erreur 403

## Support

Si le problème persiste après avoir ajouté l'utilisateur :

1. **Vérifie les logs Vercel** pour voir l'erreur exacte
2. **Vérifie que l'email/ID Spotify est correct** dans le dashboard
3. **Vérifie que l'utilisateur a bien autorisé les scopes** lors de la connexion
4. **Demande à l'utilisateur de se déconnecter puis reconnecter**

---

**Dernière mise à jour** : Janvier 2025

