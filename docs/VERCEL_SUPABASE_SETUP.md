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

### 2. Format de la DATABASE_URL pour Vercel (Serverless)

**Pour Vercel (serverless/edge functions), utilisez le Pooler Transaction Mode (port 6543)** :

```
postgresql://postgres:[PASSWORD]@db.abcdefghijklmnopqrst.supabase.co:6543/postgres
```

**Important** :
- Utilisez le port **6543** (Transaction mode) pour Vercel
- C'est l'URL directe mais avec le port 6543 (pas 5432)
- Pas besoin de paramètres `pgbouncer=true` ou `connection_limit=1`
- Le Transaction mode est idéal pour les fonctions serverless

**Alternative : Pooler Session Mode (si Transaction ne fonctionne pas)** :
```
postgresql://postgres.abcdefghijklmnopqrst:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 3. Obtenir la DATABASE_URL depuis Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Cliquez sur **"Connect"** en haut de la page
5. **Pour Vercel (serverless)** : Sélectionnez **"Transaction mode"** (port 6543)
   - Format : `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres`
6. **Alternative** : Si Transaction ne fonctionne pas, essayez **"Session mode"** (port 5432 sur pooler)
   - Format : `postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
7. Remplacez `[PASSWORD]` par votre mot de passe de base de données

### 4. Configuration Recommandée pour Vercel

**Option 1 : Transaction Mode (Recommandé pour Vercel)**
```
postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:6543/postgres
```

**Option 2 : Session Mode (Alternative)**
```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-0-ca-central-1.pooler.supabase.com:5432/postgres
```

**Note** : Le port `6543` est pour le Transaction mode (idéal pour serverless). Le port `5432` sur pooler est pour le Session mode.

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

**Transaction Mode (Recommandé pour serverless)** :
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres"
```

**Session Mode (Alternative)** :
```env
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Référence** : [Documentation Supabase - Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Support

Si le problème persiste :
1. Vérifier les logs Vercel pour plus de détails
2. Vérifier le statut de Supabase : https://status.supabase.com
3. Contacter le support Supabase si nécessaire

