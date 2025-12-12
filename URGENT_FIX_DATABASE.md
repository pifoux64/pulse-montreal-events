# 🚨 URGENT - Correction Erreur 500 : Connexion Base de Données

## ❌ Problème Actuel

L'API retourne une erreur 500 car Vercel ne peut pas se connecter à Supabase :
```
Can't reach database server at `db.dtveugfincrygcgsuyxo.supabase.co:5432`
```

**⚠️ CAUSE IDENTIFIÉE** : Vous utilisez l'URL **directe** de la base de données au lieu de l'URL du **pooler**.

**Impact** : 
- ❌ Page d'accueil : 0 événements
- ❌ Page carte : 0 événements  
- ❌ Toutes les pages qui chargent des événements

## ✅ Solution : Configurer DATABASE_URL sur Vercel

### Étape 1 : Obtenir la DATABASE_URL depuis Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. **IMPORTANT** : Dans la section **Connection string**, vous verrez plusieurs options :
   - ❌ **Direct connection** : `db.xxx.supabase.co:5432` → **NE PAS UTILISER** (ne fonctionne pas sur Vercel)
   - ✅ **Connection pooling** : `xxx.pooler.supabase.com:5432` → **UTILISER CELUI-CI**
5. Sélectionnez **Connection pooling** → **Session mode** → **URI**
6. Copiez la chaîne de connexion qui ressemble à :
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
   ```
   **OU** (selon votre région) :
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
   ```
7. **Important** : Remplacez `[PASSWORD]` par votre mot de passe de base de données Supabase

### Étape 2 : Ajouter les paramètres requis

Ajoutez ces paramètres à la fin de l'URL (après `postgres`) :
```
?pgbouncer=true&connection_limit=1
```

**URL finale devrait ressembler à** :
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### Étape 3 : Configurer sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `montreal-events` (ou le nom de votre projet)
3. Allez dans **Settings** → **Environment Variables**
4. Cherchez `DATABASE_URL` :
   - Si elle existe : **Modifiez-la** avec la nouvelle valeur
   - Si elle n'existe pas : **Ajoutez-la** avec la nouvelle valeur
5. **Important** : Sélectionnez tous les environnements (Production, Preview, Development)
6. Cliquez sur **Save**

### Étape 4 : Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Ou faites un nouveau commit pour déclencher un nouveau déploiement

### Étape 5 : Vérifier

1. Attendez 1-2 minutes que le déploiement se termine
2. Rafraîchissez votre site https://pulse-event.ca
3. L'erreur 500 devrait disparaître
4. Les événements devraient s'afficher

## 🔍 Vérification : Identifier le Problème

### ❌ URL Directe (NE FONCTIONNE PAS sur Vercel)
Si votre `DATABASE_URL` ressemble à :
```
postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres
```
→ **C'est l'URL directe, elle ne fonctionne pas sur Vercel !**

### ✅ URL Pooler (FONCTIONNE sur Vercel)
Votre `DATABASE_URL` doit ressembler à :
```
postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```
→ **C'est l'URL du pooler, elle fonctionne sur Vercel !**

### Comment trouver l'URL du pooler dans Supabase :
1. Supabase Dashboard → Settings → Database
2. Section **Connection pooling**
3. Choisir **Session mode** (pas Transaction)
4. Copier l'URI qui contient `.pooler.supabase.com`

## ⚠️ Erreurs Courantes

### "Variable not found"
- ✅ Vérifiez que vous avez bien ajouté `DATABASE_URL` (pas `DATABASE_URL_PROD` ou autre)
- ✅ Vérifiez que vous avez sélectionné tous les environnements

### "Connection timeout"
- ✅ Vérifiez que le mot de passe est correct
- ✅ Vérifiez que le pooler Supabase est activé
- ✅ Essayez la connexion directe (port 6543)

### "Still getting 500"
- ✅ Vérifiez les logs Vercel : **Functions** → **Logs**
- ✅ Vérifiez que le redéploiement est terminé
- ✅ Attendez 2-3 minutes après le redéploiement

## 📝 Note

Les erreurs de Service Worker (`sw.js`) et de manifest sont **non bloquantes** et peuvent être ignorées. Elles viennent d'extensions Chrome.

---

**Une fois `DATABASE_URL` correctement configurée, l'erreur 500 disparaîtra et les événements s'afficheront normalement.**

