# ⚠️ Variables Manquantes sur Vercel

## 🔍 Variables Visibles (OK ✅)
- ✅ `NEXT_PUBLIC_APP_URL` = `https://pulse-event.ca`
- ✅ `CRON_SECRET` = présent
- ✅ `NEXTAUTH_URL` = `https://pulse-event.ca`
- ✅ `SPOTIFY_CLIENT_ID` = présent
- ✅ `SPOTIFY_CLIENT_SECRET` = présent
- ✅ `DATABASE_URL` = présent
- ✅ `DISABLE_TAG_ENRICHMENT` = présent

## ❌ Variables OBLIGATOIRES Manquantes

D'après `scripts/checkEnv.ts`, ces variables sont **REQUISES** mais ne sont pas visibles dans ta capture :

### 1. NEXTAUTH_SECRET (CRITIQUE ⚠️)
```
NEXTAUTH_SECRET = [génère avec: openssl rand -base64 32]
```
**Sans cette variable, NextAuth ne fonctionnera pas et le build peut échouer !**

### 2. NEXT_PUBLIC_SUPABASE_URL (REQUIS)
```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
```

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY (REQUIS)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 Solution : Ajouter les Variables Manquantes

1. **Va dans Vercel → Settings → Environment Variables**

2. **Ajoute ces 3 variables OBLIGATOIRES** :

   ```
   NEXTAUTH_SECRET = [génère avec: openssl rand -base64 32]
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Générer NEXTAUTH_SECRET** :
   ```bash
   openssl rand -base64 32
   ```
   Copie le résultat et colle-le dans Vercel.

4. **Récupérer les clés Supabase** :
   - Va sur https://app.supabase.com
   - Sélectionne ton projet
   - Settings → API
   - Copie "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copie "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Assure-toi que toutes les variables sont configurées pour** :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. **Redéploie** :
   - Deployments → ⋯ → Redeploy

## 📋 Checklist Complète

- [ ] `NEXTAUTH_SECRET` ajouté (généré avec `openssl rand -base64 32`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ajouté
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ajouté
- [ ] Toutes les variables configurées pour Production/Preview/Development
- [ ] Redéploiement effectué

## 🚨 Pourquoi le Build Échoue Sans Ces Variables ?

- **NEXTAUTH_SECRET** : NextAuth ne peut pas initialiser sans cette variable
- **NEXT_PUBLIC_SUPABASE_URL/KEY** : Prisma et certaines fonctionnalités en dépendent

Une fois ces variables ajoutées, le déploiement devrait fonctionner !

