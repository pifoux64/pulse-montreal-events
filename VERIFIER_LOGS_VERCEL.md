# 🔍 Vérifier les Logs Vercel pour Identifier l'Erreur

## ❌ Problème

L'erreur 500 persiste même avec un ancien déploiement qui fonctionnait avant. Il faut voir l'erreur exacte côté serveur.

## ✅ Solution : Consulter les Logs Vercel

### Étape 1 : Accéder aux Logs

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Functions** → **Logs** (ou **Runtime Logs**)
4. Ou allez dans **Deployments** → Cliquez sur le dernier déploiement → **Functions** → **Logs**

### Étape 2 : Filtrer les Erreurs

1. Dans les logs, cherchez les erreurs récentes
2. Filtrez par **"Error"** ou **"500"**
3. Regardez les logs autour de l'heure où vous avez testé le site

### Étape 3 : Identifier l'Erreur

Cherchez des messages comme :
- `Can't reach database server` → Problème de connexion DB
- `Connection refused` → Restrictions IP ou DB inaccessible
- `Authentication failed` → Mot de passe incorrect
- `Timeout` → Problème réseau
- `PrismaClientValidationError` → Erreur de requête Prisma
- Autre erreur spécifique

---

## 📋 Ce qu'il Faut Vérifier dans les Logs

### 1. Erreur de Connexion à la Base de Données

Si vous voyez :
```
Can't reach database server at `db.xxx.supabase.co:5432`
```

**Solution** : Vérifier les restrictions IP sur Supabase (voir `VERIFIER_RESTRICTIONS_IP.md`)

### 2. Erreur d'Authentification

Si vous voyez :
```
Authentication failed
password authentication failed
```

**Solution** : Vérifier que le mot de passe dans `DATABASE_URL` est correct

### 3. Erreur de Timeout

Si vous voyez :
```
Connection timeout
Operation timed out
```

**Solution** : Problème réseau ou base de données surchargée

### 4. Erreur Prisma

Si vous voyez :
```
PrismaClientValidationError
Invalid query
```

**Solution** : Problème dans le code de la requête Prisma

---

## 🔍 Comment Lire les Logs Vercel

### Format Typique des Logs

```
[timestamp] [level] [function] message
```

Exemple :
```
2025-01-15T10:30:45.123Z ERROR api/events/route.ts Can't reach database server
```

### Filtres Utiles

- **Niveau** : Error, Warn, Info
- **Fonction** : api/events/route.ts
- **Recherche** : "database", "error", "500"

---

## 🆘 Si Vous Ne Trouvez Pas les Logs

1. **Vérifiez que vous êtes sur le bon projet**
2. **Vérifiez que vous regardez les logs de Production** (pas Preview)
3. **Essayez de déclencher une nouvelle requête** en rafraîchissant le site, puis regardez les logs immédiatement après
4. **Vérifiez les logs de build** aussi (peut-être que le problème est au build)

---

## 💡 Astuce

**Copiez l'erreur exacte** des logs Vercel et partagez-la. Cela nous permettra d'identifier précisément le problème.

---

## 📝 Checklist

- [ ] Accédé aux logs Vercel (Functions → Logs)
- [ ] Filtré par "Error" ou "500"
- [ ] Trouvé l'erreur récente
- [ ] Identifié le type d'erreur (DB, auth, timeout, etc.)
- [ ] Noté l'erreur exacte pour diagnostic

