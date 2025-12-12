# ⚠️ Important : Redéploiement et Variables d'Environnement

## ❌ Réponse Courte

**NON**, redéployer un ancien déploiement sur Vercel **ne remet PAS** les anciennes variables d'environnement.

**Vercel utilise TOUJOURS les variables d'environnement ACTUELLES**, même quand vous redéployez un ancien déploiement.

---

## 🔍 Comment Vercel Gère les Variables d'Environnement

### Quand Vous Redéployez un Ancien Déploiement

1. Vercel utilise le **code** de l'ancien déploiement
2. Mais Vercel utilise les **variables d'environnement ACTUELLES** (celles configurées maintenant)
3. **Les variables d'environnement ne sont PAS restaurées** avec l'ancien déploiement

### Pourquoi ?

Les variables d'environnement sont stockées **séparément** du code. Quand vous redéployez, Vercel :
- Prend le code de l'ancien commit/déploiement
- Utilise les variables d'environnement actuelles de votre projet

---

## ✅ Comment Vérifier les Variables Actuelles

### Méthode 1 : Via l'Interface Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Regardez la valeur actuelle de `DATABASE_URL`
5. **C'est cette valeur qui est utilisée**, même si vous redéployez un ancien déploiement

### Méthode 2 : Via les Logs de Build

1. Allez dans **Deployments** → Cliquez sur le dernier déploiement
2. Allez dans **Build Logs**
3. Cherchez des références à `DATABASE_URL` (peut être masquée pour sécurité)
4. Ou cherchez des erreurs de connexion qui mentionnent l'URL

---

## 🔄 Si Vous Voulez Restaurer les Anciennes Variables

### Option 1 : Restaurer Manuellement

1. Si vous savez quelle était l'ancienne valeur de `DATABASE_URL`
2. Allez dans **Settings** → **Environment Variables**
3. Modifiez `DATABASE_URL` avec l'ancienne valeur
4. Redéployez

### Option 2 : Vérifier dans un Ancien Déploiement

1. Allez dans **Deployments**
2. Trouvez un déploiement qui fonctionnait
3. Regardez les **Build Logs** ou **Function Logs**
4. Cherchez des indices sur la configuration utilisée
5. **Note** : Les valeurs peuvent être masquées pour sécurité

---

## ⚠️ Problème Actuel

Si vous avez :
1. Modifié `DATABASE_URL` récemment (en important `.env.local`)
2. Redéployé un ancien déploiement

**Le redéploiement utilise toujours la NOUVELLE valeur de `DATABASE_URL`**, pas l'ancienne.

---

## ✅ Solution

### Si Vous Voulez Utiliser l'Ancienne Configuration

1. **Restaurez manuellement** l'ancienne valeur de `DATABASE_URL` :
   - Allez dans **Settings** → **Environment Variables**
   - Modifiez `DATABASE_URL` avec l'ancienne valeur
   - Redéployez

### Si Vous Ne Connaissez Pas l'Ancienne Valeur

1. **Vérifiez les logs** d'un ancien déploiement qui fonctionnait
2. **Testez différentes configurations** :
   - URL directe : `postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require`
   - URL pooler : `postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require`

---

## 📋 Checklist

- [ ] Vérifié les variables d'environnement actuelles sur Vercel
- [ ] Compris que redéployer n'utilise PAS les anciennes variables
- [ ] Restauré manuellement l'ancienne `DATABASE_URL` si nécessaire
- [ ] Redéployé après avoir restauré les variables

---

## 💡 Astuce

**Les variables d'environnement sont indépendantes du code.** Même si vous redéployez un ancien commit, Vercel utilisera toujours les variables d'environnement configurées actuellement dans les Settings du projet.

