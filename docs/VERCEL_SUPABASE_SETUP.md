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
4. Dans la section **Connection string** ou **Connection info**, vous verrez plusieurs options :
   - **Direct connection** (port 5432) - Ne pas utiliser pour Vercel
   - **Transaction mode** (port 6543) - ✅ **Recommandé pour Vercel**
   - **Session mode** (port 5432 sur pooler) - Alternative
5. **Pour Vercel (serverless)** : Utilisez l'URL **Transaction mode** (port 6543)
   - Format : `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres`
6. **Alternative** : Si Transaction ne fonctionne pas, utilisez **Session mode**
   - Format : `postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
7. Remplacez `[PASSWORD]` par votre mot de passe de base de données (encodez les caractères spéciaux en URL : `!` = `%21`, `@` = `%40`, `#` = `%23`)

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

### 5. Vérifier les restrictions IP sur Supabase (si disponible)

**Note** : Dans certaines versions de Supabase, les restrictions IP peuvent être dans :
- **Settings** → **Database** → **Network restrictions** (ou **IP restrictions**)
- Ou dans **Settings** → **Database** → **Connection pooling** → **IP Allowlist**

Si vous ne trouvez pas cette section, le pooler est probablement configuré pour accepter toutes les connexions par défaut.

**Si vous avez des problèmes de connexion** :
1. Vérifiez les logs Vercel pour voir l'erreur exacte
2. Essayez d'abord le Transaction Mode (port 6543) - c'est généralement le plus compatible avec Vercel
3. Si ça ne fonctionne pas, contactez le support Supabase pour vérifier les restrictions IP

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

### "prepared statement already exists" (Erreur Prisma)
- ✅ Cette erreur est automatiquement résolue par le code qui ajoute `?pgbouncer=true` pour le pooler Supabase
- ✅ Pour le pooler Supabase (pooler.supabase.com), utiliser `pgbouncer=true` au lieu de `prepare=false`
- ✅ Format recommandé pour pooler : `postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
- ✅ Format recommandé pour Transaction mode direct : `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true`

## Configuration recommandée pour Vercel

**Transaction Mode avec Pooler (Recommandé pour serverless)** :
```env
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Transaction Mode Direct (Alternative)** :
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
```

**Session Mode (Alternative)** :
```env
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"
```

**Note** : Le paramètre `?pgbouncer=true` est automatiquement ajouté par le code en production pour le pooler Supabase afin d'éviter l'erreur "prepared statement already exists" avec Prisma dans les environnements serverless.

**Référence** : [Documentation Supabase - Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Stockage (Storage) – bucket "events"

L’upload d’images d’événements (page Publier) utilise le bucket Supabase **events**.

### Erreur « new row violates row-level security policy »

Cette erreur apparaît quand l’API utilise la **clé anon** au lieu de la **clé service role**. Le Storage Supabase applique alors les règles RLS et refuse l’insertion.

**À faire** : Définir **SUPABASE_SERVICE_ROLE_KEY** (et pas seulement `NEXT_PUBLIC_SUPABASE_ANON_KEY`) :

1. [Supabase](https://app.supabase.com) → votre projet → **Settings** → **API**.
2. Dans **Project API keys**, copiez la clé **service_role** (secret).
3. Sur Vercel : **Settings** → **Environment Variables** → ajoutez `SUPABASE_SERVICE_ROLE_KEY` avec cette valeur.
4. Redéployez le projet.

L’API d’upload utilise uniquement la clé service role pour le Storage ; elle ne retombe plus sur la clé anon, ce qui évite l’erreur RLS.

### Erreur « Le bucket de stockage "events" n'existe pas »

1. **Création automatique** : L’API tente de créer le bucket si `SUPABASE_SERVICE_ROLE_KEY` est définie.
2. **Création manuelle** : Supabase → **Storage** → **New bucket** → nom **events** → cochez **Public** → Create.

Sans bucket "events" ou sans clé service role, les images téléversées depuis le formulaire de publication ne pourront pas être enregistrées.

## Support

Si le problème persiste :
1. Vérifier les logs Vercel pour plus de détails
2. Vérifier le statut de Supabase : https://status.supabase.com
3. Contacter le support Supabase si nécessaire

