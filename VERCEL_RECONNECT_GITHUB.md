# 🔗 Reconnecter Vercel à GitHub - Guide

## ⚠️ Problème

Le commit vide (`75fd520`) a été poussé sur GitHub, mais Vercel n'a pas déclenché de déploiement automatique. Cela signifie que le webhook GitHub → Vercel n'est pas configuré ou que le projet n'est pas correctement connecté.

## ✅ Solution : Reconnecter le Projet

### Étape 1 : Vérifier la Connexion Actuelle

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet `montreal-events`
3. Va dans **Settings** → **Git**
4. Vérifie si le repo GitHub est connecté

### Étape 2 : Reconnecter le Repo GitHub

**Option A : Si le repo est déjà connecté mais ne fonctionne pas**

1. Dans Vercel → Settings → Git
2. Clique sur **"Disconnect"** à côté du repo
3. Clique sur **"Connect Git Repository"**
4. Sélectionne `pifoux64/pulse-montreal-events`
5. Configure :
   - **Production Branch** : `main`
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)
6. Clique **"Deploy"**

**Option B : Si le repo n'est pas connecté**

1. Dans Vercel → Settings → Git
2. Clique sur **"Connect Git Repository"**
3. Sélectionne `pifoux64/pulse-montreal-events`
4. Configure les mêmes paramètres que ci-dessus
5. Clique **"Deploy"**

### Étape 3 : Vérifier le Webhook GitHub

Après avoir reconnecté, vérifie que le webhook est créé :

1. Va sur https://github.com/pifoux64/pulse-montreal-events/settings/hooks
2. Tu devrais voir un webhook Vercel avec :
   - **URL** : `https://api.vercel.com/v1/integrations/deploy/...`
   - **Events** : `push`, `pull_request`
   - **Status** : ✅ Active

Si le webhook n'existe pas :
- Vercel devrait le créer automatiquement lors de la connexion
- Si ce n'est pas le cas, reconnecte le repo (Étape 2)

### Étape 4 : Tester le Déploiement Automatique

1. Fais un petit changement dans le code :
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: Trigger Vercel deployment"
   git push origin main
   ```

2. Vérifie dans Vercel → Deployments qu'un nouveau déploiement se déclenche automatiquement

## 🔧 Alternative : Déploiement Manuel via CLI

Si la connexion Git ne fonctionne toujours pas, tu peux déployer manuellement :

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Déployer en production
vercel --prod
```

## 🚨 Vérifications Importantes

### 1. Permissions GitHub

Assure-toi que Vercel a accès au repo :
- Va sur https://github.com/settings/applications
- Vérifie que Vercel a les permissions nécessaires
- Si besoin, reconnecte Vercel à GitHub

### 2. Branche Main

Vérifie que le projet Vercel est configuré pour la branche `main` :
- Vercel → Settings → Git
- **Production Branch** doit être `main`

### 3. Variables d'Environnement

Après avoir reconnecté, vérifie que toutes les variables d'environnement sont toujours présentes :
- Vercel → Settings → Environment Variables
- Toutes les variables doivent être là (elles ne sont pas supprimées lors de la reconnexion)

## 📋 Checklist

- [ ] Projet Vercel existe
- [ ] Repo GitHub est connecté dans Vercel → Settings → Git
- [ ] Webhook GitHub est présent dans GitHub → Settings → Webhooks
- [ ] Production Branch est configuré sur `main`
- [ ] Variables d'environnement sont toutes présentes
- [ ] Test de déploiement automatique réussi

## 💡 Pourquoi ça arrive ?

Les causes courantes :
- Le projet Vercel a été créé manuellement (sans import GitHub)
- Le webhook GitHub a été supprimé
- Les permissions GitHub ont changé
- Le repo GitHub a été renommé ou déplacé

La solution est toujours de reconnecter le repo dans Vercel.

