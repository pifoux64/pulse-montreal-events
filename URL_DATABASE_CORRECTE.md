# ✅ URL DATABASE_URL Correcte pour Vercel

## ❌ URL Actuelle (INCORRECTE)

```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Problème** : Il manque les paramètres `pgbouncer=true&connection_limit=1` qui sont **ESSENTIELS** pour Vercel.

## ✅ URL Correcte pour Vercel

```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

**Différence** : Ajout de `pgbouncer=true&connection_limit=1&` avant `sslmode=require`

## 📋 Étapes pour Corriger sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Trouvez `DATABASE_URL`
5. **Remplacez** par cette URL complète :
   ```
   postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
   ```
6. **Important** : 
   - Sélectionnez tous les environnements (Production, Preview, Development)
   - Cliquez sur **Save**
7. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** (⋯) du dernier déploiement
   - Sélectionnez **Redeploy**
   - Attendez 1-2 minutes

## 🔍 Vérification

Après le redéploiement :
1. Attendez 2-3 minutes
2. Rafraîchissez votre site https://pulse-event.ca
3. L'erreur 500 devrait disparaître
4. Les événements devraient s'afficher

## ⚠️ Si ça ne fonctionne toujours pas

1. Vérifiez les logs Vercel : **Functions** → **Logs**
2. Vérifiez que la variable est bien définie pour **Production**
3. Vérifiez que le redéploiement est terminé
4. Essayez de supprimer et recréer la variable `DATABASE_URL`

## 📝 Note : Configuration Locale

Vous pouvez garder votre URL actuelle en local (`.env.local`) :
```
DATABASE_URL="postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require"
```

Mais sur Vercel, vous DEVEZ utiliser l'URL complète avec les paramètres `pgbouncer=true&connection_limit=1`.

