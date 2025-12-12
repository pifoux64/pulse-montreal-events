# 🔧 Dépannage Avancé - Connexion Base de Données Vercel

## ❌ Problème Persistant

Même avec l'URL du pooler correcte, l'erreur persiste :
```
Can't reach database server at `aws-1-ca-central-1.pooler.supabase.com:5432`
```

## 🔍 Vérifications à Faire

### 1. Vérifier que le Pooler est Activé sur Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Section **"Connection pooling"**
5. **Vérifiez que le pooler est activé** (il devrait l'être par défaut)
6. Si ce n'est pas le cas, activez-le

### 2. Vérifier les Restrictions IP sur Supabase

1. Dans Supabase Dashboard → **Settings** → **Database**
2. Section **"Connection pooling"** → **"IP Allowlist"**
3. **Vérifiez que les IPs de Vercel ne sont pas bloquées**
4. **Solution** : Autorisez toutes les IPs (0.0.0.0/0) pour le pooler
   - Cliquez sur **"Add IP"** ou **"Allow all"**
   - Entrez `0.0.0.0/0` pour autoriser toutes les IPs

### 3. Vérifier que la Variable est Bien Définie sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Vérifiez que `DATABASE_URL` :
   - ✅ Existe bien
   - ✅ Est définie pour **Production** (pas seulement Preview/Development)
   - ✅ Contient bien l'URL complète avec `pgbouncer=true&connection_limit=1`
   - ✅ N'a pas d'espaces ou de caractères invisibles

### 4. Vérifier les Logs Vercel

1. Allez sur Vercel Dashboard → **Functions** → **Logs**
2. Regardez les erreurs récentes
3. Cherchez des messages comme :
   - "Connection refused"
   - "Timeout"
   - "Authentication failed"
   - "Invalid password"

### 5. Essayer le Port 6543 (Transaction Mode)

Si le port 5432 ne fonctionne pas, essayez le port **6543** (Transaction mode) :

```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

**Note** : Le port 6543 est pour le mode "Transaction", le port 5432 est pour le mode "Session".

### 6. Vérifier le Format de l'URL (Encodage)

Assurez-vous que le mot de passe est correctement encodé :
- `!` = `%21`
- `@` = `%40`
- `#` = `%23`

Votre mot de passe `Pulse2025!@#` doit être encodé en `Pulse2025%21%40%23`.

### 7. Essayer Sans Paramètres SSL

Parfois, le paramètre `sslmode=require` peut causer des problèmes. Essayez sans :

```
postgresql://postgres.dtveugfincrygcgsuyxo:Pulse2025%21%40%23@aws-1-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### 8. Vérifier la Région

Assurez-vous que la région dans l'URL correspond à votre projet Supabase :
- `aws-1-ca-central-1` = Canada Central 1
- Si votre projet est dans une autre région, l'URL sera différente

Pour vérifier :
1. Supabase Dashboard → **Settings** → **General**
2. Regardez la **"Region"** de votre projet
3. L'URL du pooler doit correspondre à cette région

## 🔄 Solutions Alternatives

### Solution 1 : Utiliser Direct Connection avec Port 6543

Si le pooler ne fonctionne toujours pas, essayez la connexion directe avec le port 6543 :

```
postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:6543/postgres?sslmode=require
```

**Note** : Cette solution est moins recommandée mais peut fonctionner temporairement.

### Solution 2 : Vérifier le Mot de Passe

1. Allez sur Supabase Dashboard → **Settings** → **Database**
2. Section **"Database password"**
3. Vérifiez que le mot de passe est bien `Pulse2025!@#`
4. Si nécessaire, réinitialisez-le et mettez à jour l'URL

### Solution 3 : Créer une Nouvelle Variable d'Environnement

1. Sur Vercel, **supprimez** complètement la variable `DATABASE_URL`
2. **Créez-en une nouvelle** avec l'URL complète
3. Assurez-vous de sélectionner **Production**
4. Redéployez

## 📋 Checklist Complète

- [ ] Pooler activé sur Supabase
- [ ] Restrictions IP autorisées (0.0.0.0/0)
- [ ] Variable `DATABASE_URL` définie pour Production sur Vercel
- [ ] URL contient `pgbouncer=true&connection_limit=1`
- [ ] Mot de passe correctement encodé
- [ ] Redéploiement effectué après modification
- [ ] Attendu 2-3 minutes après redéploiement
- [ ] Logs Vercel consultés pour erreurs détaillées

## 🆘 Si Rien Ne Fonctionne

1. **Contactez le support Supabase** : Vérifiez que votre projet n'a pas de restrictions spéciales
2. **Vérifiez les logs Vercel** : Functions → Logs pour voir l'erreur exacte
3. **Testez en local** : Vérifiez que la même URL fonctionne en local avec `npx prisma db pull`
4. **Créez un nouveau projet Supabase** : Si le problème persiste, créez un nouveau projet pour tester

## 📝 Note Importante

Les fonctions serverless de Vercel nécessitent absolument le pooler. Si le pooler ne fonctionne pas, il y a probablement un problème de configuration côté Supabase (restrictions IP, pooler désactivé, etc.).

