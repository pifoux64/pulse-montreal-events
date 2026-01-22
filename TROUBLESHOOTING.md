# 🔧 Guide de Dépannage - Erreurs "Failed to fetch" et 503

## 🚨 Problème : Erreurs "Failed to fetch" et 503

Ces erreurs indiquent que le serveur Next.js ou les routes API ne répondent pas correctement.

## ✅ Solutions rapides

### 1. Vérifier que le serveur est lancé

```bash
# Vérifier si le serveur tourne
curl http://localhost:3000

# Si erreur, lancer le serveur
npm run dev
```

### 2. Vérifier les routes API

```bash
# Tester une route API directement
curl http://localhost:3000/api/events?pageSize=10

# Tester la route trending
curl http://localhost:3000/api/trending?scope=today&limit=6
```

### 3. Vérifier la base de données

```bash
# Vérifier la connexion à la base de données
npx prisma db push --accept-data-loss --skip-generate

# Vérifier que Prisma Client est généré
npx prisma generate
```

### 4. Nettoyer le cache Next.js

```bash
# Supprimer le dossier .next
rm -rf .next

# Relancer le serveur
npm run dev
```

## 🔍 Diagnostic détaillé

### Erreur "Failed to fetch"

**Causes possibles :**
- Le serveur Next.js n'est pas lancé
- Le serveur est lancé sur un autre port
- Problème de réseau/CORS
- Timeout de la requête

**Solutions :**
1. Vérifier que `npm run dev` est lancé
2. Vérifier le port (par défaut : 3000)
3. Vérifier la console du serveur pour les erreurs
4. Vérifier les logs du navigateur (DevTools → Network)

### Erreur 503 "Service Unavailable"

**Causes possibles :**
- La route API ne répond pas
- Erreur dans le code de la route API
- Base de données inaccessible
- Timeout de la requête

**Solutions :**
1. Vérifier les logs du serveur
2. Vérifier que la route API existe (`src/app/api/...`)
3. Vérifier la connexion à la base de données
4. Vérifier les variables d'environnement (`.env`)

### Erreur NextAuth "CLIENT_FETCH_ERROR"

**Causes possibles :**
- NextAuth ne peut pas se connecter au serveur
- Configuration NextAuth incorrecte
- Problème avec la session

**Solutions :**
1. Vérifier `NEXTAUTH_URL` dans `.env`
2. Vérifier `NEXTAUTH_SECRET` dans `.env`
3. Vérifier la configuration dans `src/lib/auth.ts`
4. Vérifier que la base de données est accessible

## 📋 Checklist de vérification

- [ ] Serveur Next.js lancé (`npm run dev`)
- [ ] Port 3000 accessible
- [ ] Base de données accessible (Supabase)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Prisma Client généré (`npx prisma generate`)
- [ ] Pas d'erreurs dans la console du serveur
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Routes API existent et sont accessibles

## 🛠️ Commandes utiles

```bash
# Vérifier les variables d'environnement
npm run checkenv

# Vérifier la configuration Prisma
npx prisma validate

# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio (pour inspecter la DB)
npx prisma studio

# Vérifier les types TypeScript
npm run typecheck

# Lancer les tests
npm test
```

## 🔗 Routes API à vérifier

Les routes suivantes sont appelées par HomePage :

1. `/api/events` - Liste des événements
2. `/api/trending` - Événements tendance
3. `/api/editorial/pulse-picks/public` - Top 5 publiés
4. `/api/recommendations` - Recommandations personnalisées (si connecté)

Testez chaque route individuellement :

```bash
curl http://localhost:3000/api/events?pageSize=10
curl http://localhost:3000/api/trending?scope=today&limit=6
curl http://localhost:3000/api/editorial/pulse-picks/public?limit=3
```

## 💡 Conseils

1. **Toujours vérifier les logs du serveur** : Les erreurs sont souvent visibles dans le terminal où `npm run dev` est lancé
2. **Utiliser DevTools** : Ouvrez les DevTools du navigateur (F12) et regardez l'onglet Network pour voir les requêtes qui échouent
3. **Vérifier la console** : Les erreurs JavaScript sont affichées dans la console du navigateur
4. **Tester les routes API directement** : Utilisez `curl` ou Postman pour tester les routes API sans passer par le frontend

## 🆘 Si le problème persiste

1. Vérifier les logs détaillés du serveur
2. Vérifier les logs de Supabase (si utilisé)
3. Vérifier la configuration réseau/firewall
4. Vérifier que tous les services externes sont accessibles (Supabase, Stripe, OpenAI, etc.)
