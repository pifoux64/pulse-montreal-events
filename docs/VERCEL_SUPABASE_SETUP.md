# 🔧 Configuration Supabase sur Vercel

## Problème

L'erreur indique que Vercel ne peut pas se connecter à Supabase :
```
Can't reach database server at `aws-1-ca-central-1.pooler.supabase.com:5432`
```

## Solutions

### 1. Vérifier la variable d'environnement DATABASE_URL sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `montreal-events`
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que `DATABASE_URL` est bien définie

### 2. Format de la DATABASE_URL

La `DATABASE_URL` doit être au format :
```
postgresql://postgres:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**Important** :
- Utilisez le **pooler** (`pooler.supabase.com`) pour Vercel, pas la connexion directe
- Le paramètre `pgbouncer=true` est nécessaire
- Le paramètre `connection_limit=1` est recommandé pour éviter les problèmes de connexion

### 3. Obtenir la DATABASE_URL depuis Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Dans la section **Connection string**, sélectionnez **URI** (pas Transaction)
5. Copiez la chaîne de connexion
6. Remplacez `[YOUR-PASSWORD]` par votre mot de passe de base de données

### 4. Utiliser la connexion directe (alternative)

Si le pooler ne fonctionne pas, vous pouvez utiliser la connexion directe :

```
postgresql://postgres:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

**Note** : Le port `6543` est pour la connexion directe (sans pooler).

### 5. Vérifier les restrictions IP sur Supabase

1. Allez dans **Settings** → **Database** → **Connection pooling**
2. Vérifiez que les IPs de Vercel ne sont pas bloquées
3. Si nécessaire, autorisez toutes les IPs (0.0.0.0/0) pour le pooler

### 6. Redéployer après modification

Après avoir modifié la variable d'environnement sur Vercel :
1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou faites un nouveau commit pour déclencher un nouveau déploiement

## Vérification

Pour vérifier que la connexion fonctionne :

1. Allez sur votre site en production
2. Vérifiez les logs Vercel (Functions → Logs)
3. L'erreur de connexion devrait disparaître

## Erreurs courantes

### "Can't reach database server"
- ✅ Vérifier que `DATABASE_URL` est bien définie sur Vercel
- ✅ Vérifier que le format de l'URL est correct
- ✅ Vérifier que le pooler Supabase est activé

### "Connection timeout"
- ✅ Vérifier les restrictions IP sur Supabase
- ✅ Essayer la connexion directe (port 6543) au lieu du pooler

### "Too many connections"
- ✅ Utiliser `connection_limit=1` dans la DATABASE_URL
- ✅ Vérifier que Prisma utilise bien le singleton pattern

## Configuration recommandée pour Vercel

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

## Support

Si le problème persiste :
1. Vérifier les logs Vercel pour plus de détails
2. Vérifier le statut de Supabase : https://status.supabase.com
3. Contacter le support Supabase si nécessaire

