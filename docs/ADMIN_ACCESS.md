# 🔐 Accès Admin - Guide

## Comment donner le rôle ADMIN à un utilisateur

### Méthode 1 : Script TypeScript (Recommandé)

1. Créer un compte normal sur le site (se connecter)

2. Donner le rôle ADMIN avec le script :

```bash
tsx scripts/make-admin.ts votre@email.com
```

**Exemple :**
```bash
tsx scripts/make-admin.ts pierre@pulse-montreal.com
```

### Méthode 2 : Prisma Studio (Interface graphique)

1. Lancer Prisma Studio :
```bash
npx prisma studio
```

2. Ouvrir la table `users`
3. Trouver votre utilisateur
4. Modifier le champ `role` : `USER` → `ADMIN`
5. Sauvegarder

### Méthode 3 : SQL Direct (Supabase)

1. Ouvrir Supabase SQL Editor
2. Exécuter :

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'votre@email.com';
```

3. Vérifier :
```sql
SELECT email, role FROM users WHERE email = 'votre@email.com';
```

---

## Pages Admin protégées

Une fois ADMIN, vous pouvez accéder à :

- `/admin/ingestion` - Dashboard ingestion d'événements
- `/admin/promotions` - Gestion des promotions

---

## Vérifier votre rôle

Pour vérifier si vous avez le rôle ADMIN :

1. Se connecter sur le site
2. Vérifier dans les logs ou via Prisma Studio
3. Essayer d'accéder à `/admin/ingestion`

---

## Troubleshooting

### Problème : "Accès non autorisé"

**Solution :** Votre compte n'a pas le rôle ADMIN. Utilisez une des méthodes ci-dessus.

### Problème : Redirection après connexion

**Solution :** C'est normal ! Après connexion, vous serez redirigé vers la page demandée (`callbackUrl`).

---

**Dernière mise à jour :** Janvier 2025








