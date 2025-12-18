# 🔧 Fix Déploiement Vercel - Guide de Dépannage

## ✅ Vérifications à Faire

### 1. Vérifier que le Projet est Connecté à GitHub

1. Va sur https://vercel.com/dashboard
2. Vérifie que le projet `montreal-events` (ou `pulse-montreal-events`) existe
3. Si le projet n'existe pas :
   - Clique "Add New..." → "Project"
   - Import depuis GitHub → Sélectionne `pifoux64/pulse-montreal-events`
   - Configure les variables d'environnement (voir ci-dessous)
   - Clique "Deploy"

### 2. Vérifier les Webhooks GitHub

1. Va sur https://github.com/pifoux64/pulse-montreal-events/settings/hooks
2. Vérifie qu'il y a un webhook Vercel configuré
3. Si pas de webhook :
   - Va dans Vercel → Settings → Git
   - Vérifie que le repo est connecté
   - Si pas connecté, reconnecte-le

### 3. Vérifier les Variables d'Environnement sur Vercel

Dans Vercel → Settings → Environment Variables, assure-toi d'avoir :

#### 🔑 Obligatoires
```
DATABASE_URL = [ton URL Supabase]
NEXTAUTH_SECRET = [génère avec: openssl rand -base64 32]
NEXTAUTH_URL = https://montreal-events.vercel.app (ou ton domaine)
CRON_SECRET = [génère avec: openssl rand -hex 32]
```

#### 📊 Optionnelles mais Recommandées
```
TICKETMASTER_API_KEY = [ton clé]
RESEND_API_KEY = [ton clé Resend]
OPENAI_API_KEY = [ton clé OpenAI]
SPOTIFY_CLIENT_ID = [ton clé]
SPOTIFY_CLIENT_SECRET = [ton secret]
NEXT_PUBLIC_APP_URL = https://pulse-event.ca (⚠️ PAS http://127.0.0.1:3000 !)
```
```

### 4. Forcer un Nouveau Déploiement

Si les commits sont poussés mais rien ne se déploie :

1. **Option A : Via Vercel Dashboard**
   - Va sur https://vercel.com/dashboard
   - Sélectionne ton projet
   - Clique "Deployments"
   - Clique "Redeploy" sur le dernier déploiement
   - Ou crée un nouveau déploiement depuis "Deployments" → "Create Deployment"

2. **Option B : Via CLI Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

3. **Option C : Trigger via Git**
   ```bash
   # Créer un commit vide pour forcer le déploiement
   git commit --allow-empty -m "trigger: Force Vercel deployment"
   git push origin main
   ```

### 5. Vérifier les Logs de Build

1. Va sur Vercel → Deployments
2. Clique sur le dernier déploiement
3. Regarde les "Build Logs"
4. Si erreur, corrige et recommence

### 6. Vérifier que Prisma est Configuré

Le build doit inclure `prisma generate`. Vérifie que dans `package.json` :
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## 🚀 Solution Rapide : Reconnecter le Projet

Si rien ne fonctionne, reconnecte le projet :

1. **Dans Vercel** :
   - Settings → Git → Disconnect
   - Puis reconnecte le repo GitHub

2. **Ou crée un nouveau projet** :
   - Delete l'ancien projet Vercel
   - Crée un nouveau projet depuis GitHub
   - Configure toutes les variables d'environnement
   - Deploy

## 📝 Checklist Complète

- [ ] Projet Vercel existe et est connecté à GitHub
- [ ] Webhook GitHub est configuré
- [ ] Variables d'environnement sont toutes configurées
- [ ] Build passe en local (`npm run build`)
- [ ] Dernier commit est bien sur `main` branch
- [ ] Vercel a accès au repo GitHub (permissions)

## 🔍 Commandes Utiles

```bash
# Vérifier le remote Git
git remote -v

# Vérifier les derniers commits
git log --oneline -5

# Tester le build localement
npm run build

# Vérifier les variables d'environnement
npm run checkenv
```

