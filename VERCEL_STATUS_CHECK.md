# ✅ État Actuel des Variables Vercel

## Variables Présentes (OK ✅)

D'après ta capture d'écran :

- ✅ `NEXT_PUBLIC_APP_URL` = `https://pulse-event.ca` (All Environments)
- ✅ `NEXTAUTH_URL` = `https://pulse-event.ca` (All Environments)
- ✅ `NEXTAUTH_SECRET` = présent (Production seulement ⚠️)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = présent (Production and Preview)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = présent (Production and Preview)
- ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = présent (All Environments)

## ⚠️ Variables OBLIGATOIRES Manquantes

D'après `scripts/checkEnv.ts`, ces variables sont **REQUISES** mais ne sont **pas visibles** dans ta capture :

### 1. DATABASE_URL (CRITIQUE ⚠️)

**Sans cette variable, Prisma ne peut pas se connecter à la base de données et le build échouera !**

```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres
```

**Comment l'ajouter :**
1. Va dans Vercel → Settings → Environment Variables
2. Clique "Add New"
3. Nom : `DATABASE_URL`
4. Valeur : Ton URL Supabase (voir ci-dessous)
5. Environnements : ✅ Production, ✅ Preview, ✅ Development
6. Clique "Save"

**Où trouver DATABASE_URL :**
- Va sur https://app.supabase.com
- Sélectionne ton projet
- Settings → Database
- Dans "Connection string", utilise **Transaction mode** (port 6543) pour Vercel
- Format : `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres`

### 2. CRON_SECRET (REQUIS)

**Sans cette variable, les endpoints CRON ne fonctionneront pas !**

```
CRON_SECRET = [génère avec: openssl rand -hex 32]
```

**Comment l'ajouter :**
1. Va dans Vercel → Settings → Environment Variables
2. Clique "Add New"
3. Nom : `CRON_SECRET`
4. Valeur : Génère avec `openssl rand -hex 32` (voir ci-dessous)
5. Environnements : ✅ Production, ✅ Preview, ✅ Development
6. Clique "Save"

**Générer CRON_SECRET :**
```bash
openssl rand -hex 32
```

## 🔧 Problèmes de Configuration Actuels

### Problème 1 : NEXTAUTH_SECRET seulement en Production

`NEXTAUTH_SECRET` est configuré seulement pour **Production**, pas pour **Preview** ni **Development**.

**Solution :**
1. Clique sur `NEXTAUTH_SECRET` dans Vercel
2. Modifie les environnements pour inclure : ✅ Production, ✅ Preview, ✅ Development
3. Sauvegarde

### Problème 2 : Variables Supabase seulement en Production/Preview

`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont configurés seulement pour **Production and Preview**, pas pour **Development**.

**Solution :**
1. Clique sur chaque variable Supabase
2. Modifie les environnements pour inclure : ✅ Production, ✅ Preview, ✅ Development
3. Sauvegarde

## 📋 Checklist Complète

- [ ] `DATABASE_URL` ajouté (URL Supabase Transaction mode, port 6543)
- [ ] `CRON_SECRET` ajouté (généré avec `openssl rand -hex 32`)
- [ ] `NEXTAUTH_SECRET` configuré pour Production, Preview, et Development
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configuré pour Production, Preview, et Development
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuré pour Production, Preview, et Development
- [ ] Redéploiement effectué après modifications

## 🚨 Pourquoi le Build Échoue Sans DATABASE_URL ?

- **Prisma** nécessite `DATABASE_URL` pour générer le client et exécuter les migrations
- Sans cette variable, le build Next.js échouera avec une erreur Prisma
- Les endpoints API qui utilisent Prisma ne fonctionneront pas

## 🚨 Pourquoi CRON_SECRET est Requis ?

- Les endpoints CRON (`/api/cron/*`) vérifient `CRON_SECRET` pour la sécurité
- Sans cette variable, les jobs CRON (ingestion, notifications, etc.) ne fonctionneront pas
- Le build peut passer, mais les fonctionnalités CRON échoueront

## ✅ Après Ajout des Variables

1. **Redéploie manuellement** :
   - Va dans **Deployments**
   - Clique sur les trois points (⋯) du dernier déploiement
   - Sélectionne **Redeploy**

2. **Vérifie les logs de build** :
   - Si le build échoue, consulte les logs dans Vercel
   - Les erreurs Prisma indiqueront si `DATABASE_URL` est manquant ou invalide

