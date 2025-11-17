# 🔗 Comment trouver votre DATABASE_URL dans Supabase

## Méthode 1 : Via Settings → Database (Recommandé)

1. **Connectez-vous** à [supabase.com](https://supabase.com) et sélectionnez votre projet
2. Dans le menu de gauche, cliquez sur **"Settings"** (⚙️)
3. Cliquez sur **"Database"** dans le sous-menu
4. Faites défiler jusqu'à la section **"Connection string"** ou **"Connection pooling"**
5. Vous verrez plusieurs options :
   - **"URI"** ou **"Connection string"** : C'est celle que vous cherchez
   - **"Session mode"** : Pour les connexions directes (port 5432)
   - **"Transaction mode"** : Pour le connection pooling (port 6543)

## Méthode 2 : Via le Project Settings

1. Cliquez sur l'icône **⚙️ Settings** en bas à gauche
2. Allez dans **"Project Settings"**
3. Cliquez sur **"Database"** dans le menu latéral
4. Cherchez la section **"Connection string"**

## Méthode 3 : Via l'API

1. Allez dans **Settings** → **API**
2. Cherchez la section **"Database"** ou **"Config"**
3. Vous trouverez l'URL de connexion là

## Format de la connection string

La connection string ressemble à ceci :

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Important** : Remplacez `[YOUR-PASSWORD]` par le mot de passe de votre base de données.

## Si vous avez oublié le mot de passe

1. Allez dans **Settings** → **Database**
2. Cherchez **"Database password"** ou **"Reset database password"**
3. Vous pouvez réinitialiser le mot de passe
4. **Attention** : Cela changera le mot de passe, vous devrez mettre à jour toutes vos applications

## Connection Pooling (Recommandé pour la production)

Pour de meilleures performances, utilisez le connection pooling :

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

Notez le port **6543** au lieu de **5432**.

## Vérification

Une fois que vous avez copié la connection string, testez-la :

```bash
# Dans votre terminal
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
npx prisma db pull
```

Si ça fonctionne, ajoutez-la à votre `.env.local` :

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```






