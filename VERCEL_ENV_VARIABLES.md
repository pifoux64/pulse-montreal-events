# 🔐 Variables d'Environnement Vercel - Configuration Correcte

## ⚠️ PROBLÈME COURANT

Si `NEXTAUTH_URL` est configuré sur `http://127.0.0.1:3000` dans Vercel, **le déploiement peut échouer** ou l'authentification ne fonctionnera pas en production.

## ✅ Configuration Correcte pour Vercel

### 1. Variables OBLIGATOIRES (Production)

Dans Vercel → Settings → Environment Variables, configurez :

```bash
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth (CRITIQUE - doit être l'URL de production)
NEXTAUTH_URL=https://pulse-event.ca
# OU si vous utilisez le domaine Vercel par défaut:
# NEXTAUTH_URL=https://montreal-events.vercel.app

NEXTAUTH_SECRET=[génère avec: openssl rand -base64 32]

# CRON
CRON_SECRET=[génère avec: openssl rand -hex 32]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Variables RECOMMANDÉES

```bash
# URL publique de l'application (pour les emails, liens, etc.)
NEXT_PUBLIC_APP_URL=https://pulse-event.ca
# OU: https://montreal-events.vercel.app

# APIs externes
TICKETMASTER_API_KEY=xxx
RESEND_API_KEY=re_xxx
OPENAI_API_KEY=sk-xxx

# Spotify (optionnel)
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
```

## 🔧 Comment Corriger

### Étape 1: Identifier votre URL de production

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet
3. Regarde l'URL dans "Domains" ou utilise l'URL par défaut Vercel
4. Exemple: `https://montreal-events-xxx.vercel.app` ou `https://pulse-event.ca`

### Étape 2: Mettre à jour les variables dans Vercel

1. Va dans **Settings** → **Environment Variables**
2. Pour chaque variable ci-dessous, **modifie ou ajoute** :

#### ⚠️ CRITIQUE - À CORRIGER IMMÉDIATEMENT

```
NEXTAUTH_URL = https://pulse-event.ca
# OU si vous n'avez pas de domaine personnalisé:
# NEXTAUTH_URL = https://montreal-events-xxx.vercel.app
```

```
NEXT_PUBLIC_APP_URL = https://pulse-event.ca
# OU: https://montreal-events-xxx.vercel.app
```

### Étape 3: Vérifier les environnements

Assure-toi que les variables sont configurées pour **Production**, **Preview**, et **Development** :

- ✅ **Production** : URL de production (`https://pulse-event.ca`)
- ✅ **Preview** : Peut utiliser l'URL Vercel par défaut
- ✅ **Development** : `http://localhost:3000` (pour les tests locaux)

### Étape 4: Redéployer

Après avoir modifié les variables :

1. Va dans **Deployments**
2. Clique sur les trois points (⋯) du dernier déploiement
3. Sélectionne **Redeploy**

## 📋 Checklist Complète

- [ ] `NEXTAUTH_URL` = URL de production (pas `http://127.0.0.1:3000`)
- [ ] `NEXT_PUBLIC_APP_URL` = URL de production (pas `http://127.0.0.1:3000`)
- [ ] `DATABASE_URL` = URL Supabase valide
- [ ] `NEXTAUTH_SECRET` = Secret généré (32+ caractères)
- [ ] `CRON_SECRET` = Secret généré
- [ ] Variables configurées pour **Production**, **Preview**, et **Development**
- [ ] Redéploiement effectué après modification

## 🚨 Erreurs Courantes

### ❌ Erreur: "Invalid NEXTAUTH_URL"
**Cause**: `NEXTAUTH_URL` est `http://127.0.0.1:3000` ou invalide
**Solution**: Change pour `https://pulse-event.ca` ou ton domaine Vercel

### ❌ Erreur: "Redirect URI mismatch"
**Cause**: `NEXTAUTH_URL` ne correspond pas aux URLs configurées dans OAuth providers
**Solution**: Vérifie que `NEXTAUTH_URL` correspond aux URLs dans Google/Spotify/etc.

### ❌ Build échoue silencieusement
**Cause**: Variables manquantes ou invalides
**Solution**: Vérifie tous les logs de build dans Vercel

## 🔍 Vérification Rapide

Pour vérifier que tout est correct :

```bash
# En local, vérifie les variables
npm run checkenv

# Puis compare avec ce qui est dans Vercel
# Les URLs doivent être différentes :
# - Local: http://localhost:3000
# - Production: https://pulse-event.ca
```

## 💡 Astuce

Utilise des **variables différentes** pour chaque environnement :
- **Development** : `http://localhost:3000`
- **Preview** : `https://montreal-events-git-xxx.vercel.app`
- **Production** : `https://pulse-event.ca`

Vercel permet de configurer des valeurs différentes selon l'environnement dans l'interface.

