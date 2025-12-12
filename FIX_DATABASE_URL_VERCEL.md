# 🔧 Correction DATABASE_URL pour Vercel

## ❌ Problème Actuel

Votre `DATABASE_URL` actuelle (en local ET sur Vercel) :
```
postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require
```

**Cette URL utilise la connexion DIRECTE** (`db.xxx.supabase.co`) qui :
- ✅ Fonctionne en local (votre machine)
- ❌ Ne fonctionne PAS sur Vercel (serverless)

## ✅ Solution : Utiliser le Pooler sur Vercel

### Étape 1 : Obtenir l'URL du Pooler depuis Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Faites défiler jusqu'à la section **"Connection pooling"**
5. Vous verrez deux modes :
   - **Session mode** (recommandé pour Vercel)
   - **Transaction mode**
6. Cliquez sur **"Session mode"**
7. Sélectionnez **"URI"** (pas "JDBC" ou autre)
8. Copiez l'URL qui ressemble à :
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
   ```

### Étape 2 : Construire l'URL Complète pour Vercel

Votre URL du pooler devrait ressembler à :
```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

**Important** :
- Remplacez `[PROJECT-REF]` par `dtveugfincrygcgsuyxo` (votre référence de projet)
- Gardez le même mot de passe : `Pulse2025%21%40%23` (encodé en URL)
- L'URL doit contenir `.pooler.supabase.com` (pas `db.xxx.supabase.co`)
- Ajoutez `?pgbouncer=true&connection_limit=1&sslmode=require` à la fin

### Étape 3 : Trouver la Région du Pooler

Si vous ne voyez pas la région dans Supabase :

1. Dans Supabase Dashboard → Settings → Database
2. Regardez l'URL de connexion directe : `db.dtveugfincrygcgsuyxo.supabase.co`
3. La région est généralement dans l'URL du pooler, par exemple :
   - `aws-0-ca-central-1.pooler.supabase.com` (Canada Central)
   - `aws-0-us-east-1.pooler.supabase.com` (US East)
   - etc.

**Alternative** : Si vous ne trouvez pas la région exacte, essayez :
```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

### Étape 4 : Configurer sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Trouvez `DATABASE_URL`
5. **Modifiez-la** avec la nouvelle URL du pooler
6. **Important** : Sélectionnez tous les environnements (Production, Preview, Development)
7. Cliquez sur **Save**

### Étape 5 : Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez 1-2 minutes

### Étape 6 : Vérifier

1. Rafraîchissez votre site https://pulse-event.ca
2. L'erreur 500 devrait disparaître
3. Les événements devraient s'afficher

## 📝 Note : Configuration Locale

Vous pouvez **garder l'URL directe en local** si elle fonctionne :
```
DATABASE_URL="postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require"
```

**Mais sur Vercel, vous DEVEZ utiliser le pooler** :
```
DATABASE_URL="postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
```

## 🔍 Comment Vérifier que l'URL est Correcte

L'URL du pooler doit :
- ✅ Contenir `.pooler.supabase.com` (pas `db.xxx.supabase.co`)
- ✅ Avoir le format `postgres.[PROJECT-REF]` (pas juste `postgres`)
- ✅ Contenir `?pgbouncer=true&connection_limit=1`
- ✅ Avoir le port `5432` (pas `6543`)

## ⚠️ Si ça ne fonctionne toujours pas

1. Vérifiez les logs Vercel : **Functions** → **Logs**
2. Vérifiez que le redéploiement est terminé
3. Attendez 2-3 minutes après le redéploiement
4. Vérifiez que la variable `DATABASE_URL` est bien définie pour l'environnement Production

