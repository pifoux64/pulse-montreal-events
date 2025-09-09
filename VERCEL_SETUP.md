# ⚡ Configuration Vercel - Pulse Montreal

## 🎯 Déploiement en 5 Minutes

### Étape 1: Import du Projet
1. 🌐 Va sur https://vercel.com/new
2. 🔗 Connecte ton compte GitHub si pas fait
3. 🔍 Cherche `pulse-montreal-events`
4. ✅ Clique "Import"

### Étape 2: Configuration Build
Vercel détecte automatiquement Next.js, mais vérifie:
- **Framework**: Next.js
- **Build Command**: `npm run build` 
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Étape 3: Variables d'Environnement
Ajoute ces variables dans l'onglet "Environment Variables":

#### 🔑 Obligatoires
```
TICKETMASTER_API_KEY = 02NvAxNFTMEGqxenoe3knPuMdYvUdBjx
NEXTAUTH_SECRET = [génère avec: openssl rand -base64 32]
NEXTAUTH_URL = https://ton-domaine.vercel.app
```

#### 📊 Optionnelles (pour plus tard)
```
DATABASE_URL = postgresql://...
NEXT_PUBLIC_SUPABASE_URL = https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Étape 4: Deploy
1. ✅ Clique "Deploy"
2. ⏳ Attends 2-3 minutes
3. 🎉 Ton site est en ligne !

## 🔄 Workflow Automatique
Après le premier déploiement:
- `git push main` → Déploiement production
- `git push feature-branch` → Preview deployment
- Pull Request → Preview automatique

## 📊 Monitoring
- **Analytics**: Inclus gratuitement
- **Logs**: Temps réel dans le dashboard
- **Performance**: Core Web Vitals
- **Errors**: Monitoring automatique

## 🌐 Domaine Personnalisé (Optionnel)
1. Achète un domaine (ex: pulse-montreal.com)
2. Dans Vercel → Settings → Domains
3. Ajoute ton domaine
4. Configure les DNS selon les instructions

## ⚡ Performance
Vercel optimise automatiquement:
- ✅ CDN global
- ✅ Compression Brotli/Gzip  
- ✅ Images optimisées
- ✅ Edge Functions
- ✅ HTTPS automatique

## 🎯 URLs Finales
Une fois déployé, tu auras:
- **Site**: https://pulse-montreal-events.vercel.app
- **API Events**: https://pulse-montreal-events.vercel.app/api/events-simple
- **Carte**: https://pulse-montreal-events.vercel.app/carte

## 🔧 Troubleshooting

### Build Failed?
- Vérifie `package.json` et `next.config.ts`
- Regarde les logs de build
- Vérifie les variables d'environnement

### API Errors?
- Vérifie `TICKETMASTER_API_KEY`
- Teste l'API en local d'abord
- Regarde les Function Logs

### 404 Errors?
- Vérifie la structure des routes
- Assure-toi que `src/app/` est bien configuré
