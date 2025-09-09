# 🚀 Guide de Déploiement - Pulse Montreal

## 📋 Prérequis
- [x] Repository GitHub créé
- [x] Compte Vercel (gratuit)
- [x] Variables d'environnement préparées

## 🔗 Étapes de Connexion

### 1. Connecter à GitHub
```bash
# Remplace USERNAME par ton nom d'utilisateur GitHub
git remote add origin https://github.com/USERNAME/pulse-montreal-events.git
git branch -M main
git push -u origin main
```

### 2. Connecter à Vercel
1. Va sur https://vercel.com
2. Clique "Add New..." → "Project"
3. Import ton repository `pulse-montreal-events`
4. Configure les variables d'environnement (voir ci-dessous)
5. Deploy!

## 🔐 Variables d'Environnement Vercel

### Variables Requises
- `TICKETMASTER_API_KEY` → Ton token Ticketmaster
- `NEXTAUTH_SECRET` → Génère avec: `openssl rand -base64 32`
- `NEXTAUTH_URL` → URL de ton site (ex: https://pulse-montreal.vercel.app)

### Variables Optionnelles
- `DATABASE_URL` → Si tu veux utiliser une vraie DB
- `NEXT_PUBLIC_SUPABASE_URL` → Pour Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Pour Supabase

## ⚡ Déploiement Automatique
Une fois connecté:
- `git push` → Déploiement automatique
- Preview branches pour les PRs
- Logs en temps réel
- HTTPS automatique

## 🎯 URLs Finales
- **Production**: https://ton-site.vercel.app
- **API**: https://ton-site.vercel.app/api/events-simple
- **Carte**: https://ton-site.vercel.app/carte

## 🔧 Troubleshooting
- Build fails? → Vérifie les variables d'env
- API errors? → Vérifie les tokens
- 404 errors? → Vérifie les routes Next.js
