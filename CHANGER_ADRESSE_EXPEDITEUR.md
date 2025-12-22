# 📧 Changer l'adresse d'expéditeur (noreply → hello)

## Pourquoi changer ?

Les insights Resend indiquent : **"Don't use 'no-reply'"**

Utiliser `noreply` réduit la confiance car :
- Les utilisateurs ne peuvent pas répondre
- Les filtres anti-spam sont plus stricts avec "noreply"
- Cela indique une communication à sens unique

## Solution : Utiliser une adresse plus "humaine"

Au lieu de `noreply@pulse-event.ca`, utilise :
- ✅ `hello@pulse-event.ca` (recommandé)
- ✅ `contact@pulse-event.ca`
- ✅ `info@pulse-event.ca`

## Étapes de configuration

### Étape 1 : Vérifier dans Resend

1. Va dans Resend → **Domains** → `pulse-event.ca`
2. Vérifie que le domaine est **Verified**
3. Note que tu peux utiliser n'importe quelle adresse sur ce domaine (pas besoin de créer l'adresse)

### Étape 2 : Mettre à jour dans Vercel

1. Va dans Vercel → **Project Settings** → **Environment Variables**
2. Trouve la variable `EMAIL_FROM`
3. Modifie la valeur :
   ```bash
   EMAIL_FROM="Pulse Montréal <hello@pulse-event.ca>"
   ```
   Ou :
   ```bash
   EMAIL_FROM="Pulse Montréal <contact@pulse-event.ca>"
   ```
4. **Important** : Assure-toi que c'est configuré pour **Production**, **Preview**, et **Development**
5. Sauvegarde

### Étape 3 : Vérifier dans le code

Vérifie que le code utilise bien la variable d'environnement :

**Dans `src/lib/auth.ts`** :
```typescript
from: process.env.EMAIL_FROM || 'noreply@pulse-montreal.com',
```
✅ C'est déjà correct - utilise `EMAIL_FROM` si défini

**Dans `src/lib/email/resend.ts`** :
```typescript
from: params.from || 'Pulse Montréal <noreply@pulse-montreal.com>',
```
⚠️ Si `params.from` n'est pas fourni, il utilise une valeur par défaut. C'est OK car NextAuth fournit toujours `params.from`.

### Étape 4 : Redéployer

1. Va dans Vercel → **Deployments**
2. Clique sur les trois points (⋯) du dernier déploiement
3. Sélectionne **Redeploy**
4. Ou fais un commit/push pour déclencher un nouveau déploiement

### Étape 5 : Tester

1. Va sur https://pulse-event.ca/auth/signin
2. Essaie de te connecter avec une adresse email
3. Vérifie que l'email reçu vient de `hello@pulse-event.ca` (ou l'adresse choisie)

## Vérification

### Dans Resend

1. Va dans Resend → **Emails** (ou **Logs**)
2. Regarde les emails récents
3. Vérifie que le champ **FROM** affiche la nouvelle adresse

### Dans les insights Resend

1. Clique sur un email récent
2. Va dans l'onglet **Insights**
3. L'avertissement "Don't use 'no-reply'" devrait disparaître une fois que tu utilises une nouvelle adresse

## Notes importantes

- ✅ Tu n'as **pas besoin de créer** l'adresse `hello@pulse-event.ca` dans HostPapa
- ✅ Resend peut envoyer depuis n'importe quelle adresse sur un domaine vérifié
- ✅ Les emails envoyés depuis `hello@pulse-event.ca` seront bien reçus même si l'adresse n'existe pas physiquement
- ⚠️ Si tu veux recevoir des réponses, tu devras créer l'adresse `hello@pulse-event.ca` dans HostPapa et configurer un forward vers une vraie boîte email

## Optionnel : Configurer pour recevoir les réponses

Si tu veux recevoir les réponses aux emails :

1. **Dans HostPapa** :
   - Crée une adresse email `hello@pulse-event.ca`
   - Configure un forward vers une vraie boîte email (ex: `pierrefouilloux59@gmail.com`)

2. **Ou utilise un service de gestion d'emails** :
   - Google Workspace
   - Microsoft 365
   - Zoho Mail
   - etc.

## Résumé

✅ **Action immédiate** : Change `EMAIL_FROM` dans Vercel de `noreply@pulse-event.ca` vers `hello@pulse-event.ca`

✅ **Redéploie** le projet

✅ **Teste** avec une connexion par email

Cela devrait améliorer la délivrabilité, surtout avec les fournisseurs français qui sont plus stricts avec "noreply".

